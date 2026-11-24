const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { crearUsuarioConToken } = require('./helpers/auth');

const productoBase = {
  nombre: 'Sillón de prueba',
  descripcion: 'Producto creado en la base de datos temporal.',
  precio: 150000,
  stock: 5,
  imagenUrl: '',
  categoria: 'Sillones',
  especificaciones: [{ label: 'Material', value: 'Roble' }],
  destacado: false,
};

const crearProducto = (overrides = {}) =>
  Product.create({ ...productoBase, ...overrides });

const idInexistente = () => new mongoose.Types.ObjectId().toString();

const enviarPedido = ({ authorization, body = {}, idempotencyKey } = {}) => {
  const peticion = request(app).post('/api/pedidos');

  if (authorization) {
    peticion.set('Authorization', authorization);
  }

  if (idempotencyKey !== undefined) {
    peticion.set('Idempotency-Key', idempotencyKey);
  }

  return peticion.send(body);
};

const consultarMisPedidos = (authorization) => {
  const peticion = request(app).get('/api/pedidos/mis-pedidos');

  if (authorization) {
    peticion.set('Authorization', authorization);
  }

  return peticion;
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('POST /api/pedidos — acceso y validación', () => {
  test('devuelve 401 sin token y no crea pedidos ni descuenta stock', async () => {
    const producto = await crearProducto({ stock: 3 });

    const respuesta = await enviarPedido({
      body: { items: [{ producto: producto._id.toString(), cantidad: 1 }] },
    });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.message).toBe('Necesitás iniciar sesión para continuar.');
    expect(await Order.countDocuments()).toBe(0);

    const persistido = await Product.findById(producto._id).lean();
    expect(persistido.stock).toBe(3);
  });

  test('devuelve 400 si no se envían items', async () => {
    const { authorization } = await crearUsuarioConToken();

    const respuesta = await enviarPedido({ authorization, body: {} });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toBe('Los datos del pedido no son válidos.');
    expect(respuesta.body.errors).toContain('El pedido debe incluir al menos un producto.');
  });

  test('devuelve 400 si items está vacío', async () => {
    const { authorization } = await crearUsuarioConToken();

    const respuesta = await enviarPedido({ authorization, body: { items: [] } });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errors).toContain('El pedido debe incluir al menos un producto.');
  });

  test('devuelve 400 si items no es un array', async () => {
    const { authorization } = await crearUsuarioConToken();

    const respuesta = await enviarPedido({
      authorization,
      body: { items: { producto: idInexistente(), cantidad: 1 } },
    });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errors).toContain('El pedido debe incluir al menos un producto.');
  });

  test.each([0, -1, 1.5, '2', null])(
    'devuelve 400 para la cantidad inválida %p',
    async (cantidad) => {
      const { authorization } = await crearUsuarioConToken();

      const respuesta = await enviarPedido({
        authorization,
        body: { items: [{ producto: idInexistente(), cantidad }] },
      });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.errors).toContain(
        'La cantidad del ítem 1 debe ser un número entero mayor o igual a uno.',
      );
    },
  );

  test.each(['abc', '123456789012', 'zzzzzzzzzzzzzzzzzzzzzzzz'])(
    'devuelve 400 para el ID de producto inválido %s',
    async (producto) => {
      const { authorization } = await crearUsuarioConToken();

      const respuesta = await enviarPedido({
        authorization,
        body: { items: [{ producto, cantidad: 1 }] },
      });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.errors).toContain(
        'El producto del ítem 1 no tiene un ID válido.',
      );
    },
  );

  test('devuelve 400 si el pedido repite un producto', async () => {
    const { authorization } = await crearUsuarioConToken();
    const id = idInexistente();

    const respuesta = await enviarPedido({
      authorization,
      body: {
        items: [
          { producto: id, cantidad: 1 },
          { producto: id, cantidad: 2 },
        ],
      },
    });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errors).toContain(
      'El producto del ítem 2 está repetido en el pedido.',
    );
  });

  test('devuelve 400 si supera el máximo de 50 productos distintos', async () => {
    const { authorization } = await crearUsuarioConToken();
    const items = Array.from({ length: 51 }, () => ({
      producto: new mongoose.Types.ObjectId().toString(),
      cantidad: 1,
    }));

    const respuesta = await enviarPedido({ authorization, body: { items } });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errors).toContain(
      'El pedido no puede incluir más de 50 productos distintos.',
    );
  });

  test('devuelve 400 si la clave de idempotencia supera los 128 caracteres', async () => {
    const { authorization } = await crearUsuarioConToken();

    const respuesta = await enviarPedido({
      authorization,
      idempotencyKey: 'a'.repeat(129),
      body: { items: [{ producto: idInexistente(), cantidad: 1 }] },
    });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errors).toContain(
      'La clave de idempotencia no puede superar los 128 caracteres.',
    );
  });

  test('devuelve 400 si la clave de idempotencia del body no es texto', async () => {
    const { authorization } = await crearUsuarioConToken();

    const respuesta = await enviarPedido({
      authorization,
      body: {
        idempotencyKey: 12345,
        items: [{ producto: idInexistente(), cantidad: 1 }],
      },
    });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errors).toContain('La clave de idempotencia no es válida.');
  });
});

