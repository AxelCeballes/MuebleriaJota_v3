require('dotenv').config();

const { connectDB, disconnectDB } = require('../config/db');
const Product = require('../models/Product');

const productosOriginales = [
  {
    nombre: 'Aparador Uspallata',
    descripcion:
      'Aparador bajo de líneas rectas en roble macizo con puertas abatibles y patas cónicas de madera torneada. Su interior cuenta con estantes regulables, ideal para living o comedor, combinando guardado funcional con una estética cálida y atemporal.',
    precio: 620000,
    stock: 0,
    imagenUrl: '/img/Aparador Uspallata.png',
    categoria: 'Aparadores',
    especificaciones: [
      { label: 'Medidas', value: '160 × 45 × 75 cm' },
      { label: 'Materiales', value: 'Roble macizo FSC®, herrajes soft-close' },
      { label: 'Acabado', value: 'Aceite natural mate' },
      { label: 'Almacenamiento', value: '2 puertas + estantes regulables' },
      { label: 'Interior', value: '3 compartimentos internos' },
    ],
    destacado: false,
  },
  {
    nombre: 'Biblioteca Recoleta',
    descripcion:
      'Biblioteca modular de piso a techo en madera de pino reforestado, con estantes ajustables y estructura autoportante. Su diseño esbelto aprovecha el espacio vertical, ideal para living o estudio, ofreciendo capacidad de guardado sin sobrecargar el ambiente.',
    precio: 410000,
    stock: 0,
    imagenUrl: '/img/Biblioteca Recoleta.png',
    categoria: 'Bibliotecas',
    especificaciones: [
      { label: 'Medidas', value: '90 × 30 × 200 cm' },
      { label: 'Materiales', value: 'Pino reforestado FSC®, refuerzos metálicos' },
      { label: 'Acabado', value: 'Barniz satinado' },
      { label: 'Estantes', value: '5 niveles ajustables' },
      { label: 'Capacidad', value: 'Hasta 15 kg por estante' },
    ],
    destacado: false,
  },
  {
    nombre: 'Butaca Mendoza',
    descripcion:
      'Butaca individual tapizada en pana color terracota, con estructura de madera de haya y patas cónicas. Su tamaño compacto y silueta redondeada la convierten en una pieza versátil para living, dormitorio o rincones de lectura.',
    precio: 380000,
    stock: 0,
    imagenUrl: '/img/Butaca Mendoza.png',
    categoria: 'Sillones',
    especificaciones: [
      { label: 'Medidas', value: '75 × 80 × 85 cm' },
      { label: 'Estructura', value: 'Madera de haya maciza' },
      { label: 'Tapizado', value: 'Pana 100% algodón' },
      { label: 'Relleno', value: 'Espuma de alta densidad' },
      { label: 'Sostenibilidad', value: 'Tapizado de origen certificado' },
    ],
    destacado: true,
  },
  {
    nombre: 'Sillón Copacabana',
    descripcion:
      'Sillón de dos cuerpos tapizado en bouclé color crudo, con base de madera curva y patas doradas. Su perfil curvo y mullido aporta calidez y un toque escultórico a cualquier living, combinando confort y diseño contemporáneo.',
    precio: 650000,
    stock: 0,
    imagenUrl: '/img/Sillón Copacabana.png',
    categoria: 'Sillones',
    especificaciones: [
      { label: 'Medidas', value: '160 × 85 × 78 cm' },
      { label: 'Estructura', value: 'Madera curvada de haya' },
      { label: 'Tapizado', value: 'Bouclé premium' },
      { label: 'Relleno', value: 'Espuma HR + fibra siliconada' },
      { label: 'Terminación', value: 'Patas metálicas doradas' },
    ],
    destacado: false,
  },
  {
    nombre: 'Mesa de Centro Araucaria',
    descripcion:
      'Mesa de centro con tablero circular en madera de araucaria y base trípode de metal negro. Su silueta liviana y natural se adapta a distintos estilos de living, funcionando como punto focal cálido frente al sofá.',
    precio: 290000,
    stock: 0,
    imagenUrl: '/img/Mesa de Centro Araucaria.png',
    categoria: 'Mesas',
    especificaciones: [
      { label: 'Medidas', value: '80 × 80 × 40 cm' },
      { label: 'Materiales', value: 'Madera de araucaria maciza, base de acero' },
      { label: 'Acabado', value: 'Aceite natural' },
      { label: 'Forma', value: 'Tablero circular' },
      { label: 'Estilo', value: 'Base trípode' },
    ],
    destacado: false,
  },
  {
    nombre: 'Mesa de Noche Aconcagua',
    descripcion:
      'Mesa de noche con cajón oculto y repisa inferior en roble certificado FSC®. Su diseño limpio y funcional permite convivir con diferentes estilos de dormitorio, ofreciendo almacenamiento discreto y elegante para objetos personales.',
    precio: 210000,
    stock: 0,
    imagenUrl: '/img/Mesa de Noche Aconcagua.png',
    categoria: 'Mesas',
    especificaciones: [
      { label: 'Medidas', value: '45 × 35 × 60 cm' },
      { label: 'Materiales', value: 'Roble macizo FSC®, herrajes soft-close' },
      { label: 'Acabado', value: 'Barniz mate de poliuretano' },
      { label: 'Almacenamiento', value: '1 cajón + repisa inferior' },
      { label: 'Características', value: 'Cajón con cierre suave' },
    ],
    destacado: false,
  },
  {
    nombre: 'Sofá Patagonia',
    descripcion:
      'Sofá de tres cuerpos tapizado en lino Warm Alabaster con patas cónicas de madera. Los cojines combinan espuma de alta resiliencia con plumón reciclado, ofreciendo comodidad duradera y sostenible para el hogar moderno.',
    precio: 890000,
    stock: 0,
    imagenUrl: '/img/Sofá Patagonia.png',
    categoria: 'Sillones',
    especificaciones: [
      { label: 'Medidas', value: '220 × 90 × 80 cm' },
      { label: 'Estructura', value: 'Madera de eucalipto certificada FSC®' },
      { label: 'Tapizado', value: 'Lino 100% natural premium' },
      { label: 'Relleno', value: 'Espuma HR + plumón reciclado' },
      { label: 'Sostenibilidad', value: 'Materiales 100% reciclables' },
    ],
    destacado: true,
  },
  {
    nombre: 'Mesa Comedor Pampa',
    descripcion:
      'Mesa extensible de roble macizo con tablero biselado y sistema de apertura suave. Su diseño robusto y elegante se adapta perfectamente a reuniones íntimas o grandes celebraciones familiares, extendiéndose de 6 a 10 comensales.',
    precio: 780000,
    stock: 0,
    imagenUrl: '/img/Mesa Comedor Pampa.png',
    categoria: 'Mesas',
    especificaciones: [
      { label: 'Medidas', value: '160-240 × 90 × 75 cm' },
      { label: 'Materiales', value: 'Roble macizo FSC®, mecanismo alemán' },
      { label: 'Acabado', value: 'Aceite-cera natural' },
      { label: 'Capacidad', value: '6-10 comensales' },
      { label: 'Extensión', value: 'Sistema de mariposa central' },
    ],
    destacado: true,
  },
  {
    nombre: 'Sillas Córdoba',
    descripcion:
      'Set de cuatro sillas apilables en contrachapado moldeado de nogal y estructura tubular pintada en Sage Green. Su diseño ergonómico y materiales de calidad garantizan comodidad y durabilidad en el uso diario, perfectas para comedores contemporáneos.',
    precio: 320000,
    stock: 0,
    imagenUrl: '/img/Sillas Córdoba.png',
    categoria: 'Sillas',
    especificaciones: [
      { label: 'Medidas', value: '45 × 52 × 80 cm (cada una)' },
      { label: 'Materiales', value: 'Contrachapado nogal, tubo de acero' },
      { label: 'Acabado', value: 'Laca mate, pintura epoxi' },
      { label: 'Apilables', value: 'Hasta 6 sillas' },
      { label: 'Incluye', value: 'Set de 4 sillas' },
    ],
    destacado: false,
  },
  {
    nombre: 'Escritorio Costa',
    descripcion:
      'Escritorio compacto con cajón organizado y tapa pasacables integrada en bambú laminado. Ideal para espacios de trabajo en casa, combina funcionalidad moderna con estética minimalista y sostenible, perfecto para el trabajo remoto.',
    precio: 340000,
    stock: 0,
    imagenUrl: '/img/Escritorio Costa.png',
    categoria: 'Escritorios',
    especificaciones: [
      { label: 'Medidas', value: '120 × 60 × 75 cm' },
      { label: 'Materiales', value: 'Bambú laminado, herrajes ocultos' },
      { label: 'Acabado', value: 'Laca mate resistente' },
      { label: 'Almacenamiento', value: '1 cajón con organizador' },
      { label: 'Cables', value: 'Pasacables integrado' },
    ],
    destacado: true,
  },
  {
    nombre: 'Silla de Trabajo Belgrano',
    descripcion:
      'Silla ergonómica regulable en altura con respaldo de malla transpirable y asiento tapizado en tejido reciclado. Diseñada para largas jornadas de trabajo con máximo confort y apoyo lumbar, ideal para oficinas en casa y espacios de coworking.',
    precio: 275000,
    stock: 0,
    imagenUrl: '/img/Silla de Trabajo Belgrano.png',
    categoria: 'Sillas',
    especificaciones: [
      { label: 'Medidas', value: '60 × 60 × 90-100 cm' },
      { label: 'Materiales', value: 'Malla técnica, tejido reciclado' },
      { label: 'Acabado', value: 'Base cromada, tapizado premium' },
      { label: 'Regulación', value: 'Altura + inclinación respaldo' },
      { label: 'Certificación', value: 'Ergonomía europea EN 1335' },
    ],
    destacado: false,
  },
];

