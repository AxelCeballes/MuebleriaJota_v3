import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Login from './Login';
import Registro from './Registro';
import { AuthProvider } from '../context/AuthContext';

const sesion = {
  ok: true,
  json: async () => ({
    usuario: {
      id: '650000000000000000000001',
      nombre: 'Ana Pérez',
      email: 'ana@example.com',
      rol: 'customer',
    },
    token: 'token-123',
  }),
};

function renderPagina(Componente, entrada = '/login') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[entrada]}>
        <Routes>
          <Route path="/login" element={<Componente />} />
          <Route path="/registro" element={<Componente />} />
          <Route path="/" element={<p>Inicio</p>} />
          <Route path="/carrito" element={<p>Carrito</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('páginas de autenticación', () => {
  it('loguea y vuelve a la ruta que originó la redirección', async () => {
    const usuario = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sesion));
    renderPagina(Login, { pathname: '/login', state: { desde: '/carrito' } });

    await usuario.type(screen.getByLabelText('Email'), 'ana@example.com');
    await usuario.type(screen.getByLabelText('Contraseña'), 'secreto123');
    await usuario.click(screen.getByRole('button', { name: /INGRESAR/i }));

    await waitFor(() => expect(screen.getByText('Carrito')).toBeInTheDocument());
    expect(localStorage.getItem('auth_token')).toBe('token-123');
  });

  it('muestra el error de la API sin iniciar sesión', async () => {
    const usuario = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Email o contraseña incorrectos.' }),
      }),
    );
    renderPagina(Login);

    await usuario.type(screen.getByLabelText('Email'), 'ana@example.com');
    await usuario.type(screen.getByLabelText('Contraseña'), 'incorrecta');
    await usuario.click(screen.getByRole('button', { name: /INGRESAR/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email o contraseña incorrectos.',
    );
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('registra una cuenta y vuelve al inicio', async () => {
    const usuario = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sesion));
    renderPagina(Registro, '/registro');

    await usuario.type(screen.getByLabelText('Nombre'), 'Ana Pérez');
    await usuario.type(screen.getByLabelText('Email'), 'ana@example.com');
    await usuario.type(screen.getByLabelText('Contraseña'), 'secreto123');
    await usuario.click(screen.getByRole('button', { name: /CREAR CUENTA/i }));

    await waitFor(() => expect(screen.getByText('Inicio')).toBeInTheDocument());
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      nombre: 'Ana Pérez',
      email: 'ana@example.com',
      password: 'secreto123',
    });
  });
});
