export const claseEstadoPedido = (estado) =>
  ({
    pendiente: 'admin-badge-warning',
    confirmado: 'admin-badge-success',
    cancelado: 'admin-badge-danger',
  })[estado] || 'admin-badge-muted';

export const etiquetaEstadoPedido = (estado) =>
  estado ? `${estado.charAt(0).toUpperCase()}${estado.slice(1)}` : 'Sin estado';

export const formatearFechaAdmin = (fecha) => {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return '—';
  return valor.toLocaleDateString('es-AR');
};

export const idCorto = (id = '') => String(id).slice(-6).toUpperCase();
