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

**Hermanos Jota** es una aplicación web cliente-servidor para una mueblería de diseño con identidad argentina. El frontend, desarrollado con **React y Vite**, consume una **API REST** construida con **Node.js y Express**. Los productos se guardan en **MongoDB Atlas** mediante Mongoose, y las imágenes subidas desde la administración se almacenan en GridFS.

## 👥 Integrantes

| Nombre | GitHub |
|---|---|
| Lian Rivera | [kyan16](https://github.com/kyan16) |
| Axel Ceballes | [AxelCeballes](https://github.com/AxelCeballes) |
| Francisco Ramirez | [FranR27](https://github.com/FranR27) |
| Tomás Fioravanti | [Tomas-ui](https://github.com/Tomas-ui) |
| Tomás Gonzales | [tsgexe](https://github.com/tsgexe) |

## ✨ Funcionalidades

- 🏠 **Portada** con hero y piezas destacadas
- 🛋️ **Catálogo** con búsqueda de productos
- 🔍 **Detalle del producto** con imagen, precio, descripción y especificaciones
- 🛒 **Carrito** con cantidades, subtotales, total y persistencia en `localStorage`
- ✉️ **Contacto** con formulario
- 🔄 Estados de carga y error al consultar la API, con opción para reintentar
- 🔐 **Administración protegida** para iniciar sesión y gestionar productos
- ➕ Crear productos, ✏️ editarlos y 🗑️ eliminarlos
- 🖼️ Subir imágenes desde el dispositivo y guardarlas en MongoDB GridFS

> El carrito es demostrativo: no procesa pagos ni registra pedidos.

## 🛠️ Tecnologías

| Capa | Tecnologías |
|---|---|
| Frontend | React 19, React Router DOM, Vite, CSS |
| Backend | Node.js, Express 5 |
| Persistencia | MongoDB Atlas, Mongoose y GridFS |
| Despliegue | Vercel (frontend) · Render (API) |
| Tipografías | Playfair Display e Inter |

## 🚀 Instalación y ejecución

### Requisitos previos

- **Node.js y npm**
- Una instancia de MongoDB y las variables de entorno del backend
- Los puertos **3000** (API) y **5173** (cliente) disponibles, salvo que se configuren otros

### Pasos

Hacen falta **dos terminales abiertas al mismo tiempo**.

Antes de iniciar la API, crear `backend/.env` con estas variables:

```env
MONGODB_URI=<uri-de-mongodb>
ADMIN_PASSWORD=<contraseña-de-al-menos-12-caracteres>
JWT_SECRET=<secreto-aleatorio-de-al-menos-32-caracteres>
```

**Terminal 1 — API** (`http://localhost:3000`)

```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — Cliente** (`http://localhost:5173`)

```bash
cd client
npm install
npm run dev
```

Vite reenvía las solicitudes `/api` al backend local. Para apuntar a otra API, configurar `VITE_API_BASE` en el entorno del cliente.

### Scripts disponibles

| Carpeta | Comando | Qué hace |
|---|---|---|
| `backend` | `npm start` | Inicia la API |
| `backend` | `npm run dev` | Inicia la API en modo desarrollo |
| `client` | `npm run dev` | Inicia Vite en modo desarrollo |
| `client` | `npm run lint` | Analiza el código del cliente |
| `client` | `npm run build` | Genera la versión de producción en `dist` |

## 📡 API

Base local: `http://localhost:3000/api`. Las escrituras de productos y la carga de imágenes requieren una sesión de administrador.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Estado de la API y conexión a MongoDB |
| `POST` | `/admin/login` | Iniciar sesión de administrador |
| `GET` | `/productos` | Listar productos |
| `GET` | `/productos/:id` | Obtener un producto |
| `POST` | `/productos` | Crear un producto (autenticación requerida) |
| `PUT` | `/productos/:id` | Actualizar un producto (autenticación requerida) |
| `DELETE` | `/productos/:id` | Eliminar un producto (autenticación requerida) |
| `POST` | `/imagenes` | Subir una imagen (autenticación requerida) |
| `GET` | `/imagenes/:id` | Obtener una imagen de GridFS |

## ☁️ Despliegue

### Render — backend

Crear un servicio Web conectado al repositorio y configurar:

| Opción | Valor |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm ci` |
| Start Command | `npm start` |

Agregar en **Environment** las variables `MONGODB_URI`, `ADMIN_PASSWORD`, `JWT_SECRET`, `NODE_ENV=production` y `CORS_ORIGINS` con el dominio del frontend. Render asigna `PORT` automáticamente. MongoDB Atlas debe permitir conexiones desde el servicio.

### Vercel — frontend

Conectar el repositorio y establecer **Root Directory** en `client`. Configurar `VITE_API_BASE` con la URL pública del backend de Render, sin barra final. El comando de build es `npm run build` y la carpeta de salida es `dist`. Si se modifica `VITE_API_BASE`, volver a desplegar el frontend.

Para comprobar el backend, abrir `https://<servicio>.onrender.com/api/health`; la respuesta debe incluir `"status": "ok"` y `"mongodb": "connected"`.

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
│   ├── middleware/               # Autenticación y carga de imágenes
│   ├── models/                   # Esquema de productos
│   ├── routes/                   # Rutas de la API
│   ├── scripts/                  # Migración de productos
│   └── services/                 # Almacenamiento GridFS
└── client/
    ├── public/img/               # Imágenes y logos
    └── src/
        ├── App.jsx               # Rutas, catálogo y estado del carrito
        ├── index.css             # Estilos
        ├── components/           # Componentes de la tienda
        ├── pages/                # Administración de productos
        └── utils/                 # Funciones auxiliares
```

## 🤝 Contribuir

Antes de trabajar en el proyecto, leé **[`AGENTS.md`](./AGENTS.md)**: contiene la arquitectura, el contrato de la API y las convenciones del repositorio.

---

<div align="center">

Proyecto académico realizado en el marco de ITBA.

</div>
