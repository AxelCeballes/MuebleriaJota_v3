process.env.NODE_ENV = 'test';
delete process.env.MONGODB_URI;
// Configuración determinista para los tests: no depende del .env local.
process.env.JWT_SECRET = 'secreto-de-prueba-solo-para-tests-1234567890';
process.env.JWT_EXPIRES_IN = '1d';
process.env.BCRYPT_SALT_ROUNDS = '10';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDB, disconnectDB } = require('../config/db');

const TEST_DB_NAME = 'muebleria-jota-test';

let mongoServer;

const verificarUriDePrueba = (uri) => {
  if (!uri) {
    throw new Error('MongoDB Memory Server no devolvió una URI de prueba.');
  }

  if (/mongodb\+srv|mongodb\.net|atlas/i.test(uri)) {
    throw new Error('Las pruebas no pueden conectarse a MongoDB Atlas.');
  }

  if (!/^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\//.test(uri)) {
    throw new Error(`La URI de prueba no apunta a MongoDB Memory Server: ${uri}`);
  }
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { dbName: TEST_DB_NAME },
  });

  const uri = mongoServer.getUri(TEST_DB_NAME);
  verificarUriDePrueba(uri);
  process.env.MONGODB_URI = uri;

  await connectDB();

  if (mongoose.connection.host !== '127.0.0.1' || mongoose.connection.name !== TEST_DB_NAME) {
    throw new Error(
      `Conexión de prueba inesperada: host=${mongoose.connection.host}, db=${mongoose.connection.name}`,
    );
  }
});

afterEach(async () => {
  const db = mongoose.connection.db;

  if (!db) return;

  const collections = await db.listCollections({}, { nameOnly: true }).toArray();

  await Promise.all(
    collections.map(({ name }) => db.collection(name).deleteMany({})),
  );
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
  }

  await disconnectDB();

  if (mongoServer) {
    await mongoServer.stop();
  }
});
