const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const { promoverUsuarioAAdmin } = require('../services/userRole');
const {
  validarConfiguracionAuth,
  obtenerExpiracionJwt,
  obtenerRondasBcrypt,
} = require('../config/auth');

const PASSWORD_VALIDA = 'secreto123';

const datosRegistro = (overrides = {}) => ({
  nombre: 'Ana Pérez',
  email: 'ana@example.com',
  password: PASSWORD_VALIDA,
  ...overrides,
});

const registrar = (overrides = {}) =>
  request(app).post('/api/auth/register').send(datosRegistro(overrides));

const iniciarSesion = (overrides = {}) =>
  request(app)
    .post('/api/auth/login')
    .send({ email: 'ana@example.com', password: PASSWORD_VALIDA, ...overrides });

const crearUsuario = async ({
  nombre = 'Ana Pérez',
  email = 'ana@example.com',
  password = PASSWORD_VALIDA,
  rol = 'customer',
} = {}) => {
  const passwordHash = await bcrypt.hash(password, 10);

  return User.create({ nombre, email, passwordHash, rol });
};

const firmarToken = (usuario, opciones = {}) =>
  jwt.sign(
    { sub: usuario._id.toString(), rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '1d' },
  );

describe('POST /api/auth/register', () => {
  test('crea un usuario customer con contraseña hasheada y devuelve un token', async () => {
    const respuesta = await registrar();

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.usuario).toMatchObject({
      nombre: 'Ana Pérez',
      email: 'ana@example.com',
      rol: 'customer',
    });
    expect(respuesta.body.usuario.id).toEqual(expect.any(String));
    expect(respuesta.body.token).toEqual(expect.any(String));
    expect(respuesta.body).not.toHaveProperty('passwordHash');
    expect(respuesta.body.usuario).not.toHaveProperty('passwordHash');
    expect(respuesta.body.usuario).not.toHaveProperty('password');

    const persistido = await User.findOne({ email: 'ana@example.com' }).select('+passwordHash');

    expect(persistido).not.toBeNull();
    expect(persistido.passwordHash).not.toBe(PASSWORD_VALIDA);
    expect(persistido.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(await bcrypt.compare(PASSWORD_VALIDA, persistido.passwordHash)).toBe(true);
  });

  test('normaliza el email a minúsculas y sin espacios', async () => {
    const respuesta = await registrar({ email: '  ANA@Example.COM  ' });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.usuario.email).toBe('ana@example.com');

    const persistido = await User.findOne({ email: 'ana@example.com' });
    expect(persistido).not.toBeNull();

    const login = await iniciarSesion({ email: 'ANA@EXAMPLE.COM' });
    expect(login.status).toBe(200);
  });

  test('ignora el rol enviado por el cliente y siempre crea un customer', async () => {
    const respuesta = await registrar({ rol: 'admin' });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.usuario.rol).toBe('customer');

    const persistido = await User.findOne({ email: 'ana@example.com' });
    expect(persistido.rol).toBe('customer');
  });

  test('devuelve 409 si el email ya está registrado', async () => {
    await registrar();
    const respuesta = await registrar();

    expect(respuesta.status).toBe(409);
    expect(respuesta.body).toEqual({
      status: 'error',
      message: 'Ya existe una cuenta con ese email.',
    });
    expect(await User.countDocuments({ email: 'ana@example.com' })).toBe(1);
  });

  test('devuelve 400 con errores claros si faltan campos obligatorios', async () => {
    const respuesta = await request(app).post('/api/auth/register').send({});

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.status).toBe('error');
    expect(respuesta.body.message).toBe('Los datos de registro no son válidos.');
    expect(respuesta.body.errors).toEqual(
      expect.arrayContaining([
        'El nombre es obligatorio.',
        'El email es obligatorio.',
        'La contraseña debe tener al menos 8 caracteres.',
      ]),
    );
  });

  test('devuelve 400 para un email inválido y una contraseña corta', async () => {
    const respuesta = await registrar({ email: 'no-es-email', password: 'corta' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errors).toEqual(
      expect.arrayContaining([
        'El email no tiene un formato válido.',
        'La contraseña debe tener al menos 8 caracteres.',
      ]),
    );
  });

  test('devuelve 400 si la contraseña supera los 72 bytes de bcrypt', async () => {
    const respuesta = await registrar({ password: 'a'.repeat(73) });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errors).toContain('La contraseña no puede superar los 72 bytes.');
  });
});

