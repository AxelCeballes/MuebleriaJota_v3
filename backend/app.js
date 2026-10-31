const cors = require('cors');
const express = require('express');
const { getConnectionStatus } = require('./config/db');
const corsOptions = require('./config/cors');
const productRoutes = require('./routes/productRoutes');
const imageRoutes = require('./routes/imageRoutes');
const upload = require('./middleware/imageUpload');

const app = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: '20kb' }));
app.disable('x-powered-by');

app.get('/api/health', (request, response) => {
  const mongodb = getConnectionStatus();
  const healthy = mongodb === 'connected';

  response.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'error',
    message: healthy
      ? 'Servidor y base de datos disponibles.'
      : 'Servidor disponible, pero la base de datos no está conectada.',
    mongodb,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/imagenes', imageRoutes);
app.use('/api/productos', productRoutes);

app.use((request, response) => {
  response.status(404).json({
    status: 'error',
    message: 'Ruta no encontrada.',
  });
});

app.use((error, request, response, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return response.status(413).json({ status: 'error', message: 'La imagen no puede superar los 3 MB.' });
  }

  if (error instanceof upload.MulterError) {
    return response.status(400).json({ status: 'error', message: 'No se pudo procesar el archivo enviado.' });
  }

  if (error.status) {
    return response.status(error.status).json({ status: 'error', message: error.message });
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({
      status: 'error',
      message: 'El cuerpo de la petición no contiene un JSON válido.',
    });
  }

  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((item) => item.message);

    return response.status(400).json({
      status: 'error',
      message: 'Los datos del producto no son válidos.',
      errors,
    });
  }

  if (error.name === 'CastError') {
    return response.status(400).json({
      status: 'error',
      message: 'Los datos enviados no tienen un formato válido.',
    });
  }

  if (error.code === 11000) {
    return response.status(400).json({
      status: 'error',
      message: 'Ya existe un registro con los mismos datos únicos.',
    });
  }

  console.error('[Express] Error no controlado:', error);

  return response.status(500).json({
    status: 'error',
    message: 'Error interno del servidor.',
  });
});

module.exports = app;
