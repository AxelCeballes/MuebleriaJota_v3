const express = require('express');
const upload = require('../middleware/imageUpload');
const { uploadImage, getImage } = require('../controllers/imageController');

const router = express.Router();

router.post('/', upload.single('imagen'), uploadImage);
router.get('/:id', getImage);

module.exports = router;
