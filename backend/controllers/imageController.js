const { getImageBucket, imageIdFromUrl } = require('../services/imageStorage');

const asyncHandler = (handler) => (request, response, next) =>
  Promise.resolve(handler(request, response, next)).catch(next);

function detectImageType(buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

const uploadImage = asyncHandler(async (request, response) => {
  if (!request.file) {
    return response.status(400).json({ status: 'error', message: 'Seleccioná una imagen para subir.' });
  }

  const contentType = detectImageType(request.file.buffer);
  if (!contentType || contentType !== request.file.mimetype) {
    return response.status(415).json({ status: 'error', message: 'El archivo no es una imagen JPG, PNG o WebP válida.' });
  }

  const bucket = getImageBucket();
  const uploadStream = bucket.openUploadStream(request.file.originalname, {
    contentType,
    metadata: { contentType },
  });

  await new Promise((resolve, reject) => {
    uploadStream.once('error', reject);
    uploadStream.once('finish', resolve);
    uploadStream.end(request.file.buffer);
  });

  return response.status(201).json({ imagenUrl: `/api/imagenes/${uploadStream.id}` });
});

const getImage = asyncHandler(async (request, response) => {
  const id = imageIdFromUrl(`/api/imagenes/${request.params.id}`);
  if (!id) {
    return response.status(400).json({ status: 'error', message: 'El ID de imagen no es válido.' });
  }

  const bucket = getImageBucket();
  const file = await bucket.find({ _id: id }).next();
  if (!file) {
    return response.status(404).json({ status: 'error', message: 'Imagen no encontrada.' });
  }

  response.set({
    'Content-Type': file.metadata?.contentType || file.contentType || 'application/octet-stream',
    'Content-Length': String(file.length),
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  });
  const stream = bucket.openDownloadStream(id);
  stream.on('error', (error) => {
    if (!response.headersSent) response.status(404).end();
    else response.destroy(error);
  });
  stream.pipe(response);
});

module.exports = { uploadImage, getImage };
