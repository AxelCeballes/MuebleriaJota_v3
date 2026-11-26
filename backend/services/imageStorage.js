const mongoose = require('mongoose');

let bucket;

function getImageBucket() {
  if (!mongoose.connection.db) throw new Error('MongoDB no está conectado.');
  if (!bucket) {
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'imagenesProductos' });
  }
  return bucket;
}

function imageIdFromUrl(imageUrl) {
  const match = typeof imageUrl === 'string' && imageUrl.match(/^\/api\/imagenes\/([a-f\d]{24})$/i);
  return match ? new mongoose.Types.ObjectId(match[1]) : null;
}

function detectImageType(buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

async function uploadImageBuffer(buffer, originalname, contentType) {
  const uploadStream = getImageBucket().openUploadStream(originalname, {
    contentType,
    metadata: { contentType },
  });

  await new Promise((resolve, reject) => {
    uploadStream.once('error', reject);
    uploadStream.once('finish', resolve);
    uploadStream.end(buffer);
  });

  return uploadStream.id;
}

async function deleteStoredImage(imageUrl) {
  const id = imageIdFromUrl(imageUrl);
  if (!id) return;
  try {
    await getImageBucket().delete(id);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

module.exports = {
  getImageBucket,
  imageIdFromUrl,
  detectImageType,
  uploadImageBuffer,
  deleteStoredImage,
};
