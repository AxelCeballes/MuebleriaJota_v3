const jwt = require('jsonwebtoken');
const User = require('../../models/User');

let contador = 0;

const crearUsuarioConToken = async ({ rol = 'admin' } = {}) => {
  contador += 1;

  const usuario = await User.create({
    nombre: `Usuario de prueba ${contador}`,
    email: `usuario-${rol}-${contador}@example.com`,
    passwordHash: 'hash-de-prueba-no-utilizado',
    rol,
  });

  const token = jwt.sign(
    { sub: usuario._id.toString(), rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '1d' },
  );

  return {
    usuario,
    token,
    authorization: `Bearer ${token}`,
  };
};

module.exports = {
  crearUsuarioConToken,
};
