const mongoose = require('mongoose');

const CONNECTION_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized',
};

let connectionPromise = null;

mongoose.connection.on('connected', () => {
  console.log(
    `[MongoDB] Conexión establecida con la base de datos "${mongoose.connection.name}".`,
  );
});

mongoose.connection.on('error', (error) => {
  console.error(`[MongoDB] Error de conexión: ${error.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Conexión perdida.');
});

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'La variable de entorno MONGODB_URI no está definida. Revisá el archivo .env.',
    );
  }

  connectionPromise = mongoose
    .connect(uri, { serverSelectionTimeoutMS: 10000 })
    .then(() => mongoose.connection)
    .finally(() => {
      connectionPromise = null;
    });

  return connectionPromise;
}

function getConnectionStatus() {
  return CONNECTION_STATES[mongoose.connection.readyState] || 'unknown';
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus,
};