describe('POST /api/auth/login', () => {
  test('devuelve 200, el usuario público y un JWT válido', async () => {
    const usuario = await crearUsuario();

    const respuesta = await iniciarSesion();

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuario).toEqual({
      id: usuario._id.toString(),
      nombre: usuario.nombre,
      email: usuario.email,
      rol: 'customer',
    });
    expect(respuesta.body.token).toEqual(expect.any(String));
    expect(respuesta.body).not.toHaveProperty('passwordHash');

    const payload = jwt.verify(respuesta.body.token, process.env.JWT_SECRET);

    expect(payload.sub).toBe(usuario._id.toString());
    expect(payload.rol).toBe('customer');
    expect(payload).not.toHaveProperty('passwordHash');
    expect(payload).not.toHaveProperty('email');
  });

  test('devuelve 401 con mensaje genérico si la contraseña es incorrecta', async () => {
    await crearUsuario();

    const respuesta = await iniciarSesion({ password: 'incorrecta' });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body).toEqual({
      status: 'error',
      message: 'Email o contraseña incorrectos.',
    });
  });

  test('devuelve 401 con el mismo mensaje si el usuario no existe', async () => {
    const respuesta = await iniciarSesion({ email: 'nadie@example.com' });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body).toEqual({
      status: 'error',
      message: 'Email o contraseña incorrectos.',
    });
  });

  test('devuelve 400 si faltan email o contraseña', async () => {
    const respuesta = await request(app).post('/api/auth/login').send({});

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toBe('Los datos de inicio de sesión no son válidos.');
    expect(respuesta.body.errors).toEqual(
      expect.arrayContaining(['El email es obligatorio.', 'La contraseña es obligatoria.']),
    );
  });

  test('devuelve 400 si la contraseña supera los 72 bytes de bcrypt', async () => {
    const respuesta = await iniciarSesion({ password: 'a'.repeat(73) });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toBe('Los datos de inicio de sesión no son válidos.');
    expect(respuesta.body.errors).toContain('La contraseña no puede superar los 72 bytes.');
  });

  test('acepta exactamente 72 bytes de contraseña', async () => {
    const password72 = 'a'.repeat(72);
    await crearUsuario({ password: password72 });

    const respuesta = await iniciarSesion({ password: password72 });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.token).toEqual(expect.any(String));
  });
});

describe('GET /api/auth/me', () => {
  test('devuelve el usuario autenticado con un token válido', async () => {
    const usuario = await crearUsuario();
    const token = firmarToken(usuario);

    const respuesta = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuario).toEqual({
      id: usuario._id.toString(),
      nombre: usuario.nombre,
      email: usuario.email,
      rol: 'customer',
    });
    expect(respuesta.body.usuario).not.toHaveProperty('passwordHash');
  });

  test('devuelve 401 sin encabezado Authorization', async () => {
    const respuesta = await request(app).get('/api/auth/me');

    expect(respuesta.status).toBe(401);
    expect(respuesta.body).toEqual({
      status: 'error',
      message: 'Necesitás iniciar sesión para continuar.',
    });
  });

  test.each([
    ['esquema distinto de Bearer', 'Token abc'],
    ['sin token', 'Bearer'],
    ['con partes extra', 'Bearer abc def'],
  ])('devuelve 401 con %s', async (_caso, encabezado) => {
    const respuesta = await request(app)
      .get('/api/auth/me')
      .set('Authorization', encabezado);

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.status).toBe('error');
  });

  test('devuelve 401 si la firma del token no es válida', async () => {
    const usuario = await crearUsuario();
    const token = jwt.sign(
      { sub: usuario._id.toString(), rol: 'customer' },
      'otro-secreto-distinto',
      { expiresIn: '1d' },
    );

    const respuesta = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.message).toBe('El token de autenticación no es válido.');
  });

  test('devuelve 401 si el token expiró', async () => {
    const usuario = await crearUsuario();
    const token = jwt.sign(
      { sub: usuario._id.toString(), rol: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' },
    );

    const respuesta = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.message).toBe('Tu sesión expiró. Iniciá sesión de nuevo.');
  });

  test('devuelve 401 si el usuario del token ya no existe', async () => {
    const usuario = await crearUsuario();
    const token = firmarToken(usuario);

    await User.deleteOne({ _id: usuario._id });

    const respuesta = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.message).toBe('La sesión ya no es válida.');
  });

  test('devuelve 401 si el token no tiene un sub válido', async () => {
    const token = jwt.sign(
      { sub: 'no-es-un-objectid', rol: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
    );

    const respuesta = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.message).toBe('El token de autenticación no es válido.');
  });
});

