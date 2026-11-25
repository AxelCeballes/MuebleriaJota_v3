const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

const MAXIMO_ITEMS = 50;
const MAXIMO_CLAVE_IDEMPOTENCIA = 128;
const PATRON_OBJECT_ID = /^[a-f\d]{24}$/i;

const asyncHandler = (handler) => (request, response, next) =>
  Promise.resolve(handler(request, response, next)).catch(next);

const crearErrorDePedido = (status, message, errors) => {
  const error = new Error(message);
  error.status = status;
  error.esErrorDePedido = true;
  if (errors) {
    error.errors = errors;
  }
  return error;
};

const redondearCentavos = (valor) => Math.round(valor * 100);

// Normaliza un precio a 2 decimales y devuelve su valor en centavos (entero).
// Ej: 150.256 -> 15026 centavos; 150.2 -> 15000 centavos.
// Este valor entero se usa para el total; al dividir entre 100 se obtiene el
// precioUnitario con exactamente 2 decimales, evitando errores de precision.
const normalizarPrecioaCentavos = (precio) => {
  const centavos = redondearCentavos(precio);
  return centavos; // entero, se divide entre 100 para mostrar 2 decimales
};

const serializarPedido = (pedido) => ({
  _id: pedido._id.toString(),
  usuario: pedido.usuario.toString(),
  items: pedido.items.map((item) => ({
    producto: item.producto.toString(),
    nombre: item.nombre,
    precioUnitario: item.precioUnitario,
    cantidad: item.cantidad,
  })),
  total: pedido.total,
  estado: pedido.estado,
  createdAt: pedido.createdAt,
  updatedAt: pedido.updatedAt,
});

const validarItems = (items) => {
  const errores = [];
  const normalizados = [];

  if (!Array.isArray(items) || items.length === 0) {
    return {
      errores: ['El pedido debe incluir al menos un producto.'],
      items: normalizados,
    };
  }

  if (items.length > MAXIMO_ITEMS) {
    errores.push(`El pedido no puede incluir más de ${MAXIMO_ITEMS} productos distintos.`);
  }

  const idsVistos = new Set();

  items.forEach((item, indice) => {
    const numero = indice + 1;

    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errores.push(`El ítem ${numero} del pedido no es válido.`);
      return;
    }

    const { producto, cantidad } = item;

    if (typeof producto !== 'string' || !PATRON_OBJECT_ID.test(producto)) {
      errores.push(`El producto del ítem ${numero} no tiene un ID válido.`);
    } else if (idsVistos.has(producto.toLowerCase())) {
      errores.push(`El producto del ítem ${numero} está repetido en el pedido.`);
    } else {
      idsVistos.add(producto.toLowerCase());
    }

    if (!Number.isSafeInteger(cantidad) || cantidad < 1) {
      errores.push(`La cantidad del ítem ${numero} debe ser un número entero mayor o igual a uno.`);
    }

    if (errores.length === 0) {
      normalizados.push({ producto: producto.toLowerCase(), cantidad });
    }
  });

  if (errores.length > 0) {
    return { errores, items: [] };
  }

  return { errores, items: normalizados };
};

const obtenerClaveIdempotencia = (request, body) => {
  const valorCrudo = request.get('Idempotency-Key') ?? body.idempotencyKey;

  if (valorCrudo === undefined || valorCrudo === null || valorCrudo === '') {
    return { valor: null, error: null };
  }

  if (typeof valorCrudo !== 'string') {
    return { valor: null, error: 'La clave de idempotencia no es válida.' };
  }

  const valor = valorCrudo.trim();

  if (!valor) {
    return { valor: null, error: null };
  }

  if (valor.length > MAXIMO_CLAVE_IDEMPOTENCIA) {
    return {
      valor: null,
      error: `La clave de idempotencia no puede superar los ${MAXIMO_CLAVE_IDEMPOTENCIA} caracteres.`,
    };
  }

  return { valor, error: null };
};

const responderPedidoExistente = (response, pedido) =>
  response.status(200).json({
    status: 'ok',
    message: 'El pedido ya había sido registrado.',
    repetido: true,
    data: serializarPedido(pedido),
  });

const buscarPedidoIdempotente = async (usuario, clave, intentos = 1) => {
  for (let intento = 0; intento < intentos; intento += 1) {
    const pedido = await Order.findOne({ usuario, idempotencyKey: clave });

    if (pedido) {
      return pedido;
    }

    if (intento < intentos - 1) {
      await new Promise((resolve) => {
        setTimeout(resolve, 25);
      });
    }
  }

  return null;
};

