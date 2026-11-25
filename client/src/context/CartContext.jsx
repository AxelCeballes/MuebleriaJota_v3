import { useCallback, useEffect, useMemo, useState } from 'react';
import { validarAgregadoAlCarrito } from '../utils/stock';
import { CartContext } from './cart-context';

const CLAVE_CARRITO = 'carrito';
// Los ObjectId son strings; se toleran ids numéricos antiguos guardados en
// localStorage, pero nunca se convierten con Number().
const esIdValido = (id) =>
  (typeof id === 'string' && id.trim() !== '') ||
  (Number.isInteger(id) && id > 0);

const leerCarritoGuardado = () => {
  try {
    const guardado = localStorage.getItem(CLAVE_CARRITO);

    if (guardado) {
      const parseado = JSON.parse(guardado);

      if (Array.isArray(parseado)) {
        return parseado.filter(esIdValido).map(String);
      }
    }
  } catch (error) {
    console.error('Error al leer el carrito desde localStorage:', error);
  }

  return [];
};

export function CartProvider({ productos = [], children }) {
  const [carrito, setCarrito] = useState(leerCarritoGuardado);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
    } catch (error) {
      console.error('Error al guardar el carrito en localStorage:', error);
    }
  }, [carrito]);

  const productosPorId = useMemo(() => {
    const mapa = new Map();
    productos.forEach((producto) => {
      mapa.set(String(producto._id), producto);
    });
    return mapa;
  }, [productos]);

  // Los ids que ya no existen en el catálogo se descartan de la vista y no
  // cuentan como unidades: contador y total coinciden con lo que se ve.
  const itemsCarrito = useMemo(() => {
    const cantidades = carrito.reduce((acumulado, id) => {
      const clave = String(id);
      acumulado[clave] = (acumulado[clave] || 0) + 1;
      return acumulado;
    }, {});

    return Object.entries(cantidades)
      .map(([id, cantidad]) => {
        const producto = productosPorId.get(id);
        return producto ? { producto, cantidad } : null;
      })
      .filter(Boolean);
  }, [carrito, productosPorId]);

  const totalUnidades = itemsCarrito.reduce((suma, item) => suma + item.cantidad, 0);

  const totalCarrito = itemsCarrito.reduce(
    (suma, item) => suma + item.producto.precio * item.cantidad,
    0,
  );

  const agregarProducto = useCallback(
    (id) => {
      const producto = productosPorId.get(String(id));
      const cantidadEnCarrito = carrito.filter((item) => String(item) === String(id)).length;
      const resultado = validarAgregadoAlCarrito(producto, cantidadEnCarrito);

      if (resultado.ok) {
        setCarrito((previo) => [...previo, id]);
      }

      return resultado;
    },
    [carrito, productosPorId],
  );

  const quitarUnidad = useCallback((id) => {
    setCarrito((previo) => {
      const indice = previo.findIndex((item) => String(item) === String(id));

      if (indice === -1) return previo;

      const nuevo = [...previo];
      nuevo.splice(indice, 1);
      return nuevo;
    });
  }, []);

  const eliminarProducto = useCallback((id) => {
    setCarrito((previo) => previo.filter((item) => String(item) !== String(id)));
  }, []);

  const vaciarCarrito = useCallback(() => setCarrito([]), []);

  const valor = useMemo(
    () => ({
      itemsCarrito,
      totalUnidades,
      totalCarrito,
      agregarProducto,
      quitarUnidad,
      eliminarProducto,
      vaciarCarrito,
    }),
    [
      itemsCarrito,
      totalUnidades,
      totalCarrito,
      agregarProducto,
      quitarUnidad,
      eliminarProducto,
      vaciarCarrito,
    ],
  );

  return <CartContext.Provider value={valor}>{children}</CartContext.Provider>;
}
