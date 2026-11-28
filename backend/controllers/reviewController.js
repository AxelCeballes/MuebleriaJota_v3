const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

const asyncHandler = (handler) => (request, response, next) =>
  Promise.resolve(handler(request, response, next)).catch(next);

const idValido = (id) => mongoose.Types.ObjectId.isValid(id);

const getReviews = asyncHandler(async (request, response) => {
  const { productId } = request.params;
  if (!idValido(productId)) return response.status(400).json({ status: 'error', message: 'El producto indicado no es válido.' });
  const reviews = await Review.find({ producto: productId })
    .populate('usuario', 'nombre')
    .sort({ createdAt: -1 })
    .lean();
  const resumen = await Review.aggregate([
    { $match: { producto: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, promedio: { $avg: '$puntuacion' }, cantidad: { $sum: 1 } } },
  ]);
  const propia = request.user
    ? await Review.findOne({ producto: productId, usuario: request.user.id }).lean()
    : null;
  return response.json({
    data: reviews.map((review) => ({
      _id: review._id,
      puntuacion: review.puntuacion,
      comentario: review.comentario,
      nombre: review.usuario?.nombre || 'Comprador',
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      esPropia: review.usuario?._id?.toString() === request.user?.id,
    })),
    resumen: { promedio: resumen[0]?.promedio || 0, cantidad: resumen[0]?.cantidad || 0 },
    miOpinion: propia ? { puntuacion: propia.puntuacion, comentario: propia.comentario } : null,
  });
});

const guardarReview = asyncHandler(async (request, response) => {
  const { productId } = request.params;
  const { puntuacion, comentario = '' } = request.body || {};
  if (!idValido(productId)) return response.status(400).json({ status: 'error', message: 'El producto indicado no es válido.' });
  if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
    return response.status(400).json({ status: 'error', message: 'La puntuación debe ser un número entero entre 1 y 5.' });
  }
  if (typeof comentario !== 'string' || comentario.trim().length > 1000) {
    return response.status(400).json({ status: 'error', message: 'La opinión no puede superar los 1000 caracteres.' });
  }
  const product = await Product.findById(productId).select('_id');
  if (!product) return response.status(404).json({ status: 'error', message: 'No encontramos ese producto.' });

  const compra = await Order.findOne({
    usuario: request.user.id,
    estado: { $ne: 'cancelado' },
    'items.producto': product._id,
  }).select('_id');
  if (!compra) return response.status(403).json({ status: 'error', message: 'Solo pueden opinar quienes compraron este producto.' });

  await Review.findOneAndUpdate(
    { producto: product._id, usuario: request.user.id },
    { $set: { puntuacion, comentario: comentario.trim() } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  const [resumen] = await Review.aggregate([
    { $match: { producto: product._id } },
    { $group: { _id: null, promedio: { $avg: '$puntuacion' }, cantidad: { $sum: 1 } } },
  ]);
  await Product.updateOne({ _id: product._id }, {
    $set: { ratingAverage: Number((resumen?.promedio || 0).toFixed(2)), ratingCount: resumen?.cantidad || 0 },
  });
  return response.status(200).json({ status: 'ok', message: 'Tu opinión se guardó correctamente.' });
});

module.exports = { getReviews, guardarReview };
