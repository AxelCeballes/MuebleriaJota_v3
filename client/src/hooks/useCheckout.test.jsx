import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { useCheckout } from './useCheckout';

const producto = {
  _id: '650000000000000000000001',
  nombre: 'Sillón',
  precio: 150000,
  stock: 3,
};

const pedido = { _id: '650000000000000000000099', total: 300000 };

const perfil = {
  ok: true,
  json: async () => ({
    usuario: {
      id: '650000000000000000000010',
      nombre: 'Ana Pérez',
      email: 'ana@example.com',
      rol: 'customer',
    },
  }),
};

const respuestaOk = {
  ok: true,
  json: async () => ({ status: 'ok', data: pedido }),
};

const respuestaError = {
  ok: false,
  status: 409,
  json: async () => ({ status: 'error', message: 'No hay stock suficiente de "Sillón".' }),
};

function Ubicacion() {
  const ubicacion = useLocation();
  return <p>Ruta: {ubicacion.pathname} desde: {ubicacion.state?.desde || 'ninguna'}</p>;
}

function BotonComprar({ onResultado }) {
  const confirmarPedido = useCheckout();

  return (
    <button
      type="button"
      onClick={() => {
        confirmarPedido().then(onResultado).catch(() => {});
      }}
    >
      Confirmar
    </button>
  );
}

function renderCheckout({ autenticado = true, respuesta = respuestaOk, onResultado = vi.fn() } = {}) {
  if (autenticado) localStorage.setItem('auth_token', 'token-123');
  localStorage.setItem('carrito', JSON.stringify([producto._id]));

  vi.stubGlobal('fetch', vi.fn((url) => Promise.resolve(
    url === '/api/auth/me' ? perfil : respuesta,
  )));

  render(
    <AuthProvider>
      <CartProvider productos={[producto]}>
        <MemoryRouter initialEntries={['/carrito']}>
          <Routes>
            <Route path="/carrito" element={<BotonComprar onResultado={onResultado} />} />
            <Route path="/login" element={<Ubicacion />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>,
  );

  return onResultado;
}

const llamadaPedido = () => fetch.mock.calls.find(([url]) => url === '/api/pedidos');

describe('useCheckout', () => {
  it('redirige a login conservando el carrito cuando no hay sesión', async () => {
    const usuario = userEvent.setup();
    renderCheckout({ autenticado: false });

    await usuario.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByText(/Ruta: \/login desde: \/carrito/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem('carrito'))).toEqual([producto._id]);
  });

  it('crea el pedido con Bearer y vacía el carrito sólo tras la confirmación', async () => {
    const usuario = userEvent.setup();
    const onResultado = renderCheckout();

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/auth/me', expect.anything()));
    await usuario.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(llamadaPedido()).toBeDefined());
    expect(llamadaPedido()[1].headers).toMatchObject({
      Authorization: 'Bearer token-123',
      'Idempotency-Key': expect.any(String),
    });
    await waitFor(() => expect(onResultado).toHaveBeenCalledWith(pedido));
    expect(JSON.parse(localStorage.getItem('carrito'))).toEqual([]);
  });

  it('conserva el carrito cuando el servidor rechaza el pedido', async () => {
    const usuario = userEvent.setup();
    const onResultado = renderCheckout({ respuesta: respuestaError });

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/auth/me', expect.anything()));
    await usuario.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(llamadaPedido()).toBeDefined());
    expect(onResultado).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem('carrito'))).toEqual([producto._id]);
  });

  it('reutiliza la clave de idempotencia en un reintento con el mismo carrito', async () => {
    const usuario = userEvent.setup();
    renderCheckout({ respuesta: respuestaError });

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/auth/me', expect.anything()));
    await usuario.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(llamadaPedido()).toBeDefined());
    const clave = llamadaPedido()[1].headers['Idempotency-Key'];

    await usuario.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(fetch.mock.calls.filter(([url]) => url === '/api/pedidos')).toHaveLength(2));

    expect(llamadaPedido()[1].headers['Idempotency-Key']).toBe(clave);
  });
});
