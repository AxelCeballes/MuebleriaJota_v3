export const leerJsonDeRespuesta = async (respuesta) => {
  try {
    return await respuesta.json();
  } catch {
    return null;
  }
};

export const esProductoValido = (producto) =>
  Boolean(
    producto &&
      typeof producto === 'object' &&
      typeof producto._id === 'string' &&
      producto._id.trim() &&
      typeof producto.nombre === 'string'
  );

export const urlDeApi = (ruta) => `${import.meta.env.VITE_API_BASE || ''}${ruta}`;

export const headersConToken = (token, headers = {}) => ({
  ...headers,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// Convierte errores de red en un mensaje visible en español. Los errores de
// la API ya traen `message` (y eventualmente `errors`) del servidor.
export const mensajeDeError = async (respuesta, mensajePorDefecto) => {
  const datos = await leerJsonDeRespuesta(respuesta);

  if (respuesta.ok) return { datos, mensaje: '' };

  const detalles = Array.isArray(datos?.errors) ? ` ${datos.errors.join(' ')}` : '';
  return {
    datos,
    mensaje: datos?.message
      ? `${datos.message}${detalles}`
      : mensajePorDefecto,
  };
};
