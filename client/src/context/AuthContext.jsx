import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  headersConToken,
  mensajeDeError,
  urlDeApi,
} from '../utils/api';
import { AuthContext } from './auth-context';

const CLAVE_TOKEN = 'auth_token';
const MENSAJE_SIN_CONEXION = 'No pudimos conectar con el servidor. Intentá de nuevo.';
const MENSAJE_SESION_NO_VALIDADA =
  'No pudimos validar tu sesión. Revisá tu conexión e intentá de nuevo.';

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
  const [errorRestauracion, setErrorRestauracion] = useState(null);
  const [intentoRestauracion, setIntentoRestauracion] = useState(0);
  // Evita volver a pedir /me para un token que ya fue validado en esta sesión.
  const tokenValidadoRef = useRef(null);

  const establecerSesion = useCallback((datos) => {
    const usuarioValidado = validarSesion(datos);
    guardarToken(datos.token);
    tokenValidadoRef.current = datos.token;
    setToken(datos.token);
    setUsuario(usuarioValidado);
    setErrorRestauracion(null);
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
    tokenValidadoRef.current = null;
    setToken(null);
    setUsuario(null);
    setErrorRestauracion(null);
    setInicializando(false);
  }, []);

  const reintentarRestauracion = useCallback(() => {
    setErrorRestauracion(null);
    setInicializando(true);
    setIntentoRestauracion((valor) => valor + 1);
  }, []);

  // Un token guardado se valida contra /me antes de mostrar rutas privadas.
  // Sólo un 401/4xx descarta la sesión: un 5xx o un fallo de red es temporal,
  // conserva el token y habilita un reintento sin mostrar usuario sin validar.
  useEffect(() => {
    // El estado inicial y el cierre de sesión ya dejan `inicializando` en false;
    // un token validado en esta sesión no necesita otra llamada a /me.
    if (!token || tokenValidadoRef.current === token) return undefined;

    let activo = true;
    const controlador = new AbortController();

    const restaurar = async () => {
      try {
        const respuesta = await fetch(urlDeApi('/api/auth/me'), {
          headers: headersConToken(token),
          signal: controlador.signal,
        });
        const { datos } = await mensajeDeError(
          respuesta,
          'No se pudo restaurar la sesión.',
        );

        if (!activo) return;

        if (respuesta.ok) {
          if (!datos?.usuario) {
            setErrorRestauracion(MENSAJE_SESION_NO_VALIDADA);
            return;
          }

          tokenValidadoRef.current = token;
          setUsuario(datos.usuario);
          setErrorRestauracion(null);
          return;
        }

        if (Number(respuesta.status) >= 500) {
          setErrorRestauracion(MENSAJE_SESION_NO_VALIDADA);
          return;
        }

        borrarToken();
        tokenValidadoRef.current = null;
        setToken(null);
        setUsuario(null);
        setErrorRestauracion(null);
      } catch (error) {
        if (!activo || error.name === 'AbortError') return;
        setErrorRestauracion(MENSAJE_SESION_NO_VALIDADA);
      } finally {
        if (activo) setInicializando(false);
      }
    };

    restaurar();

    return () => {
      activo = false;
      controlador.abort();
    };
  }, [token, intentoRestauracion]);

  const valor = useMemo(
    () => ({
      token,
      usuario,
      inicializando,
      errorRestauracion,
      esAdmin: usuario?.rol === 'admin',
      iniciarSesion,
      registrarUsuario,
      cerrarSesion,
      reintentarRestauracion,
    }),
    [
      token,
      usuario,
      inicializando,
      errorRestauracion,
      iniciarSesion,
      registrarUsuario,
      cerrarSesion,
      reintentarRestauracion,
    ],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
