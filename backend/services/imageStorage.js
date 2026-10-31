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

async function deleteStoredImage(imageUrl) {
  const id = imageIdFromUrl(imageUrl);
  if (!id) return;
  try {
    await getImageBucket().delete(id);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

module.exports = { getImageBucket, imageIdFromUrl, deleteStoredImage };
