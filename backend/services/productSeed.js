const fs = require('node:fs/promises');
const path = require('node:path');

const Product = require('../models/Product');
const productosLegado = require('../data/productosLegado');
const {
  getImageBucket,
  imageIdFromUrl,
  detectImageType,
  uploadImageBuffer,
  deleteStoredImage,
} = require('./imageStorage');

// Las imágenes del catálogo heredado viven en el frontend actual. El script se
// ejecuta desde el repositorio, por lo que esta ruta es la fuente por defecto.
const RUTA_IMAGENES_POR_DEFECTO = path.resolve(__dirname, '..', '..', 'client', 'public', 'img');

const TIPOS_POR_EXTENSION = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

const normalizarEspecificaciones = (especificaciones = []) =>
  especificaciones.map(({ label, value }) => ({ label, value }));

const mismoValor = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const existeImagenAlmacenada = async (imagenUrl) => {
  const id = imageIdFromUrl(imagenUrl);
  if (!id) return false;
  const archivo = await getImageBucket().find({ _id: id }).next();
  return Boolean(archivo);
};

async function subirImagenLegado(producto, imagenesDir) {
  const archivo = path.join(imagenesDir, producto.imagenArchivo);
  const extension = path.extname(archivo).toLowerCase();
  const contentTypeEsperado = TIPOS_POR_EXTENSION[extension];

  if (!contentTypeEsperado) {
    throw new Error(`Formato de imagen no admitido: ${producto.imagenArchivo}`);
  }

  const buffer = await fs.readFile(archivo);
  const contentType = detectImageType(buffer);

  if (!contentType || contentType !== contentTypeEsperado) {
    throw new Error(`El archivo ${producto.imagenArchivo} no es una imagen ${contentTypeEsperado} válida.`);
  }

  const imageId = await uploadImageBuffer(buffer, producto.imagenArchivo, contentType);
  return `/api/imagenes/${imageId}`;
}

/**
 * Importa el catálogo heredado de forma idempotente.
 *
 * La clave estable es el nombre exacto del producto. Si ya existe:
 * - se conserva su stock (salvo que se pida aplicar uno explícito);
 * - se conserva su imagen si ya es una imagen válida de GridFS;
 * - se actualizan los datos heredados que hayan cambiado.
 *
 * @param {object} opciones
 * @param {Array} [opciones.productos] Catálogo a importar.
 * @param {string} [opciones.imagenesDir] Carpeta con las imágenes de origen.
 * @param {number} [opciones.stockInicial] Stock para productos nuevos.
 * @param {boolean} [opciones.aplicarStock] Si es true, también actualiza el stock de los existentes.
 * @param {boolean} [opciones.dryRun] Si es true, no escribe en MongoDB.
 * @param {object} [opciones.logger] Logger compatible con console.
 */
async function importarProductosLegado({
  productos = productosLegado,
  imagenesDir = RUTA_IMAGENES_POR_DEFECTO,
  stockInicial = 0,
  aplicarStock = false,
  dryRun = false,
  logger = console,
} = {}) {
  if (!Number.isInteger(stockInicial) || stockInicial < 0) {
    throw new Error('El stock inicial debe ser un número entero mayor o igual a cero.');
  }

  const resumen = {
    insertados: 0,
    actualizados: 0,
    omitidos: 0,
    errores: 0,
    total: 0,
  };

  for (const producto of productos) {
    const nombre = producto.nombre.trim();
    let imagenSubida = null;

    try {
      const existente = await Product.findOne({ nombre }).lean();
      const datos = {
        nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        categoria: producto.categoria,
        especificaciones: normalizarEspecificaciones(producto.especificaciones),
        destacado: producto.destacado,
      };

      if (!existente) {
        if (dryRun) {
          resumen.insertados += 1;
          logger.log(`INSERTARÍA: ${nombre} (stock ${stockInicial}, imagen desde ${producto.imagenArchivo})`);
          continue;
        }

        datos.imagenUrl = await subirImagenLegado(producto, imagenesDir);
        imagenSubida = datos.imagenUrl;
        datos.stock = stockInicial;

        try {
          await Product.create(datos);
        } catch (error) {
          await deleteStoredImage(imagenSubida);
          throw error;
        }

        resumen.insertados += 1;
        logger.log(`INSERTADO: ${nombre}`);
        continue;
      }

      const imagenVigente = await existeImagenAlmacenada(existente.imagenUrl);

      if (imagenVigente) {
        datos.imagenUrl = existente.imagenUrl;
      } else if (dryRun) {
        datos.imagenUrl = `${existente.imagenUrl || '(sin imagen)'} (se subiría a GridFS)`;
      } else {
        datos.imagenUrl = await subirImagenLegado(producto, imagenesDir);
        imagenSubida = datos.imagenUrl;
      }

      if (aplicarStock) {
        datos.stock = stockInicial;
      }

      const campos = Object.keys(datos);
      const sinCambios = campos.every((campo) => mismoValor(existente[campo], datos[campo]));

      if (sinCambios) {
        resumen.omitidos += 1;
        logger.log(`OMITIDO: ${nombre} (ya existe con los mismos datos)`);
        continue;
      }

      if (dryRun) {
        resumen.actualizados += 1;
        logger.log(`ACTUALIZARÍA: ${nombre} (${campos.filter((campo) => !mismoValor(existente[campo], datos[campo])).join(', ')})`);
        continue;
      }

      try {
        await Product.updateOne({ _id: existente._id }, { $set: datos });
      } catch (error) {
        if (imagenSubida) await deleteStoredImage(imagenSubida);
        throw error;
      }

      resumen.actualizados += 1;
      logger.log(`ACTUALIZADO: ${nombre}`);
    } catch (error) {
      resumen.errores += 1;
      logger.error(`ERROR: ${nombre}: ${error.message}`);
    }
  }

  resumen.total = await Product.countDocuments();
  return resumen;
}

module.exports = {
  RUTA_IMAGENES_POR_DEFECTO,
  importarProductosLegado,
};
