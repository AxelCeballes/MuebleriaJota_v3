import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Navbar from './Navbar';
import { AuthProvider } from '../context/AuthContext';

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

const renderNavbar = () =>
  render(
    <AuthProvider>
      <MemoryRouter>
        <Navbar cantidadCarrito={2} />
      </MemoryRouter>
    </AuthProvider>,
  );

describe('Navbar', () => {
  it('muestra ingreso y registro para visitantes', () => {
    renderNavbar();

    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrarse' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Admin' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Menú de cuenta' })).not.toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('despliega las opciones de cuenta para usuarios autenticados', async () => {
    const usuario = userEvent.setup();
    localStorage.setItem('auth_token', 'token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(perfilDe('customer')));

    renderNavbar();

    const botonCuenta = await screen.findByRole('button', { name: 'Menú de cuenta' });
    expect(screen.queryByRole('link', { name: 'Mi perfil' })).not.toBeInTheDocument();

    await usuario.click(botonCuenta);

    expect(screen.getByRole('link', { name: 'Mi perfil' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mis pedidos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Admin' })).not.toBeInTheDocument();
    expect(botonCuenta).toHaveAttribute('aria-expanded', 'true');
  });

  it('cierra el menú de cuenta al tocar fuera o con Escape', async () => {
    const usuario = userEvent.setup();
    localStorage.setItem('auth_token', 'token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(perfilDe('customer')));

    renderNavbar();

    const botonCuenta = await screen.findByRole('button', { name: 'Menú de cuenta' });

    await usuario.click(botonCuenta);
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toBeInTheDocument();

    await usuario.click(screen.getByAltText('Hermanos Jota'));
    expect(screen.queryByRole('link', { name: 'Mi perfil' })).not.toBeInTheDocument();

    await usuario.click(botonCuenta);
    await usuario.keyboard('{Escape}');

    expect(screen.queryByRole('link', { name: 'Mi perfil' })).not.toBeInTheDocument();
    expect(botonCuenta).toHaveFocus();
  });

  it('muestra Admin sólo para administradores y cierra la sesión desde el menú', async () => {
    const usuario = userEvent.setup();
    localStorage.setItem('auth_token', 'token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(perfilDe('admin')));

    renderNavbar();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Admin' })).toBeInTheDocument());
    await usuario.click(screen.getByRole('button', { name: 'Menú de cuenta' }));
    await usuario.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Menú de cuenta' })).not.toBeInTheDocument();
  });
});
