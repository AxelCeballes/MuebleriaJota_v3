const express = require('express');
const {
  crearPedido,
  obtenerMisPedidos,
  obtenerPedidosAdmin,
} = require('../controllers/orderController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, crearPedido);
router.get('/mis-pedidos', requireAuth, obtenerMisPedidos);
router.get('/', requireAuth, requireRole('admin'), obtenerPedidosAdmin);

module.exports = router;
