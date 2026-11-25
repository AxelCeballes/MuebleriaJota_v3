import { useState } from 'react';
import { formatoPrecio, resolverImagenUrl } from '../utils/format';
import { obtenerStockDisponible } from '../utils/stock';

function Cart({
  items = [],
  totalUnidades = 0,
  total = 0,
  onNavigate,
  onAgregar,
  onQuitarUnidad,
  onEliminar,
  onVaciar,
  onCheckout
}) {
  const [enviando, setEnviando] = useState(false);
  const [errorCompra, setErrorCompra] = useState('');
  const [pedidoConfirmado, setPedidoConfirmado] = useState('');
  const [mensajeStock, setMensajeStock] = useState('');

  const handleIncrementar = (producto) => {
    const resultado = onAgregar?.(producto._id);

    if (resultado && !resultado.ok) {
      setMensajeStock(resultado.mensaje);
      return;
    }

    setMensajeStock('');
  };

  const handleComprar = async () => {
    if (enviando || items.length === 0) return;

    setEnviando(true);
    setErrorCompra('');
    setPedidoConfirmado('');

    try {
      const pedido = await onCheckout?.();
      if (pedido?._id) setPedidoConfirmado(pedido._id);
    } catch (error) {
      setErrorCompra(error?.message || 'No se pudo registrar el pedido. Intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="cart-section">
      <div id="cart-items" className="cart-list">
        {mensajeStock && (
          <p className="cart-stock-message cart-stock-message-global" role="alert">
            {mensajeStock}
          </p>
        )}
        {items.length === 0 ? (
          <div className="cart-empty">
            <p>Tu carrito está vacío.</p>
            <button type="button" className="text-link" onClick={() => onNavigate('catalogo')}>
              Ver catálogo →
            </button>
          </div>
        ) : (
          items.map(({ producto, cantidad }) => {
            const imageSrc = resolverImagenUrl(producto.imagenUrl);
            const stock = obtenerStockDisponible(producto);
            const alcanzoStock = cantidad >= stock;
            return (
              <article key={producto._id} className="cart-item">
                <div className="cart-item-image">
                  <img src={imageSrc} alt={producto.nombre} />
                </div>
                <div className="cart-item-info">
                  <p className="category">{producto.categoria}</p>
                  <h3>{producto.nombre}</h3>
                  <p className="price">{formatoPrecio(producto.precio)}</p>
                </div>
                <div className="cart-item-qty">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => onQuitarUnidad(producto._id)}
                    aria-label={`Quitar una unidad de ${producto.nombre}`}
                  >
                    −
                  </button>
                  <span>{cantidad}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => handleIncrementar(producto)}
                    aria-label={`Agregar una unidad de ${producto.nombre}`}
                    disabled={alcanzoStock}
                  >
                    +
                  </button>
                </div>
                {alcanzoStock && (
                  <p className="cart-stock-message" role="status">
                    {stock === 0 ? 'Producto sin stock.' : `Máximo disponible: ${stock}.`}
                  </p>
                )}
                <p className="cart-item-subtotal">{formatoPrecio(producto.precio * cantidad)}</p>
                <button
                  type="button"
                  className="cart-item-remove"
                  onClick={() => onEliminar(producto._id)}
                  aria-label={`Eliminar ${producto.nombre} del carrito`}
                >
                  Eliminar
                </button>
              </article>
            );
          })
        )}
      </div>

      <aside className="cart-summary">
        <h2>Resumen</h2>
        <p className="cart-summary-row">
          <span>Unidades</span>
          <span id="cart-summary-count">{totalUnidades}</span>
        </p>
        <p className="cart-summary-total">
          <span>Total</span>
          <span id="cart-total">{formatoPrecio(total)}</span>
        </p>

        <div className="cart-summary-actions">
          <button
            type="button"
            className="btn btn-buy cart-buy"
            disabled={totalUnidades === 0 || enviando}
            onClick={handleComprar}
          >
            {enviando ? 'PROCESANDO...' : 'COMPRAR'}
          </button>

          <button
            id="cart-clear"
            type="button"
            className="btn-outline"
            disabled={totalUnidades === 0}
            onClick={onVaciar}
          >
            VACIAR CARRITO
          </button>
        </div>

        {errorCompra && (
          <p className="cart-purchase-message cart-checkout-error" role="alert">
            {errorCompra}
          </p>
        )}

        {pedidoConfirmado && (
          <p className="cart-purchase-message" role="status">
            Pedido confirmado. Número: {pedidoConfirmado.slice(-6)}. Ya podés verlo en Mis pedidos.
          </p>
        )}
      </aside>
    </section>
  );
}

export default Cart;
