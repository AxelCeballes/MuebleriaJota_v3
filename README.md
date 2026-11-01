<div align="center">

# 🪵 Hermanos Jota

### E-commerce de muebles artesanales con identidad argentina

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?logo=reactrouter&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)

Proyecto académico — Sprint 6

**[Ver sitio web](https://muebleria-jota-v3.vercel.app/)**

</div>

---

## 📖 Descripción

**Hermanos Jota** es una aplicación web cliente-servidor para una mueblería de diseño con identidad argentina. El frontend, desarrollado con **React y Vite**, consume una **API REST** construida con **Node.js y Express**. Los productos se guardan en **MongoDB** mediante Mongoose, y las imágenes subidas desde la administración se almacenan en GridFS (`imagenesProductos`). Las rutas de escritura de la API no requieren inicio de sesión.

---

## 👥 Integrantes

| Nombre | GitHub |
|---|---|
| Lian Rivera | [kyan16](https://github.com/kyan16) |
| Axel Ceballes | [AxelCeballes](https://github.com/AxelCeballes) |
| Francisco Ramirez | [FranR27](https://github.com/FranR27) |
| Tomás Fioravanti | [Tomas-ui](https://github.com/Tomas-ui) |
| Tomás Gonzales | [tsgexe](https://github.com/tsgexe) |

---

## ✨ Funcionalidades

- 🏠 **Portada** con hero y piezas destacadas
- 🛋️ **Catálogo** con búsqueda de productos
- 🔍 **Detalle del producto** con imagen, precio, descripción y especificaciones
- 🛒 **Carrito** con cantidades, subtotales, total y persistencia en `localStorage`
- ✉️ **Contacto** con formulario
- 🔄 Estados de carga y error al consultar la API, con opción para reintentar
- 🧰 Sección de administración para gestionar productos
- ➕ Crear productos, ✏️ editarlos y 🗑️ eliminarlos
- 🖼️ Subir imágenes desde el dispositivo y guardarlas en MongoDB GridFS

> El carrito es demostrativo: no procesa pagos ni registra pedidos.

---

## 🛠️ Tecnologías

| Capa | Tecnologías |
|---|---|
| Frontend | React 19, React Router DOM, Vite, CSS |
| Backend | Node.js, Express 5 |
| Persistencia | MongoDB, Mongoose y GridFS |
| Despliegue | Vercel (frontend) · Render (API) |
| Tipografías | Playfair Display e Inter |

---

## 🚀 Instalación y ejecución

### Requisitos previos

- **Node.js y npm**
- Variables de entorno del backend (ver sección Variables de entorno)
- Los puertos **3000** (API) y **5173** (cliente) disponibles, salvo que se configuren otros

### Pasos

Hacen falta **dos terminales abiertas al mismo tiempo**.

**Terminal 1 — API** (`http://localhost:3000`):

```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — Cliente** (`http://localhost:5173`):

```bash
cd client
npm install
npm run dev
```

Vite reenvía las solicitudes `/api` al backend local. Para apuntar a otra API, configurar `VITE_API_BASE` en el entorno del cliente.

### Scripts disponibles

| Carpeta | Comando | Qué hace |
|---|---|---|
| `backend` | `npm install` | Instala dependencias del backend |
| `backend` | `npm start` | Inicia la API en producción |
| `backend` | `npm run dev` | Inicia la API en modo desarrollo (con reinicio automático `--watch`) |
| `backend` | `npm test` | Ejecuta los tests del backend con Jest y MongoDB Memory Server |
| `backend` | `npm run test:watch` | Ejecuta los tests del backend en modo interactivo |
| `client` | `npm install` | Instala dependencias del cliente |
| `client` | `npm run dev` | Inicia Vite en modo desarrollo |
| `client` | `npm run lint` | Analiza el código del cliente con oxlint |
| `client` | `npm run build` | Genera la versión de producción en `dist` |
| `client` | `npm run preview` | Previsualiza localmente el build de producción |
| `client` | `npm test` | Ejecuta los tests del cliente con Vitest |
| `client` | `npm run test:watch` | Ejecuta los tests del cliente en modo interactivo |

---

## 🧪 Testing

### Backend

Los tests del backend están implementados con **Jest**, **Supertest** y **mongodb-memory-server** (base de datos temporal en memoria para aislar las pruebas de la base real).

Para ejecutarlos:

```bash
cd backend
npm test
```

Para el modo interactivo:

```bash
cd backend
npm run test:watch
```

**Resultado de ejecución**:
- **1 suite aprobada**, **18 tests exitosos** de 18 totales en `backend/tests/product.test.js`.
- **Cobertura**: operaciones CRUD completas en `/api/productos` (GET, POST, PUT, DELETE), validación de campos obligatorios, IDs con formato no válido, productos inexistentes (404), rechazo de valores negativos o no enteros en precio y stock, y verificación de persistencia al eliminar.

### Frontend

Los tests del frontend utilizan **Vitest**, **@testing-library/react** y **@testing-library/user-event**.

Para ejecutarlos:

```bash
cd client
npm test
```

Para el modo interactivo:

```bash
cd client
npm run test:watch
```

**Resultado de ejecución**:
Al ejecutar `npm test`, se evalúan 4 archivos de prueba:

- **Suites que se ejecutan y pasan correctamente (3 suites, 45 tests exitosos en total)**:
  - `src/utils/stock.test.js`: **20 tests pasados** (cálculo de stock disponible, stock máximo y validaciones en operaciones de compra).
  - `src/utils/api.test.js`: **15 tests pasados** (resolución de URLs de imágenes estáticas y de GridFS, manejo de fallbacks y helpers de API).
  - `src/components/Cart.test.jsx`: **10 tests pasados** (renderizado de productos, incremento/decremento de cantidades, eliminación y cálculo de subtotales/total).
- **Suite con error de ejecución (1 suite, 0 tests ejecutados)**:
  - `src/pages/AdminCrearProducto.test.jsx`: **Falla en la fase de transformación/parseo** con un error de sintaxis en `vite:oxc` (`Expected ',' or ')' but found '}'`), lo que causa que la ejecución termine con código de error. **Este archivo no aporta cobertura ejecutada actualmente**.

---

## ⚙️ Variables de entorno

### Backend (`backend/.env.example`)

| Variable | Descripción | Requerido |
|---|---|---|
| `MONGODB_URI` | URI de conexión a MongoDB (obligatoria). En producción usar Atlas. | ✅ Sí |
| `PORT` | Puerto HTTP del backend (opcional, por defecto 3000). | No |
| `NODE_ENV` | Entorno de ejecución. Valores posibles: `development` y `production` (por defecto `development`). | No |
| `CORS_ORIGINS` | Orígenes permitidos por CORS en producción, separados por coma. Ejemplo: `https://muebleria-jota-v3.vercel.app`. | No (en desarrollo usa los orígenes locales) |

### Frontend (`client/.env.example`)

| Variable | Descripción | Requerido |
|---|---|---|
| `VITE_API_BASE` | URL base de la API (sin barra final). En desarrollo se deja vacío para proxy de Vite hacia `http://localhost:3000`. En producción, usar la URL pública del backend (ej. Render). | No (vacío = proxy local) |

> **Importante**: No commitear archivos `.env`. Estos están ignorados por git. En despliegue, configurar las variables en el panel del servicio correspondiente. Cambiar `VITE_API_BASE` requiere rebuild del frontend.

---

## 🗂️ Modelo Product

El esquema Mongoose en `backend/models/Product.js` define los siguientes campos:

| Campo | Tipo | Requerido | Validación / Valor por defecto |
|---|---|---|---|
| `nombre` | String | ✅ Sí | `trim: true`, `minlength: [1, 'El nombre no puede estar vacío.']` |
| `descripcion` | String | No | Default: `''`, `trim: true` |
| `precio` | Number | ✅ Sí | `min: [0, 'El precio debe ser mayor o igual a cero.']` |
| `stock` | Number | No | Default: `0`, `min: [0, 'El stock debe ser mayor o igual a cero.']`, entero (`Number.isInteger`) |
| `imagenUrl` | String | No | Default: `''`, `trim: true` |
| `categoria` | String | No | `trim: true` |
| `especificaciones` | [Object] | No | Default: `undefined`, array de `{ label, value }` con ambos campos obligatorios y `trim: true` |
| `destacado` | Boolean | No | Default: `false` |

- **Especificaciones**: Subdocumentos con `label` y `value` (ambos obligatorios), sin `_id` propio. Se usan para mostrar detalles técnicos en la ficha del producto.
- **Imágenes**: Se guardan en el bucket GridFS `imagenesProductos`. El documento de producto conserva `imagenUrl` con la ruta `/api/imagenes/<ObjectId>`. Validación en la API: JPG, PNG o WebP, máximo 3 MB.
- **Metadatos**: El esquema activa `timestamps: true` (campos automáticos `createdAt` y `updatedAt`) y desactiva `versionKey` (`__v: false`).

---

## 📡 API

Base local: `http://localhost:3000/api`.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Estado de la API y conexión a MongoDB |
| `GET` | `/productos` | Listar productos (ordenados por fecha de creación descendente) |
| `GET` | `/productos/:id` | Obtener un producto por ID |
| `POST` | `/productos` | Crear un producto |
| `PUT` | `/productos/:id` | Actualizar un producto |
| `DELETE` | `/productos/:id` | Eliminar un producto y su imagen asociada en GridFS |
| `POST` | `/imagenes` | Subir una imagen (campo `imagen`, valida JPG/PNG/WebP, límite 3 MB) |
| `GET` | `/imagenes/:id` | Servir un archivo de GridFS |

**Respuestas de error esperadas**:

- `400 Bad Request`: Datos requeridos ausentes, valores no válidos (precio/stock negativos o no enteros), formato de ID incorrecto (`ObjectId` inválido), JSON inválido en el cuerpo de la petición o error de índice duplicado (código 11000 de MongoDB).
- `404 Not Found`: Producto no encontrado, imagen no encontrada o ruta no existente.
- `413 Payload Too Large`: La imagen supera el límite máximo de 3 MB.
- `415 Unsupported Media Type`: Formato de imagen no admitido (sólo JPG, PNG o WebP) o archivo corrupto.
- `500 Internal Server Error`: Error interno no controlado del servidor.
- `503 Service Unavailable`: Servidor activo pero conexión con la base de datos no disponible (en `/api/health`).

---

## ☁️ Despliegue

### Render — backend

Crear un servicio Web conectado al repositorio y configurar:

| Opción | Valor |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm ci` |
| Start Command | `npm start` |

Agregar en **Environment** las variables `MONGODB_URI`, `NODE_ENV=production` y `CORS_ORIGINS` con el dominio del frontend (`https://muebleria-jota-v3.vercel.app`). Render asigna `PORT` automáticamente. MongoDB Atlas debe permitir conexiones desde el servicio.

Probar: `https://<servicio>.onrender.com/api/health` debe devolver `"status": "ok"` y `"mongodb": "connected"`.

### Vercel — frontend

Conectar el repositorio y establecer **Root Directory** en `client`. Configurar la variable `VITE_API_BASE` con la URL pública del backend de Render, **sin barra final**. El comando de build es `npm run build` y la carpeta de salida es `dist`. Si se modifica `VITE_API_BASE`, volver a desplegar el frontend.

---

## 📁 Estructura del proyecto

```text
MuebleriaJota_v3/
├── README.md
├── AGENTS.md
├── backend/
│   ├── app.js                    # Middleware, rutas y manejo de errores
│   ├── index.js                  # Inicio del servidor y conexión a MongoDB
│   ├── config/                   # Base de datos y CORS
│   ├── controllers/              # Lógica de productos e imágenes
│   ├── middleware/               # Carga y validación de imágenes
│   ├── models/                   # Esquema de productos
│   ├── routes/                   # Rutas de la API
│   ├── scripts/                  # Migración de productos (seed)
│   ├── services/                 # Almacenamiento GridFS
│   └── tests/                    # Tests automatizados con Jest
└── client/
    ├── public/img/               # Imágenes y logos
    └── src/
        ├── App.jsx               # Rutas, catálogo y estado del carrito
        ├── index.css             # Estilos (variables CSS, componentes)
        ├── main.jsx              # Punto de entrada React
        ├── components/           # Catálogo, tarjetas, detalle, navegación, carrito, contacto
        ├── pages/                # Administración y páginas de la tienda
        └── utils/                # Formato de precio, búsqueda, resolución de URL de imágenes
```

---

## 🤝 Contribuir

Antes de trabajar en el proyecto, leé **[`AGENTS.md`](./AGENTS.md)**: contiene la arquitectura, el contrato de la API y las convenciones del repositorio.

---

<div align="center">

Proyecto académico realizado en el marco de ITBA.

</div>
