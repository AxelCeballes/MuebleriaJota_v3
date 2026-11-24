const mongoose = require('mongoose');

const itemPedidoSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'El producto del ítem es obligatorio.'],
    },
    nombre: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio.'],
      trim: true,
    },
    precioUnitario: {
      type: Number,
      required: [true, 'El precio unitario es obligatorio.'],
      min: [0, 'El precio unitario debe ser mayor o igual a cero.'],
    },
    cantidad: {
      type: Number,
      required: [true, 'La cantidad es obligatoria.'],
      min: [1, 'La cantidad debe ser mayor o igual a uno.'],
      validate: {
        validator: Number.isInteger,
        message: 'La cantidad debe ser un número entero.',
      },
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario del pedido es obligatorio.'],
      index: true,
    },
    items: {
      type: [itemPedidoSchema],
      required: [true, 'El pedido debe incluir al menos un producto.'],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'El pedido debe incluir al menos un producto.',
      },
    },
    total: {
      type: Number,
      required: [true, 'El total es obligatorio.'],
      min: [0, 'El total debe ser mayor o igual a cero.'],
    },
    estado: {
      type: String,
      enum: {
        values: ['pendiente', 'confirmado', 'cancelado'],
        message: 'El estado del pedido no es válido.',
      },
      default: 'pendiente',
    },
    idempotencyKey: {
      type: String,
      trim: true,
      maxlength: [128, 'La clave de idempotencia no puede superar los 128 caracteres.'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Evita duplicados por reintentos del mismo usuario con la misma clave.
orderSchema.index(
  { usuario: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string' } },
  },
);

// Acelera el historial "mis pedidos" ordenado por fecha.
orderSchema.index({ usuario: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
