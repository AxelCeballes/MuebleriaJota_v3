import { describe, expect, it, vi } from 'vitest';
import { esProductoValido, leerJsonDeRespuesta } from './api';

const respuestaConJson = (json) => ({ json });

describe('leerJsonDeRespuesta', () => {
  it('devuelve el JSON de una respuesta válida', async () => {
    const datos = { _id: 'producto-1', nombre: 'Sillón' };
    const respuesta = respuestaConJson(vi.fn().mockResolvedValue(datos));

    await expect(leerJsonDeRespuesta(respuesta)).resolves.toEqual(datos);
    expect(respuesta.json).toHaveBeenCalledTimes(1);
  });

  it('devuelve null cuando la respuesta no contiene JSON válido', async () => {
    const respuesta = respuestaConJson(
      vi.fn().mockRejectedValue(new SyntaxError('JSON inválido')),
    );

    await expect(leerJsonDeRespuesta(respuesta)).resolves.toBeNull();
  });

  it('devuelve null cuando json falla de forma síncrona', async () => {
    const respuesta = respuestaConJson(
      vi.fn(() => {
        throw new Error('Sin cuerpo');
      }),
    );

    await expect(leerJsonDeRespuesta(respuesta)).resolves.toBeNull();
  });

  it('devuelve null cuando la respuesta no es utilizable', async () => {
    await expect(leerJsonDeRespuesta(null)).resolves.toBeNull();
    await expect(leerJsonDeRespuesta({})).resolves.toBeNull();
  });
});

describe('esProductoValido', () => {
  it('acepta un producto con _id y nombre válidos', () => {
    expect(
      esProductoValido({
        _id: '507f1f77bcf86cd799439011',
        nombre: 'Sillón de roble',
      }),
    ).toBe(true);
  });

  it('rechaza un producto sin _id', () => {
    expect(esProductoValido({ nombre: 'Sillón de roble' })).toBe(false);
  });

  it('rechaza un _id vacío o que no sea string', () => {
    expect(esProductoValido({ _id: '', nombre: 'Sillón' })).toBe(false);
    expect(esProductoValido({ _id: '   ', nombre: 'Sillón' })).toBe(false);
    expect(esProductoValido({ _id: 123, nombre: 'Sillón' })).toBe(false);
  });

  it('rechaza un producto sin nombre', () => {
    expect(esProductoValido({ _id: 'producto-1' })).toBe(false);
  });

  it('rechaza un nombre que no sea string', () => {
    expect(esProductoValido({ _id: 'producto-1', nombre: 123 })).toBe(false);
    expect(esProductoValido({ _id: 'producto-1', nombre: null })).toBe(false);
  });

  it.each([null, undefined, {}, [], 'producto', 42])(
    'rechaza datos nulos o de tipo incorrecto: %p',
    (producto) => {
      expect(esProductoValido(producto)).toBe(false);
    },
  );
});
