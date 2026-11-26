<div align="center">

# 🪵 Hermanos Jota

### E-commerce de muebles artesanales con identidad argentina

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?logo=reactrouter&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)

Proyecto académico — Sprint 8

**[Ver sitio web](https://muebleria-jota-v3.vercel.app/)**

</div>

---

## 📖 Descripción

**Hermanos Jota** es una aplicación **MERN** (MongoDB, Express, React, Node.js) para una mueblería de diseño con identidad argentina. El frontend, desarrollado con **React y Vite**, consume una **API REST** construida con **Node.js y Express**. Los productos, usuarios y pedidos se guardan en **MongoDB** mediante Mongoose, y las imágenes subidas desde la administración se almacenan en GridFS (`imagenesProductos`). La API exige **JWT** para escribir productos, subir imágenes y crear o consultar pedidos; el registro público siempre crea usuarios `customer`.

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
- 🧰 Sección de administración para gestionar productos (sólo usuarios `admin`)
- ➕ Crear productos, ✏️ editarlos y 🗑️ eliminarlos
- 🖼️ Subir imágenes desde el dispositivo y guardarlas en MongoDB GridFS
- 🔐 Registro, login, perfil y sesión persistida con JWT; rutas privadas con retorno al destino
- 📦 Pedidos reales: el checkout envía ids y cantidades, el servidor calcula precios y descuenta stock
- 🧾 Historial de pedidos filtrado por usuario autenticado

> No hay pasarela de pagos: el pedido registra la compra, no cobra dinero.

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

Además, desde `backend` con `MONGODB_URI` configurada:

| Comando | Qué hace |
|---|---|
| `node scripts/migrateProductos.js --dry-run` | Simula la importación del catálogo heredado sin escribir en MongoDB |
| `node scripts/migrateProductos.js` | Importa o actualiza los 11 productos heredados (idempotente) |
| `node scripts/promoteAdmin.js <email>` | Promueve a `admin` un usuario ya registrado |

La importación del catálogo se explica en detalle más abajo.

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

**Resultado de ejecución verificado (Sprint 8)**:
- **6 suites aprobadas**, **137 tests exitosos** de 137 totales.
- **Cobertura**: CRUD de productos y GridFS, importación idempotente del catálogo heredado, CORS y preflight (`Idempotency-Key`), registro/login/perfil con bcrypt y JWT, roles `customer`/`admin`, protección de escrituras (`401`/`403`), pedidos con precios calculados en servidor, stock atómico, idempotencia y aislamiento por usuario. Las transacciones se prueban con `MongoMemoryReplSet`; nunca se conecta a Atlas ni a producción.

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

**Resultado de ejecución verificado (Sprint 8)**:
- **12 archivos de prueba**, **87 tests exitosos** de 87 totales. Sin suites fallidas ni omitidas.
- **Cobertura**: stock y utilidades, carrito y checkout, contextos de autenticación y carrito, `ProtectedRoute`, login/registro, navbar condicional, historial de pedidos, administración e integración de `App` con `AuthProvider`, `CartProvider` y router reales (catálogo, carrito persistente, checkout autenticado y redirección de visitantes al login).
- `npm run lint` termina sin errores (dos advertencias conocidas de `react(set-state-in-effect)` en `App.jsx` y `MisPedidos.jsx`) y `npm run build` genera `dist` correctamente.

---

## ⚙️ Variables de entorno

### Backend (`backend/.env.example`)

| Variable | Descripción | Requerido |
|---|---|---|
| `MONGODB_URI` | URI de conexión a MongoDB (obligatoria). En producción usar Atlas. | ✅ Sí |
| `JWT_SECRET` | Secreto para firmar y verificar JWT. Sin valor por defecto: el backend no inicia si falta. Nunca exponer al frontend. | ✅ Sí |
| `JWT_EXPIRES_IN` | Vigencia del token: `1d` (por defecto), `12h`, `30m`, `1w` o segundos. | No |
| `BCRYPT_SALT_ROUNDS` | Rondas de bcrypt, entre 10 y 15 (por defecto 12). | No |
| `PORT` | Puerto HTTP del backend (opcional, por defecto 3000). | No |
| `NODE_ENV` | Entorno de ejecución: `development` o `production` (por defecto `development`). | No |
| `CORS_ORIGINS` | Orígenes permitidos en producción, separados por coma. Ejemplo: `https://muebleria-jota-v3.vercel.app`. | No (en desarrollo usa los orígenes locales) |

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

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/health` | Público | Estado de la API y conexión a MongoDB |
| `GET` | `/productos` | Público | Listar productos (ordenados por fecha de creación descendente) |
| `GET` | `/productos/:id` | Público | Obtener un producto por ID |
| `POST` | `/productos` | Admin | Crear un producto |
| `PUT` | `/productos/:id` | Admin | Actualizar un producto |
| `DELETE` | `/productos/:id` | Admin | Eliminar un producto y su imagen asociada en GridFS |
| `POST` | `/imagenes` | Admin | Subir una imagen (campo `imagen`, JPG/PNG/WebP, máximo 3 MB) |
| `GET` | `/imagenes/:id` | Público | Servir un archivo de GridFS |
| `POST` | `/auth/register` | Público | Registrar usuario `customer` (devuelve token) |
| `POST` | `/auth/login` | Público | Iniciar sesión (devuelve token) |
| `GET` | `/auth/me` | Autenticado | Perfil del usuario del token |
| `POST` | `/pedidos` | Autenticado | Crear pedido con `{ items: [{ producto, cantidad }] }` y `Idempotency-Key` opcional |
| `GET` | `/pedidos/mis-pedidos` | Autenticado | Historial del usuario autenticado |

Las rutas protegidas exigen `Authorization: Bearer <token>`. Las de administración requieren además el rol `admin`.

**Respuestas de error esperadas**:

- `400 Bad Request`: Datos requeridos ausentes, valores no válidos (precio/stock negativos o no enteros), formato de ID incorrecto (`ObjectId` inválido), JSON inválido, email duplicado o datos de pedido inválidos.
- `401 Unauthorized`: Falta el token, es inválido/expiró o el usuario ya no existe.
- `403 Forbidden`: El usuario autenticado no tiene el rol `admin` para esa operación.
- `404 Not Found`: Producto no encontrado, imagen no encontrada o ruta no existente.
- `409 Conflict`: Stock insuficiente al crear un pedido o envío idempotente todavía en procesamiento.
- `413 Payload Too Large`: La imagen supera el límite máximo de 3 MB.
- `415 Unsupported Media Type`: Formato de imagen no admitido (sólo JPG, PNG o WebP) o archivo corrupto.
- `500 Internal Server Error`: Error interno no controlado del servidor.
- `503 Service Unavailable`: Servidor activo pero conexión con la base de datos no disponible (en `/api/health`).

---

## 🔄 Flujo MERN (de la request al pedido)

1. **React (cliente)**: `AppCatalogo` carga el catálogo y envuelve `AppContent` con `CartProvider`, que recibe la lista de productos; dentro de ambos providers vive el router con las páginas. `AuthContext` guarda el JWT en `localStorage` (`auth_token`) y lo valida con `GET /api/auth/me` al recargar: un `401` descarta la sesión; un `5xx` o un fallo de red conserva el token, no muestra usuario sin validar y habilita un reintento.
2. **Rutas protegidas**: `ProtectedRoute` espera la validación de sesión y redirige a `/login` conservando el destino; si la validación falló por un problema temporal, ofrece REINTENTAR en lugar de cerrar la sesión. El navbar muestra enlaces según sesión y rol.
3. **API (Express)**: `app.js` aplica CORS con `Content-Type`, `Authorization` e `Idempotency-Key`, limita el JSON a 20 kb y monta `/api/productos`, `/api/imagenes`, `/api/auth` y `/api/pedidos`.
4. **Autenticación y autorización**: `requireAuth` verifica firma, expiración y existencia del usuario; `requireRole('admin')` protege escrituras de catálogo e imágenes. El `userId` nace del token, nunca del cuerpo.
5. **Mongoose y Atlas**: los controladores usan los modelos `Product`, `User` y `Order`; las imágenes se guardan en GridFS (`imagenesProductos`).
6. **Checkout**: el cliente envía ids y cantidades con Bearer e `Idempotency-Key`; el servidor recarga los productos, calcula precios y total, descuenta stock dentro de una transacción y guarda un snapshot en `Order`.
7. **Respuesta**: con `201` el cliente vacía el carrito, recarga el catálogo y muestra el número de pedido; ante `400`/`401`/`403`/`409` o error de red, conserva el carrito y muestra el mensaje en español.

### Auditoría y limitaciones conocidas

- **JWT en `localStorage`**: cumple el requisito académico de persistencia y funciona con `Authorization: Bearer`, pero es susceptible a XSS. No se inserta HTML no confiable y el secreto de firma existe sólo en el backend. Para un entorno real, evaluar cookies `HttpOnly`/`Secure` con protección CSRF.
- **Sin límite de intentos**: `/api/auth/login` y `/api/auth/register` no aplican rate limiting; queda como mejora pendiente para producción.
- **Sin pasarela de pagos**: el pedido registra la compra académica, no cobra dinero.
- **Despliegue**: las URLs y las variables remotas se configuran en la Fase 7; este repositorio no contiene secretos ni archivos `.env`.

### Primer administrador

El registro público siempre crea usuarios `customer`. Para promover al primer administrador, con `MONGODB_URI` configurada:

```bash
cd backend
node scripts/promoteAdmin.js email-del-usuario@example.com
```

No hay campo de rol libre en el formulario de registro.

### Importar el catálogo heredado

Los 11 productos de [MuebleriaJota_v2](https://github.com/AxelCeballes/MuebleriaJota_v2) se importan con `backend/scripts/migrateProductos.js`. Los datos originales (`nombre`, `descripcion`, `precio`, `categoria`, `especificaciones` y `destacado`) están en `backend/data/productosLegado.js` y se conservan exactamente.

El script:

- sube cada imagen desde `client/public/img` al bucket GridFS `imagenesProductos` y guarda `imagenUrl` como `/api/imagenes/<id>`, igual que la administración; no deja rutas locales en la base;
- usa el **nombre exacto** como clave estable: si el producto ya existe, actualiza sus datos en lugar de duplicarlo y conserva su imagen si ya es una imagen válida de GridFS;
- asigna **stock 0** a los productos nuevos por defecto, sin inventar cantidades;
- no elimina ni modifica usuarios, pedidos ni productos ajenos a la importación;
- informa al final cuántos productos insertó, actualizó, omitió y cuántos existen en total.

Ejecutarla manualmente, con `MONGODB_URI` apuntando a la base correcta. Primero conviene simular:

```bash
cd backend
node scripts/migrateProductos.js --dry-run
node scripts/migrateProductos.js
```

El script toma `MONGODB_URI` de `backend/.env` o de la variable de entorno de la terminal e imprime el host y la base de destino al conectarse. Verificá ahí que sea el cluster de Sprint 8 antes de confirmar la escritura.

Opciones disponibles:

| Opción | Descripción |
|---|---|
| `--dry-run` | Muestra qué haría sin escribir en MongoDB |
| `--stock=N` o `STOCK_INICIAL=N` | Stock inicial entero `>= 0` (por defecto `0`). Si se indica, también se aplica a los productos heredados que ya existan |
| `--imagenes-dir=RUTA` | Carpeta alternativa con las imágenes de origen (por defecto `client/public/img`) |
| `-h`, `--help` | Muestra la ayuda |

Sin `--stock`/`STOCK_INICIAL`, el stock de los productos existentes se conserva en las reejecuciones. La importación nunca se ejecuta automáticamente al desplegar ni al iniciar la API: es un paso manual.

---

## ☁️ Despliegue

### Render — backend

Crear un servicio Web conectado al repositorio y configurar:

| Opción | Valor |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm ci` |
| Start Command | `npm start` |

Agregar en **Environment** las variables `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`, `CORS_ORIGINS` con el dominio real del frontend y, si se desea ajustar, `JWT_EXPIRES_IN` y `BCRYPT_SALT_ROUNDS`. Render asigna `PORT` automáticamente. MongoDB Atlas debe permitir conexiones desde el servicio. Nunca exponer `JWT_SECRET` como variable `VITE_*` ni guardarlo en el repositorio.

Probar: `https://<servicio>.onrender.com/api/health` debe devolver `"status": "ok"` y `"mongodb": "connected"`.

### Vercel — frontend

Conectar el repositorio y establecer **Root Directory** en `client`. Configurar la variable `VITE_API_BASE` con la URL pública del backend de Render, **sin barra final**. El comando de build es `npm run build` y la carpeta de salida es `dist`. Si se modifica `VITE_API_BASE`, volver a desplegar el frontend.

---

## 📁 Estructura del proyecto

```text
MuebleriaJota_v3/
├── README.md
├── AGENTS.md
├── docs/                         # Plan del Sprint 8 y protocolo de trabajo
├── backend/
│   ├── app.js                    # CORS, rutas y manejo de errores
│   ├── index.js                  # Validación de auth, MongoDB y servidor
│   ├── config/                   # Base de datos, CORS y variables de JWT/bcrypt
│   ├── controllers/              # Productos, imágenes, auth y pedidos
│   ├── data/                     # Catálogo heredado de MuebleriaJota_v2
│   ├── middleware/               # JWT, roles y carga de imágenes
│   ├── models/                   # Product, User y Order
│   ├── routes/                   # /api/productos, /imagenes, /auth y /pedidos
│   ├── scripts/                  # Importación del catálogo y promoción a admin
│   ├── services/                 # GridFS e importación idempotente del catálogo
│   └── tests/                    # Suites Jest con MongoMemoryReplSet
└── client/
    ├── public/img/               # Imágenes y logos
    └── src/
        ├── App.jsx               # Rutas, catálogo y composición de providers
        ├── index.css             # Sistema de diseño y estilos de pantallas
        ├── main.jsx              # Punto de entrada React
        ├── components/           # Catálogo, carrito, nav y ProtectedRoute
        ├── context/              # AuthContext, CartContext y sus objetos
        ├── hooks/                # useAuth, useCart y useCheckout
        ├── pages/                # Admin, login, registro, perfil y pedidos
        ├── services/             # Cliente HTTP del checkout
        └── utils/                # Formato, stock y helpers de API
```

---

## 🤝 Contribuir

Antes de trabajar en el proyecto, leé **[`AGENTS.md`](./AGENTS.md)**: contiene la arquitectura, el contrato de la API y las convenciones del repositorio.

---

<div align="center">

Proyecto académico realizado en el marco de ITBA.

</div>
