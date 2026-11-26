import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { formatoPrecio } from '../../utils/format';
import {
  claseEstadoPedido,
  etiquetaEstadoPedido,
  formatearFechaAdmin,
  idCorto,
} from '../../utils/admin';
import { obtenerClientesAdmin, obtenerPedidosAdmin } from '../../services/admin';

const iniciales = (nombre = '') =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join('')
    .toUpperCase() || '?';

function AdminClientes() {
  const { token } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [reintento, setReintento] = useState(0);
  const [clienteAbierto, setClienteAbierto] = useState(null);

  useEffect(() => {
    const controlador = new AbortController();
    let activo = true;

    const cargarClientes = async () => {
      setCargando(true);
      setError('');

      try {
        const [datosClientes, datosPedidos] = await Promise.all([
          obtenerClientesAdmin(token, controlador.signal),
          obtenerPedidosAdmin(token, controlador.signal),
        ]);

        if (!activo) return;
        setClientes(datosClientes);
        setPedidos(datosPedidos);
      } catch (err) {
        if (!activo || err.name === 'AbortError') return;
        setError(err.message || 'No se pudieron cargar los clientes.');
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarClientes();

    return () => {
      activo = false;
      controlador.abort();
    };
  }, [token, reintento]);

  return (
    <section className="admin-page">
      <header className="admin-section-heading">
        <p className="eyebrow">CLIENTES</p>
        <h1>Clientes</h1>
        <p>Consultá las cuentas registradas y su historial de compras.</p>
      </header>

      {cargando && <p className="admin-status" role="status">Cargando clientes...</p>}

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

      {!cargando && !error && clientes.length === 0 && (
        <p className="admin-empty">Todavía no hay clientes registrados.</p>
      )}

      {!cargando && !error && clientes.length > 0 && (
        <div className="admin-client-list">
          {clientes.map((cliente) => {
            const abierto = clienteAbierto === cliente.id;
            const historial = pedidos.filter(
              (pedido) => String(pedido.usuario?.id) === String(cliente.id),
            );

            return (
              <article className="admin-client-card" key={cliente.id}>
                <div className="admin-client-main">
                  <span className="admin-client-avatar" aria-hidden="true">
                    {iniciales(cliente.nombre)}
                  </span>

                  <div className="admin-client-info">
                    <strong>{cliente.nombre}</strong>
                    <small>{cliente.email}</small>
                  </div>

                  <div className="admin-client-meta">
                    <span>Registro: {formatearFechaAdmin(cliente.createdAt)}</span>
                    <span>
                      {cliente.totalPedidos} {cliente.totalPedidos === 1 ? 'pedido' : 'pedidos'}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="admin-detail-toggle"
                    aria-expanded={abierto}
                    onClick={() => setClienteAbierto(abierto ? null : cliente.id)}
                  >
                    {abierto ? 'Ocultar historial' : 'Ver historial'}
                  </button>
                </div>

                {abierto && (
                  <div className="admin-client-history">
                    <h3>Historial de compras</h3>
                    {historial.length === 0 ? (
                      <p className="admin-empty">Sin pedidos registrados.</p>
                    ) : (
                      <ul>
                        {historial.map((pedido) => (
                          <li key={pedido._id}>
                            <span>#{idCorto(pedido._id)}</span>
                            <span>{formatearFechaAdmin(pedido.createdAt)}</span>
                            <span>{formatoPrecio(pedido.total)}</span>
                            <span className={`admin-badge ${claseEstadoPedido(pedido.estado)}`}>
                              {etiquetaEstadoPedido(pedido.estado)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
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

export default AdminClientes;
