const mongoose = require('mongoose');

const especificacionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'La etiqueta de la especificación es obligatoria.'],
      trim: true,
    },
    value: {
      type: String,
      required: [true, 'El valor de la especificación es obligatorio.'],
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const productSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio.'],
      trim: true,
      minlength: [1, 'El nombre no puede estar vacío.'],
    },
    descripcion: {
      type: String,
      default: '',
      trim: true,
    },
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio.'],
      min: [0, 'El precio debe ser mayor o igual a cero.'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'El stock debe ser mayor o igual a cero.'],
      validate: {
        validator: Number.isInteger,
        message: 'El stock debe ser un número entero.',
      },
    },
    imagenUrl: {
      type: String,
      default: '',
      trim: true,
    },
    categoria: {
      type: String,
      trim: true,
    },
    especificaciones: {
      type: [especificacionSchema],
      default: undefined,
    },
    destacado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model('Product', productSchema);
