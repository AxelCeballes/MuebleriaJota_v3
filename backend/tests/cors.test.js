const request = require('supertest');
const app = require('../app');

const ORIGEN_LOCAL = 'http://localhost:5173';
const ORIGEN_AJENO = 'https://sitio-no-autorizado.example';

const headersPermitidos = (respuesta) =>
  (respuesta.headers['access-control-allow-headers'] || '')
    .split(',')
    .map((header) => header.trim().toLowerCase())
    .filter(Boolean);

describe('CORS', () => {
  const entornoOriginal = {
    NODE_ENV: process.env.NODE_ENV,
    CORS_ORIGINS: process.env.CORS_ORIGINS,
  };

  afterEach(() => {
    process.env.NODE_ENV = entornoOriginal.NODE_ENV;
    if (entornoOriginal.CORS_ORIGINS === undefined) {
      delete process.env.CORS_ORIGINS;
    } else {
      process.env.CORS_ORIGINS = entornoOriginal.CORS_ORIGINS;
    }
  });

  test('el preflight permite Content-Type, Authorization e Idempotency-Key', async () => {
    const respuesta = await request(app)
      .options('/api/pedidos')
      .set('Origin', ORIGEN_LOCAL)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type, authorization, idempotency-key');

    expect(respuesta.status).toBe(204);
    expect(respuesta.headers['access-control-allow-origin']).toBe(ORIGEN_LOCAL);
    expect(respuesta.headers['access-control-allow-methods']).toContain('POST');
    expect(headersPermitidos(respuesta)).toEqual(
      expect.arrayContaining(['content-type', 'authorization', 'idempotency-key']),
    );
  });

  test('el preflight desde un origen no permitido no devuelve cabeceras CORS', async () => {
    const respuesta = await request(app)
      .options('/api/pedidos')
      .set('Origin', ORIGEN_AJENO)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization, idempotency-key');

    expect(respuesta.headers['access-control-allow-origin']).toBeUndefined();
    expect(respuesta.headers['access-control-allow-headers']).toBeUndefined();
  });

  test('en producción sólo permite los orígenes configurados en CORS_ORIGINS', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGINS = 'https://app.example.com, https://admin.example.com';

    const permitido = await request(app)
      .get('/api/productos')
      .set('Origin', 'https://app.example.com');

    expect(permitido.status).toBe(200);
    expect(permitido.headers['access-control-allow-origin']).toBe('https://app.example.com');

    const preflightPermitido = await request(app)
      .options('/api/pedidos')
      .set('Origin', 'https://admin.example.com')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization, idempotency-key');

    expect(preflightPermitido.headers['access-control-allow-origin']).toBe('https://admin.example.com');

    const ajeno = await request(app)
      .get('/api/productos')
      .set('Origin', 'https://otro.example.com');

    expect(ajeno.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('en producción sin CORS_ORIGINS no se permite ningún origen', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CORS_ORIGINS;

    const respuesta = await request(app)
      .get('/api/productos')
      .set('Origin', 'https://app.example.com');

    expect(respuesta.headers['access-control-allow-origin']).toBeUndefined();
  });
});