describe('middleware de autorización por rol', () => {
  const appDePrueba = express();

  appDePrueba.get(
    '/solo-admin',
    requireAuth,
    requireRole('admin'),
    (request, response) => response.status(200).json({ rol: request.user.rol }),
  );

  test('devuelve 401 sin token', async () => {
    const respuesta = await request(appDePrueba).get('/solo-admin');

    expect(respuesta.status).toBe(401);
  });

  test('devuelve 403 para un usuario customer', async () => {
    const usuario = await crearUsuario({ rol: 'customer' });

    const respuesta = await request(appDePrueba)
      .get('/solo-admin')
      .set('Authorization', `Bearer ${firmarToken(usuario)}`);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body).toEqual({
      status: 'error',
      message: 'No tenés permisos para realizar esta acción.',
    });
  });

  test('permite el acceso a un usuario admin', async () => {
    const usuario = await crearUsuario({ rol: 'admin' });

    const respuesta = await request(appDePrueba)
      .get('/solo-admin')
      .set('Authorization', `Bearer ${firmarToken(usuario)}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ rol: 'admin' });
  });
});

describe('promoción manual a administrador', () => {
  test('promueve a admin un usuario existente y normaliza el email', async () => {
    const usuario = await crearUsuario({ rol: 'customer' });

    const resultado = await promoverUsuarioAAdmin('  ANA@Example.COM ');

    expect(resultado).toEqual({
      encontrado: true,
      cambiado: true,
      email: 'ana@example.com',
    });

    const persistido = await User.findById(usuario._id);
    expect(persistido.rol).toBe('admin');
  });

  test('no cambia nada si el usuario ya es admin', async () => {
    await crearUsuario({ rol: 'admin' });

    const resultado = await promoverUsuarioAAdmin('ana@example.com');

    expect(resultado).toEqual({
      encontrado: true,
      cambiado: false,
      email: 'ana@example.com',
    });
  });

  test('no crea usuarios inexistentes', async () => {
    const resultado = await promoverUsuarioAAdmin('nadie@example.com');

    expect(resultado).toEqual({
      encontrado: false,
      cambiado: false,
      email: 'nadie@example.com',
    });
    expect(await User.countDocuments()).toBe(0);
  });

  test('rechaza un email vacío', async () => {
    await expect(promoverUsuarioAAdmin('   ')).rejects.toThrow(/email/i);
  });
});

describe('configuración de autenticación', () => {
  const configuracionOriginal = {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS,
  };

  afterEach(() => {
    process.env.JWT_SECRET = configuracionOriginal.JWT_SECRET;
    process.env.JWT_EXPIRES_IN = configuracionOriginal.JWT_EXPIRES_IN;
    process.env.BCRYPT_SALT_ROUNDS = configuracionOriginal.BCRYPT_SALT_ROUNDS;
  });

  test('falla si JWT_SECRET no está definida', () => {
    delete process.env.JWT_SECRET;

    expect(() => validarConfiguracionAuth()).toThrow(/JWT_SECRET/);
  });

  test('falla si JWT_SECRET está vacía', () => {
    process.env.JWT_SECRET = '   ';

    expect(() => validarConfiguracionAuth()).toThrow(/JWT_SECRET/);
  });

  test('usa 1d y 12 rondas por defecto', () => {
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.BCRYPT_SALT_ROUNDS;

    expect(obtenerExpiracionJwt()).toBe(86400);
    expect(obtenerRondasBcrypt()).toBe(12);
  });

  test.each([
    ['1s', 1],
    ['30s', 30],
    ['15m', 900],
    ['12h', 43200],
    ['1d', 86400],
    ['2w', 1209600],
    ['1y', 31557600],
    ['3600', 3600],
  ])('convierte JWT_EXPIRES_IN=%s a %i segundos', (valor, esperado) => {
    process.env.JWT_EXPIRES_IN = valor;

    expect(obtenerExpiracionJwt()).toBe(esperado);
  });

  test.each([
    ['1s', 1],
    ['15m', 900],
    ['12h', 43200],
    ['1d', 86400],
    ['2w', 1209600],
    ['1y', 31557600],
    ['3600', 3600],
  ])('la expiración %s es compatible con jsonwebtoken', (valor, esperado) => {
    process.env.JWT_EXPIRES_IN = valor;
    const expiracion = obtenerExpiracionJwt();

    const token = jwt.sign({ sub: 'validacion' }, process.env.JWT_SECRET, {
      expiresIn: expiracion,
    });
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    expect(payload.exp - payload.iat).toBe(esperado);
  });

  test.each([
    '0',
    '-1',
    '-1d',
    '1.5h',
    '1ms',
    '5mo',
    '10 days',
    '1D',
    'una semana',
    '1d extra',
  ])('rechaza el formato inválido JWT_EXPIRES_IN=%s', (valor) => {
    process.env.JWT_EXPIRES_IN = valor;

    expect(() => obtenerExpiracionJwt()).toThrow(/JWT_EXPIRES_IN/);
  });

  test('rechaza una expiración que supera el rango numérico seguro', () => {
    process.env.JWT_EXPIRES_IN = '999999999999999999999y';

    expect(() => obtenerExpiracionJwt()).toThrow(/JWT_EXPIRES_IN/);
  });

  test('rechaza rondas de bcrypt fuera del rango permitido', () => {
    process.env.BCRYPT_SALT_ROUNDS = '4';

    expect(() => validarConfiguracionAuth()).toThrow(/BCRYPT_SALT_ROUNDS/);
  });
});
