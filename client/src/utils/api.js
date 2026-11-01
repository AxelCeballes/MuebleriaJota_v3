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
