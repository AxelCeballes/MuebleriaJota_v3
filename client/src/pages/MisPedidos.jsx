import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { formatoPrecio } from '../utils/format';
import { headersConToken, mensajeDeError, urlDeApi } from '../utils/api';

function MisPedidos() {
  const { token } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarPedidos = useCallback(async (signal) => {
    setCargando(true);
    setError('');

    try {
      const respuesta = await fetch(urlDeApi('/api/pedidos/mis-pedidos'), {
        headers: headersConToken(token),
        signal,
      });
      const { datos, mensaje } = await mensajeDeError(
        respuesta,
        'No se pudo cargar el historial de pedidos.',
      );

      if (!respuesta.ok) throw new Error(mensaje);
      if (!Array.isArray(datos)) throw new Error('La respuesta del servidor no es válida.');

      setPedidos(datos);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      if (!signal?.aborted) setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    const controlador = new AbortController();
    cargarPedidos(controlador.signal);
    return () => controlador.abort();
  }, [cargarPedidos]);

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">TU HISTORIAL</p>
        <h1>Mis pedidos</h1>
        <p>Pedidos registrados con tu cuenta.</p>
      </section>

      <section className="section">
        {cargando && <p className="grid-status" role="status">Cargando pedidos...</p>}

        {error && (
          <div className="grid-status" role="alert">
            <p>{error}</p>
            <button type="button" className="btn" onClick={() => cargarPedidos()}>
              REINTENTAR
            </button>
          </div>
        )}

        {!cargando && !error && pedidos.length === 0 && (
          <p className="grid-status">Todavía no registraste pedidos.</p>
        )}

        {!cargando && !error && pedidos.length > 0 && (
          <div className="orders-list">
            {pedidos.map((pedido) => (
              <article className="order-card" key={pedido._id}>
                <header>
                  <h2>Pedido {pedido._id.slice(-6)}</h2>
                  <p>{new Date(pedido.createdAt).toLocaleDateString('es-AR')} · {pedido.estado}</p>
                </header>
                <ul>
                  {pedido.items.map((item, indice) => (
                    <li key={`${item.producto}-${indice}`}>
                      {item.nombre} × {item.cantidad} — {formatoPrecio(item.precioUnitario)}
                    </li>
                  ))}
                </ul>
                <p className="order-total">Total: {formatoPrecio(pedido.total)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default MisPedidos;
