import { describe, expect, it, vi } from 'vitest';
import { enviarPedido, nuevaClaveIdempotencia } from './checkout';

const items = [
  {
    producto: { _id: '650000000000000000000001', nombre: 'Sillón', precio: 150000 },
    cantidad: 2,
  },
];

const pedido = {
  _id: '650000000000000000000099',
  items: [{ nombre: 'Sillón', precioUnitario: 150000, cantidad: 2 }],
  total: 300000,
};

describe('checkout', () => {
  it('envía sólo ids y cantidades con Bearer y Idempotency-Key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', data: pedido }),
    }));

    const resultado = await enviarPedido({
      items,
      token: 'token-123',
      clave: 'clave-fija',
    });

    expect(resultado).toEqual(pedido);
    const [url, opciones] = fetch.mock.calls[0];
    expect(url).toBe('/api/pedidos');
    expect(opciones.method).toBe('POST');
    expect(opciones.headers).toEqual({
      'Content-Type': 'application/json',
      'Idempotency-Key': 'clave-fija',
      Authorization: 'Bearer token-123',
    });
    expect(JSON.parse(opciones.body)).toEqual({
      items: [{ producto: '650000000000000000000001', cantidad: 2 }],
    });
  });

  it('muestra el mensaje del servidor cuando falta stock y expone el status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        status: 'error',
        message: 'No hay stock suficiente de "Sillón".',
        errors: ['Stock disponible: 1. Solicitado: 2.'],
      }),
    }));

    await expect(enviarPedido({ items, token: 'token-123' })).rejects.toMatchObject({
      message: 'No hay stock suficiente de "Sillón". Stock disponible: 1. Solicitado: 2.',
      status: 409,
    });
  });

  it('avisa si no hay conexión con el servidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(enviarPedido({ items, token: 'token-123' })).rejects.toThrow(
      'No pudimos conectar con el servidor.',
    );
  });

  it('genera una clave de idempotencia cuando no se recibe una', () => {
    expect(nuevaClaveIdempotencia()).toEqual(expect.any(String));
    expect(nuevaClaveIdempotencia()).not.toBe('');
  });
});
