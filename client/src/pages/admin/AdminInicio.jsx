import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { formatoPrecio } from '../../utils/format';
import {
  claseEstadoPedido,
  etiquetaEstadoPedido,
  formatearFechaAdmin,
  idCorto,
} from '../../utils/admin';
import {
  obtenerClientesAdmin,
  obtenerPedidosAdmin,
  obtenerProductosAdmin,
} from '../../services/admin';
import AdminIcon from './AdminIcon';

const indicadores = [
  { clave: 'pedidos', etiqueta: 'Total de pedidos', icono: 'pedidos' },
  { clave: 'productos', etiqueta: 'Productos publicados', icono: 'productos' },
  { clave: 'clientes', etiqueta: 'Clientes registrados', icono: 'clientes' },
  { clave: 'pendientes', etiqueta: 'Pedidos pendientes', icono: 'pendiente' },
];

function AdminInicio() {
  const { token } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [reintento, setReintento] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    let activo = true;

    const cargarResumen = async () => {
      setCargando(true);
      setError('');

      try {
        const [productos, pedidos, clientes] = await Promise.all([
          obtenerProductosAdmin(controlador.signal),
          obtenerPedidosAdmin(token, controlador.signal),
          obtenerClientesAdmin(token, controlador.signal),
        ]);

        if (!activo) return;

        setResumen({
          pedidos: pedidos.length,
          productos: productos.length,
          clientes: clientes.length,
          pendientes: pedidos.filter((pedido) => pedido.estado === 'pendiente').length,
          ultimos: pedidos.slice(0, 5),
        });
      } catch (err) {
        if (!activo || err.name === 'AbortError') return;
        setError(err.message || 'No se pudo cargar el resumen del panel.');
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarResumen();

    return () => {
      activo = false;
      controlador.abort();
    };
  }, [token, reintento]);

  return (
    <section className="admin-page">
      <header className="admin-section-heading">
        <p className="eyebrow">INICIO</p>
        <h1>Resumen del negocio</h1>
        <p>Un vistazo rápido al estado de Hermanos Jota.</p>
      </header>

      {cargando && <p className="admin-status" role="status">Cargando indicadores...</p>}

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

      {!cargando && !error && resumen && (
        <>
          <div className="admin-stats">
            {indicadores.map((indicador) => (
              <article className="admin-stat-card" key={indicador.clave}>
                <span className="admin-stat-icon">
                  <AdminIcon nombre={indicador.icono} />
                </span>
                <div>
                  <p className="admin-stat-value">{resumen[indicador.clave]}</p>
                  <p className="admin-stat-label">{indicador.etiqueta}</p>
                </div>
              </article>
            ))}
          </div>

          <section className="admin-card admin-recent">
            <header className="admin-card-header">
              <h2>Últimos pedidos</h2>
              <Link to="/admin/pedidos" className="admin-link">Ver todos</Link>
            </header>

            {resumen.ultimos.length === 0 ? (
              <p className="admin-empty">Todavía no hay pedidos registrados.</p>
            ) : (
              <ul className="admin-recent-list">
                {resumen.ultimos.map((pedido) => (
                  <li className="admin-recent-item" key={pedido._id}>
                    <div className="admin-recent-id">
                      <span>#{idCorto(pedido._id)}</span>
                      <small>{formatearFechaAdmin(pedido.createdAt)}</small>
                    </div>
                    <div className="admin-recent-client">
                      <strong>{pedido.usuario?.nombre || 'Cliente'}</strong>
                      <small>{pedido.usuario?.email}</small>
                    </div>
                    <span className="admin-recent-total">{formatoPrecio(pedido.total)}</span>
                    <span className={`admin-badge ${claseEstadoPedido(pedido.estado)}`}>
                      {etiquetaEstadoPedido(pedido.estado)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  );
}

export default AdminInicio;