describe('POST /api/pedidos — productos y stock', () => {
  test('devuelve 400 si un producto no existe y no crea el pedido', async () => {
    const { authorization } = await crearUsuarioConToken();

    const respuesta = await enviarPedido({
      authorization,
      body: { items: [{ producto: idInexistente(), cantidad: 1 }] },
    });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toBe(
      'Uno o más productos del pedido no existen o fueron eliminados.',
    );
    expect(await Order.countDocuments()).toBe(0);
  });

  test('devuelve 409 si no hay stock suficiente y conserva el stock', async () => {
    const { authorization } = await crearUsuarioConToken();
    const producto = await crearProducto({ nombre: 'Mesa escasa', stock: 2 });

    const respuesta = await enviarPedido({
      authorization,
      body: { items: [{ producto: producto._id.toString(), cantidad: 3 }] },
    });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toBe('No hay stock suficiente de "Mesa escasa".');
    expect(respuesta.body.errors).toEqual(['Stock disponible: 2. Solicitado: 3.']);
    expect(await Order.countDocuments()).toBe(0);

    const persistido = await Product.findById(producto._id).lean();
    expect(persistido.stock).toBe(2);
  });

  test('no permite dejar stock negativo con una cantidad enorme', async () => {
    const { authorization } = await crearUsuarioConToken();
    const producto = await crearProducto({ stock: 1 });

    const respuesta = await enviarPedido({
      authorization,
      body: { items: [{ producto: producto._id.toString(), cantidad: 999999 }] },
    });

    expect(respuesta.status).toBe(409);
    expect(await Order.countDocuments()).toBe(0);

    const persistido = await Product.findById(producto._id).lean();
    expect(persistido.stock).toBe(1);
  });

  test('revierte el stock si falla la creación del pedido', async () => {
    const { authorization } = await crearUsuarioConToken();
    const [primero, segundo] = await Product.create([
      { ...productoBase, nombre: 'Producto A', stock: 4 },
      { ...productoBase, nombre: 'Producto B', stock: 4 },
    ]);

    jest.spyOn(Order, 'create').mockRejectedValueOnce(
      new Error('Fallo simulado al persistir el pedido.'),
    );

    const respuesta = await enviarPedido({
      authorization,
      body: {
        items: [
          { producto: primero._id.toString(), cantidad: 2 },
          { producto: segundo._id.toString(), cantidad: 2 },
        ],
      },
    });

    expect(respuesta.status).toBe(500);
    expect(await Order.countDocuments()).toBe(0);

    const primeroPersistido = await Product.findById(primero._id).lean();
    const segundoPersistido = await Product.findById(segundo._id).lean();
    expect(primeroPersistido.stock).toBe(4);
    expect(segundoPersistido.stock).toBe(4);
  });

  test('no descuenta stock si otro producto del pedido no tiene suficiente', async () => {
    const { authorization } = await crearUsuarioConToken();
    const [abundante, escaso] = await Product.create([
      { ...productoBase, nombre: 'Abundante', stock: 10 },
      { ...productoBase, nombre: 'Escaso', stock: 1 },
    ]);

    const respuesta = await enviarPedido({
      authorization,
      body: {
        items: [
          { producto: abundante._id.toString(), cantidad: 2 },
          { producto: escaso._id.toString(), cantidad: 2 },
        ],
      },
    });

    expect(respuesta.status).toBe(409);
    expect(await Order.countDocuments()).toBe(0);

    const abundantePersistido = await Product.findById(abundante._id).lean();
    const escasoPersistido = await Product.findById(escaso._id).lean();
    expect(abundantePersistido.stock).toBe(10);
    expect(escasoPersistido.stock).toBe(1);
  });
});

