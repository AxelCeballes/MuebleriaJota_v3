const express = require('express');
const upload = require('../middleware/imageUpload');
const { uploadImage, getImage } = require('../controllers/imageController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  upload.single('imagen'),
  uploadImage,
);
router.get('/:id', getImage);

module.exports = router;
