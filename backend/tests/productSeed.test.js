const fs = require('node:fs');
const path = require('node:path');

const request = require('supertest');
const app = require('../app');
const Product = require('../models/Product');
const productosLegado = require('../data/productosLegado');
const { getImageBucket } = require('../services/imageStorage');
const { importarProductosLegado, RUTA_IMAGENES_POR_DEFECTO } = require('../services/productSeed');

const loggerSilencioso = { log: () => {}, error: () => {} };

const archivosEnBucket = () => getImageBucket().find({}).toArray();

const importar = (opciones = {}) =>
  importarProductosLegado({ logger: loggerSilencioso, ...opciones });

const productoPorNombre = async (nombre) => Product.findOne({ nombre }).lean();

describe('importación del catálogo heredado', () => {
  test('importa los 11 productos con los datos originales y sus imágenes en GridFS', async () => {
    const resultado = await importar();

    expect(resultado).toMatchObject({
      insertados: 11,
      actualizados: 0,
      omitidos: 0,
      errores: 0,
      total: 11,
    });

    const productos = await Product.find().lean();
    expect(productos).toHaveLength(productosLegado.length);

    for (const heredado of productosLegado) {
      const guardado = productos.find((producto) => producto.nombre === heredado.nombre);

      expect(guardado).toBeDefined();
      expect(guardado.descripcion).toBe(heredado.descripcion);
      expect(guardado.precio).toBe(heredado.precio);
      expect(guardado.categoria).toBe(heredado.categoria);
      expect(guardado.especificaciones).toEqual(heredado.especificaciones);
      expect(guardado.destacado).toBe(heredado.destacado);
      expect(guardado.stock).toBe(0);
      expect(guardado.imagenUrl).toMatch(/^\/api\/imagenes\/[a-f0-9]{24}$/);
    }

    const archivos = await archivosEnBucket();
    expect(archivos).toHaveLength(productosLegado.length);

    const respuesta = await request(app).get('/api/productos');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveLength(productosLegado.length);

    const aparador = await productoPorNombre('Aparador Uspallata');
    const archivoOrigen = path.join(RUTA_IMAGENES_POR_DEFECTO, 'Aparador Uspallata.png');

    const descarga = await request(app)
      .get(aparador.imagenUrl)
      .buffer(true)
      .parse((respuestaHttp, callback) => {
        const partes = [];
        respuestaHttp.on('data', (parte) => partes.push(parte));
        respuestaHttp.on('end', () => callback(null, Buffer.concat(partes)));
      });

    expect(descarga.status).toBe(200);
    expect(descarga.headers['content-type']).toBe('image/png');
    expect(descarga.body.length).toBe(fs.statSync(archivoOrigen).size);
  });

  test('es idempotente: una segunda ejecución no duplica productos ni imágenes', async () => {
    await importar();
    const imagenesPrimeraEjecucion = (await archivosEnBucket()).map((archivo) => archivo._id.toString());

    const resultado = await importar();

    expect(resultado).toMatchObject({
      insertados: 0,
      actualizados: 0,
      omitidos: 11,
      errores: 0,
      total: 11,
    });
    expect(await Product.countDocuments()).toBe(11);

    const imagenesSegundaEjecucion = (await archivosEnBucket()).map((archivo) => archivo._id.toString());
    expect(imagenesSegundaEjecucion.sort()).toEqual(imagenesPrimeraEjecucion.sort());
  });

  test('actualiza un producto existente sin duplicarlo, conserva su stock y migra su imagen', async () => {
    await Product.create({
      nombre: 'Aparador Uspallata',
      descripcion: 'Datos viejos',
      precio: 1,
      stock: 7,
      imagenUrl: '/img/Aparador Uspallata.png',
      categoria: 'Aparadores',
      especificaciones: [],
      destacado: false,
    });

    const resultado = await importar();

    expect(resultado).toMatchObject({
      insertados: 10,
      actualizados: 1,
      omitidos: 0,
      errores: 0,
      total: 11,
    });

    const actualizado = await productoPorNombre('Aparador Uspallata');
    const heredado = productosLegado.find((producto) => producto.nombre === 'Aparador Uspallata');

    expect(await Product.countDocuments({ nombre: 'Aparador Uspallata' })).toBe(1);
    expect(actualizado.descripcion).toBe(heredado.descripcion);
    expect(actualizado.precio).toBe(heredado.precio);
    expect(actualizado.especificaciones).toEqual(heredado.especificaciones);
    expect(actualizado.stock).toBe(7);
    expect(actualizado.imagenUrl).toMatch(/^\/api\/imagenes\/[a-f0-9]{24}$/);
  });

  test('permite configurar el stock inicial y aplicarlo a los productos existentes', async () => {
    await importar({ stockInicial: 5 });

    const conStockCinco = await Product.find().lean();
    expect(conStockCinco).toHaveLength(11);
    expect(conStockCinco.every((producto) => producto.stock === 5)).toBe(true);

    const conStockTres = await importar({ stockInicial: 3, aplicarStock: true });
    expect(conStockTres).toMatchObject({ insertados: 0, actualizados: 11, omitidos: 0, total: 11 });

    const conStockFinal = await Product.find().lean();
    expect(conStockFinal.every((producto) => producto.stock === 3)).toBe(true);
  });

  test('no modifica ni elimina productos ajenos a la importación', async () => {
    await Product.create({
      nombre: 'Producto propio del Sprint 8',
      descripcion: 'No forma parte del catálogo heredado.',
      precio: 123456,
      stock: 2,
      imagenUrl: '',
      categoria: 'Mesas',
      especificaciones: [{ label: 'Material', value: 'Nogal' }],
      destacado: true,
    });

    const resultado = await importar();

    expect(resultado).toMatchObject({ insertados: 11, actualizados: 0, omitidos: 0, total: 12 });

    const ajeno = await productoPorNombre('Producto propio del Sprint 8');
    expect(ajeno).toMatchObject({
      precio: 123456,
      stock: 2,
      categoria: 'Mesas',
      destacado: true,
    });
  });

  test('en modo simulación informa la importación sin escribir en MongoDB', async () => {
    const resultado = await importar({ dryRun: true });

    expect(resultado).toMatchObject({ insertados: 11, actualizados: 0, omitidos: 0, errores: 0, total: 0 });
    expect(await Product.countDocuments()).toBe(0);
    expect(await archivosEnBucket()).toHaveLength(0);
  });
});