describe('POST /api/pedidos — creación', () => {
  test('calcula precios y total en el servidor e ignora los datos del cliente', async () => {
    const { usuario, authorization } = await crearUsuarioConToken({ rol: 'customer' });
    const { usuario: otroUsuario } = await crearUsuarioConToken({ rol: 'customer' });

    const [sillon, mesa] = await Product.create([
      { ...productoBase, nombre: 'Sillón', precio: 12345.67, stock: 10 },
      { ...productoBase, nombre: 'Mesa', precio: 500.1, stock: 5 },
    ]);

    const respuesta = await enviarPedido({
      authorization,
      body: {
        usuario: otroUsuario._id.toString(),
        total: 1,
        estado: 'confirmado',
        items: [
          {
            producto: sillon._id.toString(),
            cantidad: 2,
            precioUnitario: 1,
            precio: 1,
          },
          { producto: mesa._id.toString(), cantidad: 3 },
        ],
      },
    });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.message).toBe('Pedido creado correctamente.');
    expect(respuesta.body.data.usuario).toBe(usuario._id.toString());
    expect(respuesta.body.data.estado).toBe('pendiente');
    expect(respuesta.body.data.total).toBeCloseTo(26191.64, 2);
    expect(respuesta.body.data.items).toEqual([
      {
        producto: sillon._id.toString(),
        nombre: 'Sillón',
        precioUnitario: 12345.67,
        cantidad: 2,
      },
      {
        producto: mesa._id.toString(),
        nombre: 'Mesa',
        precioUnitario: 500.1,
        cantidad: 3,
      },
    ]);

    const pedidoGuardado = await Order.findById(respuesta.body.data._id).lean();
    expect(pedidoGuardado.usuario.toString()).toBe(usuario._id.toString());
    expect(pedidoGuardado.total).toBeCloseTo(26191.64, 2);
    expect(pedidoGuardado.estado).toBe('pendiente');
    expect(pedidoGuardado.items).toHaveLength(2);

    const sillonPersistido = await Product.findById(sillon._id).lean();
    const mesaPersistida = await Product.findById(mesa._id).lean();
    expect(sillonPersistido.stock).toBe(8);
    expect(mesaPersistida.stock).toBe(2);
  });

  test('acepta IDs de producto en mayúsculas', async () => {
    const { authorization } = await crearUsuarioConToken();
    const producto = await crearProducto({ stock: 3 });

    const respuesta = await enviarPedido({
      authorization,
      body: {
        items: [{ producto: producto._id.toString().toUpperCase(), cantidad: 1 }],
      },
    });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.data.items[0].producto).toBe(producto._id.toString());
  });

  test('mantiene el snapshot aunque el producto cambie después', async () => {
    const { authorization } = await crearUsuarioConToken();
    const producto = await crearProducto({ nombre: 'Original', precio: 1000, stock: 5 });

    const creacion = await enviarPedido({
      authorization,
      body: { items: [{ producto: producto._id.toString(), cantidad: 2 }] },
    });

    expect(creacion.status).toBe(201);

    await Product.updateOne(
      { _id: producto._id },
      { $set: { nombre: 'Renombrado', precio: 9999 } },
    );

    const consulta = await consultarMisPedidos(authorization);

    expect(consulta.status).toBe(200);
    expect(consulta.body).toHaveLength(1);
    expect(consulta.body[0].items[0]).toEqual({
      producto: producto._id.toString(),
      nombre: 'Original',
      precioUnitario: 1000,
      cantidad: 2,
    });
    expect(consulta.body[0].total).toBe(2000);
  });
});

