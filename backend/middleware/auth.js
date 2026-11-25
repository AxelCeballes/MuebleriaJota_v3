const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { obtenerJwtSecret } = require('../config/auth');

const responderNoAutorizado = (response, mensaje) =>
  response.status(401).json({
    status: 'error',
    message: mensaje,
  });

const autenticar = async (request, response, next) => {
  const encabezado = request.headers.authorization;

  if (!encabezado) {
    return responderNoAutorizado(response, 'Necesitás iniciar sesión para continuar.');
  }

  const [esquema, token, extra] = encabezado.trim().split(/\s+/);

  if (!/^Bearer$/i.test(esquema || '') || !token || extra) {
    return responderNoAutorizado(response, 'El token de autenticación no es válido.');
  }

  let payload;

  try {
    payload = jwt.verify(token, obtenerJwtSecret());
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return responderNoAutorizado(response, 'Tu sesión expiró. Iniciá sesión de nuevo.');
    }

    return responderNoAutorizado(response, 'El token de autenticación no es válido.');
  }

  if (!payload || typeof payload.sub !== 'string' || !mongoose.Types.ObjectId.isValid(payload.sub)) {
    return responderNoAutorizado(response, 'El token de autenticación no es válido.');
  }

  const usuario = await User.findById(payload.sub).select('nombre email rol');

  if (!usuario) {
    return responderNoAutorizado(response, 'La sesión ya no es válida.');
  }

  request.user = {
    id: usuario._id.toString(),
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  };

  return next();
};

const requireAuth = (request, response, next) => {
  Promise.resolve(autenticar(request, response, next)).catch(next);
};

const requireRole = (...rolesPermitidos) => (request, response, next) => {
  if (!request.user) {
    return responderNoAutorizado(response, 'Necesitás iniciar sesión para continuar.');
  }

  if (!rolesPermitidos.includes(request.user.rol)) {
    return response.status(403).json({
      status: 'error',
      message: 'No tenés permisos para realizar esta acción.',
    });
  }

  return next();
};

module.exports = {
  requireAuth,
  requireRole,
};
