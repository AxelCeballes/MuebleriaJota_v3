require('dotenv').config();

const path = require('node:path');

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const productosLegado = require('../data/productosLegado');
const { importarProductosLegado, RUTA_IMAGENES_POR_DEFECTO } = require('../services/productSeed');

const AYUDA = `Uso: node scripts/migrateProductos.js [opciones]

Importa los ${productosLegado.length} productos del catálogo heredado (MuebleriaJota_v2)
a la base indicada por MONGODB_URI. Es idempotente: usa el nombre exacto del producto
como clave; si ya existe, actualiza sus datos en lugar de duplicarlo.

Opciones:
  --dry-run                 Muestra qué haría sin escribir en MongoDB.
  --stock=N                 Stock inicial para productos nuevos (entero >= 0, por defecto 0).
                            Si se indica, también actualiza el stock de los productos existentes.
  --imagenes-dir=RUTA       Carpeta con las imágenes de origen.
                            Por defecto: client/public/img.
  -h, --help                Muestra esta ayuda.

Variables de entorno:
  MONGODB_URI               Obligatoria. Debe apuntar a la base que se quiere importar.
  STOCK_INICIAL             Alternativa a --stock.

Las imágenes se suben al bucket GridFS "imagenesProductos" y se guardan como
/api/imagenes/<id>, igual que las imágenes subidas desde la administración.
No se eliminan productos, usuarios ni pedidos.`;

function leerOpciones(argv) {
  const opciones = {
    dryRun: false,
    ayuda: false,
    stock: undefined,
    imagenesDir: undefined,
  };

  const tomarValor = (argumento, indice) => {
    const valor = argv[indice];
    if (valor === undefined || valor.startsWith('--')) {
      throw new Error(`Falta el valor para ${argumento}.`);
    }
    return valor;
  };

  for (let indice = 0; indice < argv.length; indice += 1) {
    const argumento = argv[indice];

    if (argumento === '--dry-run') {
      opciones.dryRun = true;
    } else if (argumento === '-h' || argumento === '--help') {
      opciones.ayuda = true;
    } else if (argumento === '--stock') {
      opciones.stock = tomarValor(argumento, indice + 1);
      indice += 1;
    } else if (argumento.startsWith('--stock=')) {
      opciones.stock = argumento.slice('--stock='.length);
    } else if (argumento === '--imagenes-dir') {
      opciones.imagenesDir = tomarValor(argumento, indice + 1);
      indice += 1;
    } else if (argumento.startsWith('--imagenes-dir=')) {
      opciones.imagenesDir = argumento.slice('--imagenes-dir='.length);
    } else {
      throw new Error(`Opción desconocida: ${argumento}`);
    }
  }

  return opciones;
}

function resolverStock(opciones) {
  const stockEntorno = process.env.STOCK_INICIAL;
  const stockDefinido =
    opciones.stock !== undefined || (stockEntorno !== undefined && stockEntorno.trim() !== '');
  const stockInicial = Number(opciones.stock ?? stockEntorno ?? 0);

  if (!Number.isInteger(stockInicial) || stockInicial < 0) {
    throw new Error('El stock inicial debe ser un número entero mayor o igual a cero.');
  }

  return { stockInicial, aplicarStock: stockDefinido };
}

async function migrarProductos() {
  let opciones;

  try {
    opciones = leerOpciones(process.argv.slice(2));
  } catch (error) {
    console.error(`${error.message}\n`);
    console.error(AYUDA);
    process.exitCode = 1;
    return;
  }

  if (opciones.ayuda) {
    console.log(AYUDA);
    return;
  }

  let stockInicial;
  let aplicarStock;

  try {
    ({ stockInicial, aplicarStock } = resolverStock(opciones));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  const imagenesDir = opciones.imagenesDir
    ? path.resolve(opciones.imagenesDir)
    : RUTA_IMAGENES_POR_DEFECTO;

  await connectDB();

  try {
    console.log(`Destino: ${mongoose.connection.host}/${mongoose.connection.name}`);
    console.log(`Imágenes de origen: ${imagenesDir}`);
    console.log(`Productos heredados a procesar: ${productosLegado.length}`);
    console.log(`Stock inicial: ${stockInicial}${aplicarStock ? ' (se aplica también a existentes)' : ' (sólo productos nuevos)'}`);
    console.log(`Modo: ${opciones.dryRun ? 'SIMULACIÓN (no se escribe nada)' : 'ESCRITURA'}`);
    console.log('');

    const resultado = await importarProductosLegado({
      imagenesDir,
      stockInicial,
      aplicarStock,
      dryRun: opciones.dryRun,
    });

    console.log('');
    console.log('Resumen de importación:');
    console.log(`- Insertados: ${resultado.insertados}`);
    console.log(`- Actualizados: ${resultado.actualizados}`);
    console.log(`- Omitidos (sin cambios): ${resultado.omitidos}`);
    console.log(`- Errores: ${resultado.errores}`);
    console.log(`- Productos existentes en total: ${resultado.total}`);

    if (opciones.dryRun) {
      console.log('');
      console.log('Simulación completada: no se modificó la base de datos.');
    }

    if (resultado.errores > 0) {
      process.exitCode = 1;
    }
  } finally {
    await disconnectDB();
  }
}

migrarProductos().catch(async (error) => {
  console.error('La importación no pudo completarse:', error.message);

  try {
    if (mongoose.connection.readyState !== 0) {
      await disconnectDB();
    }
  } catch (disconnectError) {
    console.error('No se pudo cerrar la conexión:', disconnectError.message);
  }

  process.exitCode = 1;
});
