require('dotenv').config();

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 3000;

let server;

async function startServer() {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`[Express] Servidor escuchando en el puerto ${PORT}.`);
    });

    server.on('error', (error) => {
      console.error(`[Express] No se pudo iniciar el servidor: ${error.message}`);
      process.exit(1);
    });
  } catch (error) {
    console.error(`[Startup] No se pudo iniciar el servidor: ${error.message}`);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`[Shutdown] Recibida la señal ${signal}. Cerrando servidor...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await disconnectDB();
  process.exit(0);
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => {
    shutdown(signal).catch((error) => {
      console.error(`[Shutdown] Error al cerrar el servidor: ${error.message}`);
      process.exit(1);
    });
  });
});

startServer();
