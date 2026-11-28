const request = require('supertest');
const app = require('../app');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { crearUsuarioConToken } = require('./helpers/auth');

const productoBase = { nombre: 'Mesa reseñable', precio: 10000, stock: 5, categoria: 'Mesas' };

 describe('API de opiniones', () => {
  test('permite opinar a un comprador y actualiza el promedio del producto', async () => {
    const { usuario, authorization } = await crearUsuarioConToken({ rol: 'customer' });
    const producto = await Product.create(productoBase);
    await Order.create({
      usuario: usuario._id,
      items: [{ producto: producto._id, nombre: producto.nombre, precioUnitario: producto.precio, cantidad: 1 }],
      total: producto.precio,
      estado: 'confirmado',
    });

    const respuesta = await request(app)
      .post(`/api/resenas/${producto._id}`)
      .set('Authorization', authorization)
      .send({ puntuacion: 5, comentario: 'Muy buena calidad.' });

    expect(respuesta.status).toBe(200);
    expect(await Review.countDocuments({ producto: producto._id, usuario: usuario._id })).toBe(1);
    const actualizado = await Product.findById(producto._id);
    expect(actualizado.ratingAverage).toBe(5);
    expect(actualizado.ratingCount).toBe(1);
  });

  test('rechaza opiniones de usuarios que no compraron el producto', async () => {
    const { authorization } = await crearUsuarioConToken({ rol: 'customer' });
    const producto = await Product.create(productoBase);
    const respuesta = await request(app)
      .post(`/api/resenas/${producto._id}`)
      .set('Authorization', authorization)
      .send({ puntuacion: 4, comentario: 'Todavía no lo compré.' });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toMatch(/compraron/i);
  });

  test('devuelve las opiniones y el resumen de forma pública', async () => {
    const { usuario } = await crearUsuarioConToken({ rol: 'customer' });
    const producto = await Product.create(productoBase);
    await Review.create({ producto: producto._id, usuario: usuario._id, puntuacion: 4, comentario: 'Muy lindo.' });

    const respuesta = await request(app).get(`/api/resenas/${producto._id}`);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.resumen).toEqual({ promedio: 4, cantidad: 1 });
    expect(respuesta.body.data[0]).toMatchObject({ puntuacion: 4, comentario: 'Muy lindo.' });
  });
});
