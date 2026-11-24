const User = require('../models/User');

const normalizarEmail = (email) =>
  typeof email === 'string' ? email.trim().toLowerCase() : '';

const promoverUsuarioAAdmin = async (email) => {
  const emailNormalizado = normalizarEmail(email);

  if (!emailNormalizado) {
    throw new Error('El email del usuario es obligatorio.');
  }

  const usuario = await User.findOne({ email: emailNormalizado }).select('_id email rol');

  if (!usuario) {
    return {
      encontrado: false,
      cambiado: false,
      email: emailNormalizado,
    };
  }

  if (usuario.rol === 'admin') {
    return {
      encontrado: true,
      cambiado: false,
      email: emailNormalizado,
    };
  }

  await User.updateOne(
    { _id: usuario._id },
    { $set: { rol: 'admin' } },
    { runValidators: true },
  );

  return {
    encontrado: true,
    cambiado: true,
    email: emailNormalizado,
  };
};

module.exports = {
  normalizarEmail,
  promoverUsuarioAAdmin,
};
