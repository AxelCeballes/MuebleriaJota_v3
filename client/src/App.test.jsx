import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const PRODUCTO = {
  _id: '650000000000000000000001',
  nombre: 'Sillón Jota',
  descripcion: 'Sillón de prueba',
  precio: 150000,
  stock: 3,
  categoria: 'Sillones',
  imagenUrl: '/img/sillon.jpg',
  especificaciones: [],
  destacado: true,
};

const USUARIO = {
  id: '650000000000000000000010',
  nombre: 'Ana Pérez',
  email: 'ana@example.com',
  rol: 'customer',
};

const PEDIDO = {
  _id: '650000000000000000000099',
  total: PRODUCTO.precio,
};

const respuestaJson = (datos, opciones = {}) => ({
  ok: true,
  status: 200,
  json: async () => datos,
  ...opciones,
});

// Simula la API completa que consume App: catálogo, sesión y pedidos.
const prepararApi = ({ pedido = PEDIDO } = {}) => {
  const fetchMock = vi.fn(async (url, opciones = {}) => {
    if (url === '/api/productos') return respuestaJson([PRODUCTO]);
    if (url === '/api/auth/me') return respuestaJson({ usuario: USUARIO });
    if (url === '/api/pedidos' && opciones.method === 'POST') {
      return respuestaJson({ status: 'ok', data: pedido });
    }
    throw new Error(`Petición inesperada en el test: ${url}`);
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const renderApp = (ruta = '/') => {
  window.history.pushState({}, '', ruta);
  return render(<App />);
};

const llamadaPedido = (fetchMock) =>
  fetchMock.mock.calls.find(
    ([url, opciones]) => url === '/api/pedidos' && opciones?.method === 'POST',
  );

describe('App con proveedores reales', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    // ScrollToTop usa scrollTo, que jsdom no implementa.
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  it('inicia sin errores de composición y muestra el catálogo', async () => {
    const errores = vi.spyOn(console, 'error').mockImplementation(() => {});
    prepararApi();

    renderApp('/productos');

    expect(await screen.findByRole('heading', { name: 'Catálogo' })).toBeInTheDocument();
    expect(await screen.findByText('Sillón Jota')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AÑADIR' })).toBeInTheDocument();
    // Antes de la corrección useCart() se ejecutaba fuera de CartProvider.
    expect(errores).not.toHaveBeenCalledWith(
      expect.stringMatching(/useCart debe usarse dentro de CartProvider/),
    );
  });

  it('agrega al carrito y conserva el estado al volver a montar la app', async () => {
    const usuario = userEvent.setup();
    prepararApi();

    const { unmount } = renderApp('/productos');

    await usuario.click(await screen.findByRole('button', { name: 'AÑADIR' }));

    expect(document.getElementById('cart-count')).toHaveTextContent('1');
    expect(JSON.parse(localStorage.getItem('carrito'))).toEqual([PRODUCTO._id]);

    await usuario.click(screen.getByLabelText('Ver carrito de compras'));
    expect(await screen.findByRole('heading', { name: 'Carrito' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sillón Jota' })).toBeInTheDocument();

    // El carrito sobrevive a una recarga completa de la aplicación.
    unmount();
    prepararApi();
    renderApp('/carrito');

    expect(await screen.findByRole('heading', { name: 'Sillón Jota' })).toBeInTheDocument();
    expect(document.getElementById('cart-count')).toHaveTextContent('1');
    expect(document.getElementById('cart-summary-count')).toHaveTextContent('1');
  });

  it('ejecuta el checkout con una sesión válida', async () => {
    const usuario = userEvent.setup();
    localStorage.setItem('auth_token', 'token-123');
    localStorage.setItem('carrito', JSON.stringify([PRODUCTO._id]));
    const fetchMock = prepararApi();

    renderApp('/carrito');

    // Espera a que /me valide la sesión y el catálogo hidrate el carrito.
    expect(await screen.findByRole('button', { name: 'Menú de cuenta' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Sillón Jota' })).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: /COMPRAR/i }));

    expect(await screen.findByText(/Pedido confirmado/)).toBeInTheDocument();

    const llamada = llamadaPedido(fetchMock);
    expect(llamada).toBeDefined();
    expect(llamada[1].headers).toMatchObject({
      Authorization: 'Bearer token-123',
      'Idempotency-Key': expect.any(String),
    });
    expect(JSON.parse(llamada[1].body)).toEqual({
      items: [{ producto: PRODUCTO._id, cantidad: 1 }],
    });
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('carrito'))).toEqual([]);
    });
  });

  it('redirige al login cuando un visitante intenta comprar', async () => {
    const usuario = userEvent.setup();
    localStorage.setItem('carrito', JSON.stringify([PRODUCTO._id]));
    const fetchMock = prepararApi();

    renderApp('/carrito');

    expect(await screen.findByRole('heading', { name: 'Carrito' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Sillón Jota' })).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: /COMPRAR/i }));

    expect(await screen.findByRole('heading', { name: 'Ingresar' })).toBeInTheDocument();
    expect(llamadaPedido(fetchMock)).toBeUndefined();
    expect(JSON.parse(localStorage.getItem('carrito'))).toEqual([PRODUCTO._id]);
  });
});
