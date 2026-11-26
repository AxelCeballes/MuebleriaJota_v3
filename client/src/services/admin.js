import { headersConToken, mensajeDeError, urlDeApi } from '../utils/api';

const pedirListado = async (ruta, { token = null, signal } = {}) => {
  const respuesta = await fetch(urlDeApi(ruta), {
    headers: headersConToken(token),
    signal,
  });
  const { datos, mensaje } = await mensajeDeError(
    respuesta,
    'No se pudo cargar la información del panel.',
  );

  if (!respuesta.ok) throw new Error(mensaje);
  if (!Array.isArray(datos)) throw new Error('La respuesta del servidor no es válida.');

  return datos;
};

export const obtenerProductosAdmin = (signal) =>
  pedirListado('/api/productos', { signal });

export const obtenerPedidosAdmin = (token, signal) =>
  pedirListado('/api/pedidos', { token, signal });

export const obtenerClientesAdmin = (token, signal) =>
  pedirListado('/api/auth/clientes', { token, signal });
