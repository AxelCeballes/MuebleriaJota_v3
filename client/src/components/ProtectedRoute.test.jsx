import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';

function Ubicacion() {
  const ubicacion = useLocation();
  return <p>Destino: {ubicacion.state?.desde || 'ninguno'}</p>;
}

function renderRuta(rutaInicial, contenido) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[rutaInicial]}>
        <Routes>
          <Route path="/" element={<p>Inicio público</p>} />
          <Route path="/login" element={<Ubicacion />} />
          <Route path="/privado" element={<ProtectedRoute>{contenido}</ProtectedRoute>} />
          <Route
            path="/solo-admin"
            element={<ProtectedRoute roles={['admin']}>{contenido}</ProtectedRoute>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

const perfilDe = (rol) => ({
  ok: true,
  json: async () => ({
    usuario: {
      id: '650000000000000000000001',
      nombre: 'Ana Pérez',
      email: 'ana@example.com',
      rol,
    },
  }),
});

describe('ProtectedRoute', () => {
  it('redirige a login y conserva la ruta solicitada', () => {
    renderRuta('/privado?origen=carrito', <p>Contenido privado</p>);

    expect(screen.getByText(/Destino: \/privado\?origen=carrito/)).toBeInTheDocument();
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument();
  });

  it('muestra un estado de carga mientras valida el token guardado', () => {
    localStorage.setItem('auth_token', 'token');
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));

    renderRuta('/privado', <p>Contenido privado</p>);

    expect(screen.getByRole('status')).toHaveTextContent('Verificando tu sesión');
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument();
  });

  it('muestra el contenido cuando la sesión es válida', async () => {
    localStorage.setItem('auth_token', 'token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(perfilDe('customer')));

    renderRuta('/privado', <p>Contenido privado</p>);

    await waitFor(() => expect(screen.getByText('Contenido privado')).toBeInTheDocument());
  });

  it('no permite un customer en una ruta de administrador', async () => {
    localStorage.setItem('auth_token', 'token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(perfilDe('customer')));

    renderRuta('/solo-admin', <p>Panel admin</p>);

    await waitFor(() => expect(screen.getByText('Inicio público')).toBeInTheDocument());
    expect(screen.queryByText('Panel admin')).not.toBeInTheDocument();
  });

  it('permite un admin en una ruta de administrador', async () => {
    localStorage.setItem('auth_token', 'token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(perfilDe('admin')));

    renderRuta('/solo-admin', <p>Panel admin</p>);

    await waitFor(() => expect(screen.getByText('Panel admin')).toBeInTheDocument());
  });

  it('ante un error temporal conserva la sesión y permite reintentar', async () => {
    const usuario = userEvent.setup();
    localStorage.setItem('auth_token', 'token');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Error interno.' }),
      })
      .mockResolvedValueOnce(perfilDe('customer'));
    vi.stubGlobal('fetch', fetchMock);

    renderRuta('/privado', <p>Contenido privado</p>);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /No pudimos validar tu sesión/,
    );
    // No se muestra la sesión ni se redirige al login.
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument();
    expect(screen.queryByText(/Destino:/)).not.toBeInTheDocument();
    expect(localStorage.getItem('auth_token')).toBe('token');

    await usuario.click(screen.getByRole('button', { name: /REINTENTAR/i }));

    await waitFor(() => expect(screen.getByText('Contenido privado')).toBeInTheDocument());
  });
});
