const mongoose = require('mongoose');
const Product = require('../models/Product');

const ALLOWED_FIELDS = [
  'nombre',
  'descripcion',
  'precio',
  'stock',
  'imagenUrl',
  'categoria',
  'especificaciones',
  'destacado',
];

const asyncHandler = (handler) => (request, response, next) =>
  Promise.resolve(handler(request, response, next)).catch(next);

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getProducts = asyncHandler(async (request, response) => {
  const products = await Product.find().sort({ createdAt: -1 });

  response.status(200).json(products);
});

const getProductById = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!isValidObjectId(id)) {
    return response.status(400).json({
      status: 'error',
      message: 'El ID del producto no es válido.',
    });
  }

  const product = await Product.findById(id);

  if (!product) {
    return response.status(404).json({
      status: 'error',
      message: 'Producto no encontrado.',
    });
  }

  return response.status(200).json(product);
});

const createProduct = asyncHandler(async (request, response) => {
  const body = request.body ?? {};
  const {
    nombre,
    descripcion,
    precio,
    stock,
    imagenUrl,
    categoria,
    especificaciones,
    destacado,
  } = body;

  const product = await Product.create({
    nombre,
    descripcion,
    precio,
    stock,
    imagenUrl,
    categoria,
    especificaciones,
    destacado,
  });

  response.status(201).json(product);
});

const updateProduct = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!isValidObjectId(id)) {
    return response.status(400).json({
      status: 'error',
      message: 'El ID del producto no es válido.',
    });
  }

  const product = await Product.findById(id);

  if (!product) {
    return response.status(404).json({
      status: 'error',
      message: 'Producto no encontrado.',
    });
  }

  const body = request.body ?? {};

  ALLOWED_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      product[field] = body[field];
    }
  });

  const updatedProduct = await product.save();

  return response.status(200).json(updatedProduct);
});

const deleteProduct = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!isValidObjectId(id)) {
    return response.status(400).json({
      status: 'error',
      message: 'El ID del producto no es válido.',
    });
  }

  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    return response.status(404).json({
      status: 'error',
      message: 'Producto no encontrado.',
    });
  }

  return response.status(200).json({
    status: 'ok',
    message: 'Producto eliminado correctamente.',
    data: product,
  });
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
