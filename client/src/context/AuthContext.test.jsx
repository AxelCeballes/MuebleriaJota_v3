import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthContext';
import { useAuth } from '../hooks/useAuth';

const USUARIO = {
  id: '650000000000000000000001',
  nombre: 'Ana Pérez',
  email: 'ana@example.com',
  rol: 'customer',
};

const sesion = (usuario = USUARIO, token = 'token-123') => ({
  ok: true,
  json: async () => ({ usuario, token }),
});

const respuestaError = (message, status = 400) => ({
  ok: false,
  status,
  json: async () => ({ status: 'error', message }),
});

describe('AuthContext', () => {
  it('inicia sesión, guarda el token y expone el usuario', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sesion()));
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await result.current.iniciarSesion({
        email: 'ana@example.com',
        password: 'secreto123',
      });
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.current.usuario).toEqual(USUARIO);
    expect(result.current.token).toBe('token-123');
    expect(localStorage.getItem('auth_token')).toBe('token-123');
    expect(result.current.inicializando).toBe(false);
  });

  it('muestra el mensaje del servidor cuando las credenciales fallan', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(respuestaError('Email o contraseña incorrectos.')),
    );
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    let errorRecibido = null;

    await act(async () => {
      try {
        await result.current.iniciarSesion({
          email: 'ana@example.com',
          password: 'incorrecta',
        });
      } catch (error) {
        errorRecibido = error;
      }
    });

    expect(errorRecibido?.message).toBe('Email o contraseña incorrectos.');
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(result.current.usuario).toBeNull();
  });

  it('registra sin enviar un rol desde el cliente', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sesion()));
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await result.current.registrarUsuario({
        nombre: 'Ana Pérez',
        email: 'ana@example.com',
        password: 'secreto123',
        rol: 'admin',
      });
    });

    const cuerpo = JSON.parse(fetch.mock.calls[0][1].body);
    expect(cuerpo).toEqual({
      nombre: 'Ana Pérez',
      email: 'ana@example.com',
      password: 'secreto123',
    });
    expect(result.current.usuario.rol).toBe('customer');
  });

  it('cierra la sesión y limpia el token guardado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sesion()));
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await result.current.iniciarSesion({
        email: 'ana@example.com',
        password: 'secreto123',
      });
    });
    await act(async () => {
      result.current.cerrarSesion();
    });

    expect(result.current.usuario).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('restaura la sesión con /me y marca esAdmin', async () => {
    localStorage.setItem('auth_token', 'token-admin');
    const admin = { ...USUARIO, rol: 'admin' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ usuario: admin }) }));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    expect(result.current.inicializando).toBe(true);
    await waitFor(() => expect(result.current.usuario).toEqual(admin));
    expect(result.current.inicializando).toBe(false);
    expect(result.current.esAdmin).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({
        headers: { Authorization: 'Bearer token-admin' },
      }),
    );
  });

  it('descarta el token cuando /me responde 401', async () => {
    localStorage.setItem('auth_token', 'token-vencido');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(respuestaError('Tu sesión expiró.', 401)),
    );

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.token).toBeNull());
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(result.current.usuario).toBeNull();
    expect(result.current.inicializando).toBe(false);
    expect(result.current.errorRestauracion).toBeNull();
  });

  it('conserva el token ante un error 500 y permite reintentar', async () => {
    localStorage.setItem('auth_token', 'token-123');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respuestaError('Error interno del servidor.', 500))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ usuario: USUARIO }) });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.errorRestauracion).toBeTruthy());
    expect(result.current.inicializando).toBe(false);
    // Nunca se muestra una sesión que no pudo validarse.
    expect(result.current.usuario).toBeNull();
    expect(result.current.token).toBe('token-123');
    expect(localStorage.getItem('auth_token')).toBe('token-123');

    act(() => result.current.reintentarRestauracion());

    await waitFor(() => expect(result.current.usuario).toEqual(USUARIO));
    expect(result.current.errorRestauracion).toBeNull();
    expect(result.current.inicializando).toBe(false);
    expect(result.current.token).toBe('token-123');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('conserva el token cuando falla la conexión al restaurar', async () => {
    localStorage.setItem('auth_token', 'token-123');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    );

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.errorRestauracion).toBeTruthy());
    expect(result.current.inicializando).toBe(false);
    expect(result.current.usuario).toBeNull();
    expect(result.current.token).toBe('token-123');
    expect(localStorage.getItem('auth_token')).toBe('token-123');
  });
});
