const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const Product = require('../models/Product');

const productoValido = {
  nombre: 'Sillón de prueba',
  descripcion: 'Producto creado en la base de datos temporal.',
  precio: 150000,
  stock: 4,
  imagenUrl: '',
  categoria: 'Sillones',
  especificaciones: [{ label: 'Material', value: 'Roble' }],
  destacado: true,
};

const crearProducto = (overrides = {}) =>
  Product.create({ ...productoValido, ...overrides });

const idInexistente = () => new mongoose.Types.ObjectId().toString();

describe('GET /api/productos', () => {
  test('devuelve 200, un array y los productos de la base de prueba', async () => {
    const [primerProducto, segundoProducto] = await Product.create([
      productoValido,
      { ...productoValido, nombre: 'Mesa de prueba', categoria: 'Mesas' },
    ]);

    const respuesta = await request(app).get('/api/productos');

    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body)).toBe(true);
    expect(respuesta.body).toHaveLength(2);
    expect(respuesta.body.map((producto) => producto._id)).toEqual(
      expect.arrayContaining([
        primerProducto._id.toString(),
        segundoProducto._id.toString(),
      ]),
    );
  });
});

describe('GET /api/productos/:id', () => {
  test('devuelve 200 para un ID existente', async () => {
    const producto = await crearProducto();

    const respuesta = await request(app).get(`/api/productos/${producto._id}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      _id: producto._id.toString(),
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.stock,
    });
  });

  test('devuelve 404 para un ID válido inexistente', async () => {
    const respuesta = await request(app).get(`/api/productos/${idInexistente()}`);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toEqual({
      status: 'error',
      message: 'Producto no encontrado.',
    });
  });

  test('devuelve 400 para un ID inválido', async () => {
    const respuesta = await request(app).get('/api/productos/id-invalido');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toEqual({
      status: 'error',
      message: 'El ID del producto no es válido.',
    });
  });
});

describe('POST /api/productos', () => {
  test('crea un producto válido, devuelve 201 y lo persiste', async () => {
    const respuesta = await request(app)
      .post('/api/productos')
      .send(productoValido);

    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toMatchObject({
      nombre: productoValido.nombre,
      descripcion: productoValido.descripcion,
      precio: productoValido.precio,
      stock: productoValido.stock,
      categoria: productoValido.categoria,
      destacado: productoValido.destacado,
    });
    expect(respuesta.body._id).toEqual(expect.any(String));

    const productoPersistido = await Product.findById(respuesta.body._id).lean();

    expect(productoPersistido).not.toBeNull();
    expect(productoPersistido.nombre).toBe(productoValido.nombre);
    expect(productoPersistido.precio).toBe(productoValido.precio);
    expect(productoPersistido.stock).toBe(productoValido.stock);
    expect(productoPersistido.especificaciones).toEqual(productoValido.especificaciones);
  });

  test('rechaza campos obligatorios ausentes con 400', async () => {
    const respuesta = await request(app)
      .post('/api/productos')
      .send({ descripcion: 'Sin nombre ni precio', stock: 1 });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.status).toBe('error');
    expect(respuesta.body.message).toBe('Los datos del producto no son válidos.');
    expect(respuesta.body.errors).toEqual(
      expect.arrayContaining([
        'El nombre es obligatorio.',
        'El precio es obligatorio.',
      ]),
    );
  });

  test('rechaza un precio negativo con 400', async () => {
    const respuesta = await request(app)
      .post('/api/productos')
      .send({ ...productoValido, precio: -1 });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.status).toBe('error');
    expect(respuesta.body.message).toBe('Los datos del producto no son válidos.');
    expect(respuesta.body.errors).toContain('El precio debe ser mayor o igual a cero.');
  });

  test('rechaza un stock negativo con 400', async () => {
    const respuesta = await request(app)
      .post('/api/productos')
      .send({ ...productoValido, stock: -1 });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.status).toBe('error');
    expect(respuesta.body.message).toBe('Los datos del producto no son válidos.');
    expect(respuesta.body.errors).toContain('El stock debe ser mayor o igual a cero.');
  });

  test('rechaza un stock no entero con 400', async () => {
    const respuesta = await request(app)
      .post('/api/productos')
      .send({ ...productoValido, stock: 1.5 });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.status).toBe('error');
    expect(respuesta.body.message).toBe('Los datos del producto no son válidos.');
    expect(respuesta.body.errors).toContain('El stock debe ser un número entero.');
  });
});

describe('PUT /api/productos/:id', () => {
  test('actualiza un producto existente y persiste los cambios', async () => {
    const producto = await crearProducto();
    const cambios = {
      nombre: 'Sillón actualizado',
      descripcion: 'Descripción actualizada.',
      precio: 175000,
      stock: 2,
      categoria: 'Sillones',
      destacado: false,
    };

    const respuesta = await request(app)
      .put(`/api/productos/${producto._id}`)
      .send(cambios);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject(cambios);

    const productoPersistido = await Product.findById(producto._id).lean();

    expect(productoPersistido).toMatchObject(cambios);
    expect(productoPersistido.imagenUrl).toBe(producto.imagenUrl);
    expect(productoPersistido.especificaciones).toEqual(
      producto.especificaciones.map(({ label, value }) => ({ label, value })),
    );
  });

  test('devuelve 404 para un producto inexistente', async () => {
    const respuesta = await request(app)
      .put(`/api/productos/${idInexistente()}`)
      .send({ nombre: 'Producto inexistente' });

    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toEqual({
      status: 'error',
      message: 'Producto no encontrado.',
    });
  });

  test('devuelve 400 para un ID inválido', async () => {
    const respuesta = await request(app)
      .put('/api/productos/id-invalido')
      .send({ nombre: 'Producto inválido' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toEqual({
      status: 'error',
      message: 'El ID del producto no es válido.',
    });
  });

  test.each([
    ['precio negativo', { precio: -10 }, 'El precio debe ser mayor o igual a cero.'],
    ['stock negativo', { stock: -2 }, 'El stock debe ser mayor o igual a cero.'],
    ['stock no entero', { stock: 1.5 }, 'El stock debe ser un número entero.'],
  ])('rechaza %s al actualizar con 400', async (_caso, cambios, mensaje) => {
    const producto = await crearProducto();

    const respuesta = await request(app)
      .put(`/api/productos/${producto._id}`)
      .send(cambios);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.status).toBe('error');
    expect(respuesta.body.message).toBe('Los datos del producto no son válidos.');
    expect(respuesta.body.errors).toContain(mensaje);

    const productoPersistido = await Product.findById(producto._id).lean();

    expect(productoPersistido.precio).toBe(producto.precio);
    expect(productoPersistido.stock).toBe(producto.stock);
  });
});

describe('DELETE /api/productos/:id', () => {
  test('elimina un producto existente y confirma que ya no existe', async () => {
    const producto = await crearProducto();

    const respuesta = await request(app).delete(`/api/productos/${producto._id}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      status: 'ok',
      message: 'Producto eliminado correctamente.',
    });
    expect(respuesta.body.data._id).toBe(producto._id.toString());

    const productoPersistido = await Product.findById(producto._id).lean();
    expect(productoPersistido).toBeNull();

    const respuestaGet = await request(app).get(`/api/productos/${producto._id}`);
    expect(respuestaGet.status).toBe(404);
  });

  test('devuelve 404 cuando el producto no existe', async () => {
    const respuesta = await request(app).delete(`/api/productos/${idInexistente()}`);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toEqual({
      status: 'error',
      message: 'Producto no encontrado.',
    });
  });

  test('devuelve 400 para un ID inválido', async () => {
    const respuesta = await request(app).delete('/api/productos/id-invalido');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toEqual({
      status: 'error',
      message: 'El ID del producto no es válido.',
    });
  });
});
