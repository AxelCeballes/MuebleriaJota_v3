require('dotenv').config();

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const { promoverUsuarioAAdmin } = require('../services/userRole');

const email = (process.argv[2] || '').trim();

async function promoverAdministrador() {
  if (!email) {
    console.error('Uso: node scripts/promoteAdmin.js <email-del-usuario>');
    process.exitCode = 1;
    return;
  }

  try {
    await connectDB();

    const resultado = await promoverUsuarioAAdmin(email);

    if (!resultado.encontrado) {
      console.error(`No existe un usuario registrado con el email ${resultado.email}.`);
      process.exitCode = 1;
      return;
    }

    if (!resultado.cambiado) {
      console.log(`El usuario ${resultado.email} ya tiene el rol admin. No se realizaron cambios.`);
      return;
    }

    console.log(`El usuario ${resultado.email} fue promovido al rol admin.`);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await disconnectDB();
    }
  }
}

promoverAdministrador().catch((error) => {
  console.error(`No se pudo promover al usuario: ${error.message}`);
  process.exitCode = 1;
});
