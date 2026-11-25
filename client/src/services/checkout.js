import { headersConToken, mensajeDeError, urlDeApi } from '../utils/api';

const MENSAJE_SIN_CONEXION = 'No pudimos conectar con el servidor. Intentá de nuevo.';

export const nuevaClaveIdempotencia = () =>
  globalThis.crypto?.randomUUID?.() ??
  `pedido-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// El cliente sólo envía ids y cantidades: el servidor recalcula precios, total
// y stock desde MongoDB. La clave evita duplicar el pedido si el envío se repite.
export async function enviarPedido({ items, token, clave }) {
  const cuerpo = {
    items: items.map(({ producto, cantidad }) => ({
      producto: producto._id,
      cantidad,
    })),
  };

  let respuesta;

  try {
    respuesta = await fetch(urlDeApi('/api/pedidos'), {
      method: 'POST',
      headers: headersConToken(token, {
        'Content-Type': 'application/json',
        'Idempotency-Key': clave || nuevaClaveIdempotencia(),
      }),
      body: JSON.stringify(cuerpo),
    });
  } catch {
    throw new Error(MENSAJE_SIN_CONEXION);
  }

  const { datos, mensaje } = await mensajeDeError(
    respuesta,
    'No se pudo registrar el pedido. Intentá de nuevo.',
  );

  if (!respuesta.ok) {
    const error = new Error(mensaje);
    error.status = respuesta.status;
    throw error;
  }

  if (!datos?.data?._id) {
    throw new Error('El servidor no devolvió un pedido válido.');
  }

  return datos.data;
}
