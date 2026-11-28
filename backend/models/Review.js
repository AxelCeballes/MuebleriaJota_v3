const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  puntuacion: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
  comentario: { type: String, trim: true, maxlength: [1000, 'La opinión no puede superar los 1000 caracteres.'], default: '' },
}, { timestamps: true, versionKey: false });

reviewSchema.index({ producto: 1, usuario: 1 }, { unique: true });
reviewSchema.index({ producto: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
