const express = require('express');
const upload = require('../middleware/imageUpload');
const { requireAdmin } = require('../middleware/adminAuth');
const { uploadImage, getImage } = require('../controllers/imageController');

const router = express.Router();

router.post('/', requireAdmin, upload.single('imagen'), uploadImage);
router.get('/:id', getImage);

module.exports = router;