describe('GET /api/pedidos/mis-pedidos', () => {
  test('devuelve 401 sin token', async () => {
    const respuesta = await consultarMisPedidos();

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.message).toBe('Necesitás iniciar sesión para continuar.');
  });

  test('devuelve un array vacío si el usuario no tiene pedidos', async () => {
    const { authorization } = await crearUsuarioConToken();

    const respuesta = await consultarMisPedidos(authorization);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual([]);
  });

  test('sólo devuelve los pedidos del usuario autenticado', async () => {
    const primero = await crearUsuarioConToken();
    const segundo = await crearUsuarioConToken();
    const producto = await crearProducto({ stock: 10 });

    const pedidoPrimero = await enviarPedido({
      authorization: primero.authorization,
      body: { items: [{ producto: producto._id.toString(), cantidad: 1 }] },
    });
    const pedidoSegundo = await enviarPedido({
      authorization: segundo.authorization,
      body: { items: [{ producto: producto._id.toString(), cantidad: 2 }] },
    });

    expect(pedidoPrimero.status).toBe(201);
    expect(pedidoSegundo.status).toBe(201);

    const consultaPrimero = await consultarMisPedidos(primero.authorization);
    const consultaSegundo = await consultarMisPedidos(segundo.authorization);

    expect(consultaPrimero.status).toBe(200);
    expect(consultaPrimero.body).toHaveLength(1);
    expect(consultaPrimero.body[0]._id).toBe(pedidoPrimero.body.data._id);
    expect(consultaPrimero.body[0].usuario).toBe(primero.usuario._id.toString());
    expect(consultaPrimero.body[0].items[0].cantidad).toBe(1);

    expect(consultaSegundo.status).toBe(200);
    expect(consultaSegundo.body).toHaveLength(1);
    expect(consultaSegundo.body[0]._id).toBe(pedidoSegundo.body.data._id);
    expect(consultaSegundo.body[0].usuario).toBe(segundo.usuario._id.toString());
    expect(consultaSegundo.body[0].items[0].cantidad).toBe(2);
  });
});

