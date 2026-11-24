import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { enviarPedido, nuevaClaveIdempotencia } from '../services/checkout';
import { useAuth } from './useAuth';
import { useCart } from './useCart';

// Si el carrito cambia, el envío anterior ya no aplica y necesita otra clave.
const firmaDe = (items) => items.map(({ producto, cantidad }) => `${producto._id}:${cantidad}`).join('|');

export function useCheckout() {
  const { usuario, token } = useAuth();
  const { itemsCarrito, vaciarCarrito } = useCart();
  const navigate = useNavigate();
  const claveRef = useRef(null);
  const firmaRef = useRef(null);

  return useCallback(async () => {
    if (!usuario) {
      navigate('/login', { state: { desde: '/carrito' } });
      return null;
    }

    if (itemsCarrito.length === 0) return null;

    const firma = firmaDe(itemsCarrito);

    if (firmaRef.current !== firma) {
      firmaRef.current = firma;
      claveRef.current = null;
    }

    // Ante un fallo se conserva la clave: un reintento con el mismo carrito
    // debe resolver al pedido ya creado, nunca generar uno nuevo.
    if (!claveRef.current) claveRef.current = nuevaClaveIdempotencia();

    const pedido = await enviarPedido({
      items: itemsCarrito,
      token,
      clave: claveRef.current,
    });

    vaciarCarrito();
    claveRef.current = null;
    firmaRef.current = null;
    return pedido;
  }, [usuario, token, itemsCarrito, vaciarCarrito, navigate]);
}
