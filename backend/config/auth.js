const EXPIRACION_POR_DEFECTO = '1d';
const RONDAS_BCRYPT_POR_DEFECTO = 12;
const RONDAS_BCRYPT_MINIMAS = 10;
const RONDAS_BCRYPT_MAXIMAS = 15;
const PATRON_EXPIRACION = /^[1-9]\d*[smhdwy]?$/i;

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
    return EXPIRACION_POR_DEFECTO;
  }

  if (!PATRON_EXPIRACION.test(valor)) {
    throw crearErrorDeConfiguracion(
      'JWT_EXPIRES_IN debe tener un formato como 1d, 12h o 3600 (segundos).',
    );
  }

  // jsonwebtoken interpreta un string puramente numérico como milisegundos;
  // convertirlo a número preserva la semántica de segundos documentada.
  return /^\d+$/.test(valor) ? Number(valor) : valor;
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
  EXPIRACION_POR_DEFECTO,
  RONDAS_BCRYPT_POR_DEFECTO,
  obtenerJwtSecret,
  obtenerExpiracionJwt,
  obtenerRondasBcrypt,
  validarConfiguracionAuth,
};