const normalizarNombre = (nombre = '') =>
  nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

async function migrarProductos() {
  const resumen = {
    insertados: 0,
    omitidos: 0,
    errores: 0,
  };

  await connectDB();

  try {
    const productosExistentes = await Product.find({}, { nombre: 1 }).lean();
    const nombresExistentes = new Set(
      productosExistentes.map((producto) => normalizarNombre(producto.nombre)),
    );

    console.log(`Productos existentes antes de la migración: ${productosExistentes.length}`);
    console.log(`Productos originales a migrar: ${productosOriginales.length}`);

    for (const producto of productosOriginales) {
      const nombreNormalizado = normalizarNombre(producto.nombre);

      if (nombresExistentes.has(nombreNormalizado)) {
        resumen.omitidos += 1;
        console.log(`OMITIDO: ${producto.nombre} (ya existe un producto con ese nombre)`);
        continue;
      }

      try {
        await Product.create(producto);
        nombresExistentes.add(nombreNormalizado);
        resumen.insertados += 1;
        console.log(`INSERTADO: ${producto.nombre}`);
      } catch (error) {
        resumen.errores += 1;
        console.error(`ERROR: ${producto.nombre}: ${error.message}`);
      }
    }
  } finally {
    console.log('');
    console.log('Resumen de migración:');
    console.log(`- Insertados: ${resumen.insertados}`);
    console.log(`- Omitidos: ${resumen.omitidos}`);
    console.log(`- Errores: ${resumen.errores}`);

    await disconnectDB();
  }

  if (resumen.errores > 0) {
    process.exitCode = 1;
  }
}

migrarProductos().catch(async (error) => {
  console.error('La migración no pudo completarse:', error.message);

  try {
    await disconnectDB();
  } catch (disconnectError) {
    console.error('No se pudo cerrar la conexión:', disconnectError.message);
  }

  process.exitCode = 1;
});