describe('idempotencia y concurrencia', () => {
  test('el mismo Idempotency-Key no duplica el pedido ni descuenta stock dos veces', async () => {
    const { authorization } = await crearUsuarioConToken();
    const producto = await crearProducto({ stock: 5 });
    const body = { items: [{ producto: producto._id.toString(), cantidad: 2 }] };

    const primera = await enviarPedido({
      authorization,
      body,
      idempotencyKey: 'compra-1',
    });
    const segunda = await enviarPedido({
      authorization,
      body,
      idempotencyKey: 'compra-1',
    });

    expect(primera.status).toBe(201);
    expect(segunda.status).toBe(200);
    expect(segunda.body.repetido).toBe(true);
    expect(segunda.body.data._id).toBe(primera.body.data._id);

    expect(await Order.countDocuments()).toBe(1);

    const persistido = await Product.findById(producto._id).lean();
    expect(persistido.stock).toBe(3);
  });

  test('claves de idempotencia distintas crean pedidos distintos', async () => {
    const { authorization } = await crearUsuarioConToken();
    const producto = await crearProducto({ stock: 5 });
    const body = { items: [{ producto: producto._id.toString(), cantidad: 1 }] };

    const primera = await enviarPedido({
      authorization,
      body,
      idempotencyKey: 'compra-a',
    });
    const segunda = await enviarPedido({
      authorization,
      body,
      idempotencyKey: 'compra-b',
    });

    expect(primera.status).toBe(201);
    expect(segunda.status).toBe(201);
    expect(segunda.body.data._id).not.toBe(primera.body.data._id);
    expect(await Order.countDocuments()).toBe(2);

    const persistido = await Product.findById(producto._id).lean();
    expect(persistido.stock).toBe(3);
  });

  test('la misma clave de idempotencia no se comparte entre usuarios', async () => {
    const primero = await crearUsuarioConToken();
    const segundo = await crearUsuarioConToken();
    const producto = await crearProducto({ stock: 5 });
    const body = { items: [{ producto: producto._id.toString(), cantidad: 1 }] };

    const pedidoPrimero = await enviarPedido({
      authorization: primero.authorization,
      body,
      idempotencyKey: 'misma-clave',
    });
    const pedidoSegundo = await enviarPedido({
      authorization: segundo.authorization,
      body,
      idempotencyKey: 'misma-clave',
    });

    expect(pedidoPrimero.status).toBe(201);
    expect(pedidoSegundo.status).toBe(201);
    expect(pedidoSegundo.body.data._id).not.toBe(pedidoPrimero.body.data._id);
    expect(await Order.countDocuments()).toBe(2);

    const persistido = await Product.findById(producto._id).lean();
    expect(persistido.stock).toBe(3);
  });

  test('reintentos simultáneos con la misma clave crean un solo pedido', async () => {
    const { authorization } = await crearUsuarioConToken();
    const producto = await crearProducto({ stock: 5 });
    const opciones = {
      authorization,
      idempotencyKey: 'doble-clic',
      body: { items: [{ producto: producto._id.toString(), cantidad: 2 }] },
    };

    const [primera, segunda] = await Promise.all([
      enviarPedido(opciones),
      enviarPedido(opciones),
    ]);

    expect([primera.status, segunda.status].sort()).toEqual([200, 201]);
    expect(primera.body.data._id).toBe(segunda.body.data._id);
    expect(await Order.countDocuments()).toBe(1);

    const persistido = await Product.findById(producto._id).lean();
    expect(persistido.stock).toBe(3);
  });

  test('dos pedidos simultáneos por la última unidad: uno falla y el stock queda en cero', async () => {
    const primero = await crearUsuarioConToken();
    const segundo = await crearUsuarioConToken();
    const producto = await crearProducto({ stock: 1 });
    const body = { items: [{ producto: producto._id.toString(), cantidad: 1 }] };

    const [respuestaPrimero, respuestaSegundo] = await Promise.all([
      enviarPedido({ authorization: primero.authorization, body }),
      enviarPedido({ authorization: segundo.authorization, body }),
    ]);

    expect(
      [respuestaPrimero.status, respuestaSegundo.status].sort(),
    ).toEqual([201, 409]);
    expect(await Order.countDocuments()).toBe(1);

    const persistido = await Product.findById(producto._id).lean();
    expect(persistido.stock).toBe(0);
  });

  test('un intento fallido no consume la clave de idempotencia', async () => {
    const { authorization } = await crearUsuarioConToken();
    const producto = await crearProducto({ stock: 1 });
    const body = { items: [{ producto: producto._id.toString(), cantidad: 2 }] };

    const fallido = await enviarPedido({
      authorization,
      body,
      idempotencyKey: 'reintento',
    });

    expect(fallido.status).toBe(409);
    expect(await Order.countDocuments()).toBe(0);

    await Product.updateOne({ _id: producto._id }, { $set: { stock: 3 } });

    const exitoso = await enviarPedido({
      authorization,
      body,
      idempotencyKey: 'reintento',
    });

    expect(exitoso.status).toBe(201);
    expect(await Order.countDocuments()).toBe(1);

    const persistido = await Product.findById(producto._id).lean();
    expect(persistido.stock).toBe(1);
  });
});
