process.env.NODE_ENV = 'test';
delete process.env.MONGODB_URI;

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
  const collections = Object.values(mongoose.connection.collections);

  await Promise.all(collections.map((collection) => collection.deleteMany({})));
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
