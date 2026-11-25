const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', requireAuth, requireRole('admin'), createProduct);
router.put('/:id', requireAuth, requireRole('admin'), updateProduct);
router.delete('/:id', requireAuth, requireRole('admin'), deleteProduct);

module.exports = router;
