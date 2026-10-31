const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (request, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error('Formato de imagen no admitido. Usá JPG, PNG o WebP.');
      error.status = 415;
      return callback(error);
    }
    return callback(null, true);
  },
});

module.exports = upload;
