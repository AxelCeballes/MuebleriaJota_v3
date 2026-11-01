import { describe, expect, it } from 'vitest';
import { obtenerStockDisponible, validarAgregadoAlCarrito } from './stock';

const producto = (stock, nombre = 'Sillón') => ({ _id: 'producto-1', nombre, stock });

describe('obtenerStockDisponible', () => {
  it.each([
    [5, 5],
    ['5', 5],
    ['2.8', 2],
    [0, 0],
    [-3, 0],
    [undefined, 0],
    [null, 0],
    ['', 0],
    ['sin stock', 0],
    [Infinity, 0],
    [NaN, 0],
  ])('normaliza el stock %p a %i', (stock, esperado) => {
    expect(obtenerStockDisponible(producto(stock))).toBe(esperado);
  });

  it('devuelve 0 cuando el producto no existe', () => {
    expect(obtenerStockDisponible(null)).toBe(0);
    expect(obtenerStockDisponible(undefined)).toBe(0);
  });
});

describe('validarAgregadoAlCarrito', () => {
  it('rechaza un producto inexistente', () => {
    expect(validarAgregadoAlCarrito(null)).toEqual({
      ok: false,
      mensaje: 'El producto no está disponible en el catálogo.',
    });
  });

  it('no permite agregar productos con stock 0', () => {
    expect(validarAgregadoAlCarrito(producto(0))).toEqual({
      ok: false,
      mensaje: '"Sillón" no tiene stock disponible.',
    });
  });

  it('no permite agregar productos con stock ausente o inválido', () => {
    for (const stock of [undefined, null, '', 'sin stock']) {
      expect(validarAgregadoAlCarrito(producto(stock))).toMatchObject({
        ok: false,
        mensaje: '"Sillón" no tiene stock disponible.',
      });
    }
  });

  it('permite agregar un producto con stock disponible', () => {
    expect(validarAgregadoAlCarrito(producto(3), 0)).toEqual({
      ok: true,
      mensaje: '"Sillón" se agregó al carrito.',
    });
  });

  it('acepta stock numérico expresado como string', () => {
    expect(validarAgregadoAlCarrito(producto('2'), 1)).toMatchObject({
      ok: true,
    });
  });

  it('no permite superar el stock máximo', () => {
    expect(validarAgregadoAlCarrito(producto(2), 2)).toEqual({
      ok: false,
      mensaje: 'Solo hay 2 unidades disponibles de "Sillón".',
    });
  });

  it('usa el singular cuando queda una sola unidad', () => {
    expect(validarAgregadoAlCarrito(producto(1), 1)).toEqual({
      ok: false,
      mensaje: 'Solo hay 1 unidad disponible de "Sillón".',
    });
  });

  it('usa un nombre genérico cuando el producto no informa nombre', () => {
    const sinNombre = { _id: 'producto-1', stock: 0 };

    expect(validarAgregadoAlCarrito(sinNombre)).toEqual({
      ok: false,
      mensaje: '"El producto" no tiene stock disponible.',
    });
  });
});
