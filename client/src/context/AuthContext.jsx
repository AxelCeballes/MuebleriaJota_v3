import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  headersConToken,
  mensajeDeError,
  urlDeApi,
} from '../utils/api';
import { AuthContext } from './auth-context';

const CLAVE_TOKEN = 'auth_token';
const MENSAJE_SIN_CONEXION = 'No pudimos conectar con el servidor. Intentá de nuevo.';

const leerTokenGuardado = () => {
  try {
    return localStorage.getItem(CLAVE_TOKEN) || null;
  } catch {
    return null;
  }
};

const guardarToken = (token) => {
  try {
    localStorage.setItem(CLAVE_TOKEN, token);
  } catch {
    // Almacenamiento no disponible: la sesión sigue viva en memoria.
  }
};

const borrarToken = () => {
  try {
    localStorage.removeItem(CLAVE_TOKEN);
  } catch {
    // Nada que limpiar si el almacenamiento no está disponible.
  }
};

const validarSesion = (datos) => {
  if (!datos?.token || !datos?.usuario) {
    throw new Error('La respuesta del servidor no contiene una sesión válida.');
  }
  return datos.usuario;
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(leerTokenGuardado);
  const [usuario, setUsuario] = useState(null);
  const [inicializando, setInicializando] = useState(() => Boolean(leerTokenGuardado()));

  const establecerSesion = useCallback((datos) => {
    const usuarioValidado = validarSesion(datos);
    guardarToken(datos.token);
    setToken(datos.token);
    setUsuario(usuarioValidado);
    setInicializando(false);
    return usuarioValidado;
  }, []);

  const enviarCredenciales = useCallback(async (ruta, cuerpo) => {
    let respuesta;

    try {
      respuesta = await fetch(urlDeApi(ruta), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });
    } catch {
      throw new Error(MENSAJE_SIN_CONEXION);
    }

    const { datos, mensaje } = await mensajeDeError(respuesta, MENSAJE_SIN_CONEXION);

    if (!respuesta.ok) throw new Error(mensaje);

    return establecerSesion(datos);
  }, [establecerSesion]);

  const iniciarSesion = useCallback(
    ({ email, password }) => enviarCredenciales('/api/auth/login', { email, password }),
    [enviarCredenciales],
  );

  const registrarUsuario = useCallback(
    ({ nombre, email, password }) =>
      enviarCredenciales('/api/auth/register', { nombre, email, password }),
    [enviarCredenciales],
  );

  const cerrarSesion = useCallback(() => {
    borrarToken();
    setToken(null);
    setUsuario(null);
    setInicializando(false);
  }, []);

  // Un token guardado se valida contra /me antes de mostrar rutas privadas.
  // Si expiró o el usuario ya no existe, se descarta sin dejar sesión "fantasma".
  useEffect(() => {
    if (!token) return undefined;

    let activo = true;
    const controlador = new AbortController();

    const restaurar = async () => {
      try {
        const respuesta = await fetch(urlDeApi('/api/auth/me'), {
          headers: headersConToken(token),
          signal: controlador.signal,
        });
        const { datos, mensaje } = await mensajeDeError(
          respuesta,
          'No se pudo restaurar la sesión.',
        );

        if (!activo) return;
        if (!respuesta.ok) throw new Error(mensaje);

        setUsuario(datos?.usuario ?? null);
      } catch (error) {
        if (!activo || error.name === 'AbortError') return;
        borrarToken();
        setToken(null);
        setUsuario(null);
      } finally {
        if (activo) setInicializando(false);
      }
    };

    restaurar();

    return () => {
      activo = false;
      controlador.abort();
    };
  }, [token]);

  const valor = useMemo(
    () => ({
      token,
      usuario,
      inicializando,
      esAdmin: usuario?.rol === 'admin',
      iniciarSesion,
      registrarUsuario,
      cerrarSesion,
    }),
    [token, usuario, inicializando, iniciarSesion, registrarUsuario, cerrarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
