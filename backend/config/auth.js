const RONDAS_BCRYPT_POR_DEFECTO = 12;
const RONDAS_BCRYPT_MINIMAS = 10;
const RONDAS_BCRYPT_MAXIMAS = 15;

// Unidades compatibles con jsonwebtoken/ms, expresadas en segundos.
// ms calcula el año como 365.25 días; se replica ese criterio.
const SEGUNDOS_POR_UNIDAD = Object.freeze({
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
  w: 7 * 24 * 60 * 60,
  y: Math.round(365.25 * 24 * 60 * 60),
});

const EXPIRACION_POR_DEFECTO_EN_SEGUNDOS = SEGUNDOS_POR_UNIDAD.d;
const PATRON_EXPIRACION = /^([1-9]\d*)([smhdwy])?$/;

const crearErrorDeConfiguracion = (mensaje) => {
  const error = new Error(mensaje);
  error.name = 'AuthConfigError';
  return error;
};

const obtenerJwtSecret = () => {
  const secreto = typeof process.env.JWT_SECRET === 'string'
    ? process.env.JWT_SECRET.trim()
    : '';

  if (!secreto) {
    throw crearErrorDeConfiguracion(
      'La variable de entorno JWT_SECRET es obligatoria para firmar y verificar sesiones.',
    );
  }

  return secreto;
};

const obtenerExpiracionJwt = () => {
  const valor = typeof process.env.JWT_EXPIRES_IN === 'string'
    ? process.env.JWT_EXPIRES_IN.trim()
    : '';

  if (!valor) {
    return EXPIRACION_POR_DEFECTO_EN_SEGUNDOS;
  }

  const coincidencia = PATRON_EXPIRACION.exec(valor);

  if (!coincidencia) {
    throw crearErrorDeConfiguracion(
      'JWT_EXPIRES_IN debe ser un número positivo con unidad s, m, h, d, w o y '
        + '(por ejemplo 30s, 15m, 12h o 1d), o un número de segundos (por ejemplo 3600).',
    );
  }

  const cantidad = Number(coincidencia[1]);
  const unidad = coincidencia[2] || 's';
  const expiracionEnSegundos = cantidad * SEGUNDOS_POR_UNIDAD[unidad];

  if (!Number.isSafeInteger(expiracionEnSegundos) || expiracionEnSegundos <= 0) {
    throw crearErrorDeConfiguracion(
      'JWT_EXPIRES_IN supera el rango de duración admitido.',
    );
  }

  // jsonwebtoken interpreta un string numérico como milisegundos; al devolver
  // siempre segundos numéricos evitamos esa ambigüedad.
  return expiracionEnSegundos;
};

const obtenerRondasBcrypt = () => {
  const valor = typeof process.env.BCRYPT_SALT_ROUNDS === 'string'
    ? process.env.BCRYPT_SALT_ROUNDS.trim()
    : '';

  if (!valor) {
    return RONDAS_BCRYPT_POR_DEFECTO;
  }

  if (!/^\d+$/.test(valor)) {
    throw crearErrorDeConfiguracion('BCRYPT_SALT_ROUNDS debe ser un número entero.');
  }

  const rondas = Number(valor);

  if (rondas < RONDAS_BCRYPT_MINIMAS || rondas > RONDAS_BCRYPT_MAXIMAS) {
    throw crearErrorDeConfiguracion(
      `BCRYPT_SALT_ROUNDS debe estar entre ${RONDAS_BCRYPT_MINIMAS} y ${RONDAS_BCRYPT_MAXIMAS}.`,
    );
  }

  return rondas;
};

const validarConfiguracionAuth = () => {
  obtenerJwtSecret();
  const expiracionJwt = obtenerExpiracionJwt();
  const rondasBcrypt = obtenerRondasBcrypt();

  return { expiracionJwt, rondasBcrypt };
};

module.exports = {
  RONDAS_BCRYPT_POR_DEFECTO,
  SEGUNDOS_POR_UNIDAD,
  obtenerJwtSecret,
  obtenerExpiracionJwt,
  obtenerRondasBcrypt,
  validarConfiguracionAuth,
};
