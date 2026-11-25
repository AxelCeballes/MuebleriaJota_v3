const express = require('express');
const {
  registrarUsuario,
  iniciarSesion,
  obtenerPerfil,
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registrarUsuario);
router.post('/login', iniciarSesion);
router.get('/me', requireAuth, obtenerPerfil);

module.exports = router;
