const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  obtenerJwtSecret,
  obtenerExpiracionJwt,
  obtenerRondasBcrypt,
} = require('../config/auth');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MINIMA = 8;
// bcrypt trunca las contraseñas a 72 bytes; rechazarlas antes evita resultados confusos.
const PASSWORD_MAXIMA_BYTES = 72;
const NOMBRE_MAXIMO = 80;
const MENSAJE_CREDENCIALES = 'Email o contraseña incorrectos.';

const asyncHandler = (handler) => (request, response, next) =>
  Promise.resolve(handler(request, response, next)).catch(next);

const normalizarEmail = (email) =>
  typeof email === 'string' ? email.trim().toLowerCase() : '';

const serializarUsuario = (usuario) => ({
  id: usuario._id.toString(),
  nombre: usuario.nombre,
  email: usuario.email,
  rol: usuario.rol,
});

const generarToken = (usuario) =>
  jwt.sign(
    {
      sub: usuario._id.toString(),
      rol: usuario.rol,
    },
    obtenerJwtSecret(),
    { expiresIn: obtenerExpiracionJwt() },
  );

const validarDatosDeRegistro = ({ nombre, email, password }) => {
  const errores = [];
  const nombreNormalizado = typeof nombre === 'string' ? nombre.trim() : '';
  const emailNormalizado = normalizarEmail(email);

  if (!nombreNormalizado) {
    errores.push('El nombre es obligatorio.');
  } else if (nombreNormalizado.length > NOMBRE_MAXIMO) {
    errores.push(`El nombre no puede superar los ${NOMBRE_MAXIMO} caracteres.`);
  }

  if (!emailNormalizado) {
    errores.push('El email es obligatorio.');
  } else if (!EMAIL_REGEX.test(emailNormalizado)) {
    errores.push('El email no tiene un formato válido.');
  }

  if (typeof password !== 'string' || password.length < PASSWORD_MINIMA) {
    errores.push(`La contraseña debe tener al menos ${PASSWORD_MINIMA} caracteres.`);
  } else if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAXIMA_BYTES) {
    errores.push(`La contraseña no puede superar los ${PASSWORD_MAXIMA_BYTES} bytes.`);
  }

  return { errores, nombre: nombreNormalizado, email: emailNormalizado };
};

const responderCredencialesInvalidas = (response) =>
  response.status(401).json({
    status: 'error',
    message: MENSAJE_CREDENCIALES,
  });

const registrarUsuario = asyncHandler(async (request, response) => {
  const body = request.body ?? {};
  const { errores, nombre, email } = validarDatosDeRegistro(body);

  if (errores.length > 0) {
    return response.status(400).json({
      status: 'error',
      message: 'Los datos de registro no son válidos.',
      errors: errores,
    });
  }

  // El rol nunca se toma del cliente: todo registro público crea un customer.
  const existente = await User.exists({ email });

  if (existente) {
    return response.status(409).json({
      status: 'error',
      message: 'Ya existe una cuenta con ese email.',
    });
  }

  const passwordHash = await bcrypt.hash(body.password, obtenerRondasBcrypt());

  let usuario;

  try {
    usuario = await User.create({
      nombre,
      email,
      passwordHash,
      rol: 'customer',
    });
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({
        status: 'error',
        message: 'Ya existe una cuenta con ese email.',
      });
    }

    throw error;
  }

  return response.status(201).json({
    usuario: serializarUsuario(usuario),
    token: generarToken(usuario),
  });
});

const iniciarSesion = asyncHandler(async (request, response) => {
  const body = request.body ?? {};
  const email = normalizarEmail(body.email);
  const { password } = body;
  const errores = [];

  if (!email) {
    errores.push('El email es obligatorio.');
  } else if (!EMAIL_REGEX.test(email)) {
    errores.push('El email no tiene un formato válido.');
  }

  if (typeof password !== 'string' || password.length === 0) {
    errores.push('La contraseña es obligatoria.');
  }

  if (errores.length > 0) {
    return response.status(400).json({
      status: 'error',
      message: 'Los datos de inicio de sesión no son válidos.',
      errors: errores,
    });
  }

  const usuario = await User.findOne({ email }).select('+passwordHash');

  if (!usuario) {
    return responderCredencialesInvalidas(response);
  }

  const coincide = await bcrypt.compare(password, usuario.passwordHash);

  if (!coincide) {
    return responderCredencialesInvalidas(response);
  }

  return response.status(200).json({
    usuario: serializarUsuario(usuario),
    token: generarToken(usuario),
  });
});

const obtenerPerfil = asyncHandler(async (request, response) => {
  response.status(200).json({ usuario: request.user });
});

module.exports = {
  registrarUsuario,
  iniciarSesion,
  obtenerPerfil,
};
