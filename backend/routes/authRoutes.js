const express = require('express');
const {
  registrarUsuario,
  iniciarSesion,
  obtenerPerfil,
  listarClientes,
} = require('../controllers/authController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registrarUsuario);
router.post('/login', iniciarSesion);
router.get('/me', requireAuth, obtenerPerfil);
router.get('/clientes', requireAuth, requireRole('admin'), listarClientes);

module.exports = router;
