const mongoose = require('mongoose');

const ROLES = ['customer', 'admin'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio.'],
      trim: true,
      minlength: [1, 'El nombre no puede estar vacío.'],
      maxlength: [80, 'El nombre no puede superar los 80 caracteres.'],
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio.'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      match: [EMAIL_REGEX, 'El email no tiene un formato válido.'],
    },
    passwordHash: {
      type: String,
      required: [true, 'La contraseña es obligatoria.'],
      select: false,
    },
    rol: {
      type: String,
      enum: {
        values: ROLES,
        message: 'El rol debe ser customer o admin.',
      },
      default: 'customer',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model('User', userSchema);
