import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MisPedidos from './MisPedidos';
import { AuthProvider } from '../context/AuthContext';

const pedido = {
  _id: '650000000000000000000099',
  usuario: '650000000000000000000001',
  items: [
    {
      producto: '650000000000000000000002',
      nombre: 'Sillón',
      precioUnitario: 150000,
      cantidad: 1,
    },
  ],
  total: 150000,
  estado: 'pendiente',
  createdAt: '2026-11-20T12:00:00.000Z',
  updatedAt: '2026-11-20T12:00:00.000Z',
};

const prepararFetch = () => vi.fn((url) => {
  if (url === '/api/auth/me') {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        usuario: {
          id: '650000000000000000000001',
          nombre: 'Ana Pérez',
          email: 'ana@example.com',
          rol: 'customer',
        },
      }),
    });
  }

  return Promise.resolve({ ok: true, json: async () => [pedido] });
});

describe('MisPedidos', () => {
  it('pide el historial con Bearer y muestra los pedidos', async () => {
    localStorage.setItem('auth_token', 'token-123');
    vi.stubGlobal('fetch', prepararFetch());

    render(
      <AuthProvider>
        <MisPedidos />
      </AuthProvider>,
    );

    expect(await screen.findByText(/Sillón × 1/)).toBeInTheDocument();
    expect(screen.getByText(/Total:/)).toBeInTheDocument();
    await waitFor(() => {
      const llamada = fetch.mock.calls.find(([url]) => url === '/api/pedidos/mis-pedidos');
      expect(llamada[1].headers).toEqual({ Authorization: 'Bearer token-123' });
    });
  });

  it('muestra el error de la API y permite reintentar', async () => {
    localStorage.setItem('auth_token', 'token-123');
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            usuario: {
              id: '650000000000000000000001',
              nombre: 'Ana Pérez',
              email: 'ana@example.com',
              rol: 'customer',
            },
          }),
        });
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({ message: 'No se pudo cargar el historial.' }),
      });
    }));

    render(
      <AuthProvider>
        <MisPedidos />
      </AuthProvider>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar el historial.');
    expect(screen.getByRole('button', { name: /REINTENTAR/i })).toBeInTheDocument();
  });
});
