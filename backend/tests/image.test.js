const request = require('supertest');
const app = require('../app');
const { getImageBucket } = require('../services/imageStorage');
const { crearUsuarioConToken } = require('./helpers/auth');

// Firma PNG válida; el controlador valida la cabecera del archivo.
const PNG_VALIDO = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const archivosEnBucket = async () => getImageBucket().find({}).toArray();

const subirImagen = ({
  authorization,
  buffer = PNG_VALIDO,
  filename = 'prueba.png',
  contentType = 'image/png',
} = {}) => {
  const peticion = request(app)
    .post('/api/imagenes')
    .attach('imagen', buffer, { filename, contentType });

  return authorization ? peticion.set('Authorization', authorization) : peticion;
};

describe('POST /api/imagenes', () => {
  test('devuelve 401 sin token y no guarda el archivo', async () => {
    const respuesta = await subirImagen();

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.message).toBe('Necesitás iniciar sesión para continuar.');
    expect(await archivosEnBucket()).toHaveLength(0);
  });

  test('devuelve 403 para un usuario customer y no guarda el archivo', async () => {
    const { authorization } = await crearUsuarioConToken({ rol: 'customer' });

    const respuesta = await subirImagen({ authorization });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toBe('No tenés permisos para realizar esta acción.');
    expect(await archivosEnBucket()).toHaveLength(0);
  });

  test('un admin puede subir una imagen PNG y recuperarla públicamente', async () => {
    const { authorization } = await crearUsuarioConToken({ rol: 'admin' });

    const respuesta = await subirImagen({ authorization });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.imagenUrl).toMatch(/^\/api\/imagenes\/[a-f0-9]{24}$/);

    const archivos = await archivosEnBucket();
    expect(archivos).toHaveLength(1);

    const descarga = await request(app)
      .get(respuesta.body.imagenUrl)
      .buffer(true)
      .parse((respuestaHttp, callback) => {
        const partes = [];
        respuestaHttp.on('data', (parte) => partes.push(parte));
        respuestaHttp.on('end', () => callback(null, Buffer.concat(partes)));
      });

    expect(descarga.status).toBe(200);
    expect(descarga.headers['content-type']).toBe('image/png');
    expect(descarga.body).toEqual(PNG_VALIDO);
  });

  test('devuelve 400 si un admin no adjunta archivo', async () => {
    const { authorization } = await crearUsuarioConToken({ rol: 'admin' });

    const respuesta = await request(app)
      .post('/api/imagenes')
      .set('Authorization', authorization);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toBe('Seleccioná una imagen para subir.');
  });

  test('devuelve 415 si el tipo de archivo no está permitido', async () => {
    const { authorization } = await crearUsuarioConToken({ rol: 'admin' });

    const respuesta = await subirImagen({
      authorization,
      buffer: Buffer.from('no soy una imagen'),
      filename: 'nota.txt',
      contentType: 'text/plain',
    });

    expect(respuesta.status).toBe(415);
    expect(respuesta.body.message).toBe('Formato de imagen no admitido. Usá JPG, PNG o WebP.');
  });

  test('devuelve 415 si el contenido no coincide con el tipo declarado', async () => {
    const { authorization } = await crearUsuarioConToken({ rol: 'admin' });

    const respuesta = await subirImagen({
      authorization,
      buffer: Buffer.from('contenido falso'),
      filename: 'falsa.png',
      contentType: 'image/png',
    });

    expect(respuesta.status).toBe(415);
    expect(respuesta.body.message).toBe('El archivo no es una imagen JPG, PNG o WebP válida.');
    expect(await archivosEnBucket()).toHaveLength(0);
  });
});

describe('GET /api/imagenes/:id', () => {
  test('devuelve 400 para un ID inválido', async () => {
    const respuesta = await request(app).get('/api/imagenes/id-invalido');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toBe('El ID de imagen no es válido.');
  });

  test('devuelve 404 para un ID válido inexistente', async () => {
    const respuesta = await request(app).get('/api/imagenes/507f1f77bcf86cd799439011');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.message).toBe('Imagen no encontrada.');
  });
});