const crearPedido = asyncHandler(async (request, response) => {
  const body = request.body ?? {};
  const { errores, items } = validarItems(body.items);
  const clave = obtenerClaveIdempotencia(request, body);

  if (clave.error) {
    errores.push(clave.error);
  }

  if (errores.length > 0) {
    return response.status(400).json({
      status: 'error',
      message: 'Los datos del pedido no son válidos.',
      errors: errores,
    });
  }

  // Reintento del mismo envío: se devuelve el pedido ya creado sin tocar stock.
  if (clave.valor) {
    const existente = await Order.findOne({
      usuario: request.user.id,
      idempotencyKey: clave.valor,
    });

    if (existente) {
      return responderPedidoExistente(response, existente);
    }
  }

  const session = await mongoose.startSession();
  let pedidoCreado = null;

  try {
    await session.withTransaction(async () => {
      const ids = items.map((item) => item.producto);
      const productos = await Product.find({ _id: { $in: ids } }).session(session);
      const productosPorId = new Map(
        productos.map((producto) => [producto._id.toString(), producto]),
      );

      const faltantes = items.filter((item) => !productosPorId.has(item.producto));

      if (faltantes.length > 0) {
        throw crearErrorDePedido(
          400,
          'Uno o más productos del pedido no existen o fueron eliminados.',
        );
      }

      let totalEnCentavos = 0;
      const lineas = [];

      items.forEach((item) => {
        const producto = productosPorId.get(item.producto);

        if (producto.stock < item.cantidad) {
          throw crearErrorDePedido(
            409,
            `No hay stock suficiente de "${producto.nombre}".`,
            [`Stock disponible: ${producto.stock}. Solicitado: ${item.cantidad}.`],
          );
        }

        // Normaliza el precio a 2 decimales usando centavos enteros.
        // Esto garantiza que el precioUnitario guardado y el cálculo del total
        // Siempre se usa el mismo valor para el total y el precioUnitario, evitando
        // errores de precision de punto flotante.
        const precioUnitarioCentavos = normalizarPrecioaCentavos(producto.precio);

        // El precio y el total se calculan siempre desde la base, nunca desde el cliente.
        totalEnCentavos += precioUnitarioCentavos * item.cantidad;
        lineas.push({
          producto: producto._id,
          nombre: producto.nombre,
          precioUnitario: precioUnitarioCentavos / 100,
          cantidad: item.cantidad,
        });
      });

      for (const linea of lineas) {
        // La condición vuelve atómico el descuento: si otro pedido consumió el
        // stock, la transacción se aborta y no queda un decremento parcial.
        const actualizacion = await Product.updateOne(
          { _id: linea.producto, stock: { $gte: linea.cantidad } },
          { $inc: { stock: -linea.cantidad } },
          { session },
        );

        if (actualizacion.matchedCount !== 1) {
          throw crearErrorDePedido(
            409,
            `No hay stock suficiente de "${linea.nombre}".`,
            ['El stock cambió mientras se procesaba el pedido. Intentá de nuevo.'],
          );
        }
      }

      const [creado] = await Order.create(
        [
          {
            usuario: request.user.id,
            items: lineas,
            total: totalEnCentavos / 100,
            estado: 'pendiente',
            ...(clave.valor ? { idempotencyKey: clave.valor } : {}),
          },
        ],
        { session },
      );

      pedidoCreado = creado;
    });
  } catch (error) {
    if (error.esErrorDePedido) {
      return response.status(error.status).json({
        status: 'error',
        message: error.message,
        ...(error.errors ? { errors: error.errors } : {}),
      });
    }

    // Dos envíos simultáneos con la misma clave: el índice único aborta uno.
    if (error.code === 11000 && clave.valor) {
      const existente = await buscarPedidoIdempotente(request.user.id, clave.valor, 5);

      if (existente) {
        return responderPedidoExistente(response, existente);
      }

      return response.status(409).json({
        status: 'error',
        message: 'El pedido ya se está procesando. Esperá un momento y consultá tus pedidos.',
      });
    }

    throw error;
  } finally {
    await session.endSession();
  }

  return response.status(201).json({
    status: 'ok',
    message: 'Pedido creado correctamente.',
    data: serializarPedido(pedidoCreado),
  });
});

const obtenerMisPedidos = asyncHandler(async (request, response) => {
  const pedidos = await Order.find({ usuario: request.user.id }).sort({
    createdAt: -1,
    _id: -1,
  });

  return response.status(200).json(pedidos.map(serializarPedido));
});

module.exports = {
  crearPedido,
  obtenerMisPedidos,
};
