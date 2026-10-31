// Formato de precio según especificación (Intl.NumberFormat es-AR sin decimales)
export const formatoPrecio = (precio) => {
  if (typeof precio !== 'number') return '$0';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(precio);
};

// Normalizar texto para búsquedas sin tildes e insensible a mayúsculas
export const normalizarTexto = (texto = '') =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const resolverImagenUrl = (imagenUrl = '') => {
  if (!imagenUrl) return '';
  if (/^(data:|blob:|https?:\/\/)/i.test(imagenUrl)) return imagenUrl;
  if (imagenUrl.startsWith('/api/')) {
    return `${import.meta.env.VITE_API_BASE || ''}${imagenUrl}`;
  }
  return imagenUrl.startsWith('/') ? imagenUrl : `/${imagenUrl}`;
};
