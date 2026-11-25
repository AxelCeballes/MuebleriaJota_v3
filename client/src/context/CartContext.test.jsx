import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CartProvider } from './CartContext';
import { useCart } from '../hooks/useCart';

const sillón = {
  _id: 'p1',
  nombre: 'Sillón',
  precio: 150000,
  stock: 2,
};

const mesa = {
  _id: 'p2',
  nombre: 'Mesa',
  precio: 90000,
  stock: 3,
};

const crearWrapper = (productos) => function Wrapper({ children }) {
  return <CartProvider productos={productos}>{children}</CartProvider>;
};

describe('CartContext', () => {
  it('normaliza ids numéricos antiguos, descarta vacíos y persiste los cambios', async () => {
    localStorage.setItem('carrito', JSON.stringify(['p1', '', 7, 'p1']));
    const { result } = renderHook(() => useCart(), { wrapper: crearWrapper([sillón, mesa]) });

    // El 7 se conserva como legacy, pero no figura en el catálogo y no se cuenta.
    expect(result.current.itemsCarrito).toHaveLength(1);
    expect(result.current.totalUnidades).toBe(2);

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('carrito'))).toEqual(['p1', '7', 'p1']);
    });
  });

  it('valida el stock antes de superar las unidades disponibles', () => {
    const { result } = renderHook(() => useCart(), { wrapper: crearWrapper([sillón]) });
    const intentos = [];

    act(() => {
      intentos.push(result.current.agregarProducto('p1'));
    });
    expect(intentos[0].ok).toBe(true);
    expect(result.current.totalUnidades).toBe(1);

    act(() => {
      intentos.push(result.current.agregarProducto('p1'));
    });
    expect(intentos[1].ok).toBe(true);
    expect(result.current.totalUnidades).toBe(2);

    act(() => {
      intentos.push(result.current.agregarProducto('p1'));
    });
    expect(intentos[2].ok).toBe(false);
    expect(intentos[2].mensaje).toContain('2 unidades');
    expect(result.current.totalUnidades).toBe(2);
  });

  it('quita una unidad, elimina un producto y vacía el carrito', () => {
    const { result } = renderHook(() => useCart(), { wrapper: crearWrapper([sillón, mesa]) });

    act(() => {
      result.current.agregarProducto('p1');
      result.current.agregarProducto('p1');
      result.current.agregarProducto('p2');
    });
    expect(result.current.totalUnidades).toBe(3);

    act(() => result.current.quitarUnidad('p1'));
    expect(result.current.totalUnidades).toBe(2);

    act(() => result.current.eliminarProducto('p1'));
    expect(result.current.itemsCarrito).toHaveLength(1);
    expect(result.current.itemsCarrito[0].producto._id).toBe('p2');

    act(() => result.current.vaciarCarrito());
    expect(result.current.itemsCarrito).toEqual([]);
    expect(result.current.totalCarrito).toBe(0);
  });

  it('calcula el total sólo con productos existentes', () => {
    localStorage.setItem('carrito', JSON.stringify(['p1', 'p1', 'inexistente']));
    const { result } = renderHook(() => useCart(), { wrapper: crearWrapper([sillón, mesa]) });

    expect(result.current.totalUnidades).toBe(2);
    expect(result.current.totalCarrito).toBe(sillón.precio * 2);
  });

  it('avisa si se usa fuera del proveedor', () => {
    expect(() => renderHook(() => useCart())).toThrow(/CartProvider/);
  });
});
