import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { formatoPrecio, normalizarTexto } from '../../utils/format';
import {
  claseEstadoPedido,
  etiquetaEstadoPedido,
  formatearFechaAdmin,
  idCorto,
} from '../../utils/admin';
import { obtenerPedidosAdmin } from '../../services/admin';

function AdminPedidos() {
  const { token } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [reintento, setReintento] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('todos');
  const [pedidoAbierto, setPedidoAbierto] = useState(null);

  useEffect(() => {
    const controlador = new AbortController();
    let activo = true;

    const cargarPedidos = async () => {
      setCargando(true);
      setError('');

      try {
        const datos = await obtenerPedidosAdmin(token, controlador.signal);
        if (activo) setPedidos(datos);
      } catch (err) {
        if (!activo || err.name === 'AbortError') return;
        setError(err.message || 'No se pudieron cargar los pedidos.');
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarPedidos();

    return () => {
      activo = false;
      controlador.abort();
    };
  }, [token, reintento]);

  const pedidosFiltrados = useMemo(() => {
    const texto = normalizarTexto(busqueda.trim());

    return pedidos.filter((pedido) => {
      const coincideEstado = estado === 'todos' || pedido.estado === estado;
      if (!coincideEstado) return false;
      if (!texto) return true;

      const contenido = normalizarTexto(
        `${pedido._id} ${pedido.usuario?.nombre || ''} ${pedido.usuario?.email || ''}`,
      );

      return contenido.includes(texto);
    });
  }, [pedidos, busqueda, estado]);

  return (
    <section className="admin-page">
      <header className="admin-section-heading">
        <p className="eyebrow">PEDIDOS</p>
        <h1>Pedidos</h1>
        <p>Consultá el historial completo y el detalle de cada compra.</p>
      </header>

      <div className="admin-toolbar">
        <label className="admin-search">
          <span>Buscar</span>
          <input
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Pedido, cliente o email"
          />
        </label>

        <label className="admin-filter">
          <span>Estado</span>
          <select value={estado} onChange={(evento) => setEstado(evento.target.value)}>
            <option value="todos">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="confirmado">Confirmados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </label>
      </div>

      {cargando && <p className="admin-status" role="status">Cargando pedidos...</p>}

      {!cargando && error && (
        <div className="admin-status admin-status-error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="btn"
            onClick={() => setReintento((valor) => valor + 1)}
          >
            REINTENTAR
          </button>
        </div>
      )}

      {!cargando && !error && pedidosFiltrados.length === 0 && (
        <p className="admin-empty">
          {pedidos.length === 0
            ? 'Todavía no hay pedidos registrados.'
            : 'No encontramos pedidos con esos filtros.'}
        </p>
      )}

      {!cargando && !error && pedidosFiltrados.length > 0 && (
        <div className="admin-order-list">
          {pedidosFiltrados.map((pedido) => {
            const abierto = pedidoAbierto === pedido._id;

            return (
              <article className="admin-order-card" key={pedido._id}>
                <div className="admin-order-main">
                  <div className="admin-order-id">
                    <span>#{idCorto(pedido._id)}</span>
                    <small>{formatearFechaAdmin(pedido.createdAt)}</small>
                  </div>

                  <div className="admin-order-client">
                    <strong>{pedido.usuario?.nombre || 'Cliente'}</strong>
                    <small>{pedido.usuario?.email}</small>
                  </div>

                  <span className="admin-order-total">{formatoPrecio(pedido.total)}</span>

                  <span className={`admin-badge ${claseEstadoPedido(pedido.estado)}`}>
                    {etiquetaEstadoPedido(pedido.estado)}
                  </span>

                  <button
                    type="button"
                    className="admin-detail-toggle"
                    aria-expanded={abierto}
                    onClick={() => setPedidoAbierto(abierto ? null : pedido._id)}
                  >
                    {abierto ? 'Ocultar detalle' : 'Ver detalle'}
                  </button>
                </div>

                {abierto && (
                  <div className="admin-order-detail">
                    <h3>Productos del pedido</h3>
                    <ul>
                      {pedido.items.map((item, indice) => (
                        <li key={`${item.producto}-${indice}`}>
                          <span>{item.nombre}</span>
                          <span>{item.cantidad} × {formatoPrecio(item.precioUnitario)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default AdminPedidos;
