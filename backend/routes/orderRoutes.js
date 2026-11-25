const express = require('express');
const { crearPedido, obtenerMisPedidos } = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, crearPedido);
router.get('/mis-pedidos', requireAuth, obtenerMisPedidos);

module.exports = router;
