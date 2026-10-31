# Mueblería Jota

Aplicación con frontend React/Vite, API Express y persistencia en MongoDB.

## Configuración local

Copiá `backend/.env.example` como `backend/.env` y configurá `MONGODB_URI`. El archivo `.env` está excluido de Git.

Iniciá la API desde `backend` con `npm install` y `npm run dev`. Iniciá el cliente desde `client` con `npm install` y `npm run dev`. En desarrollo, Vite reenvía `/api` a `http://localhost:3000`.

## Despliegue

- **Render (API):** raíz `backend`; comando de inicio `npm start`. Definí `MONGODB_URI` y `CORS_ORIGINS` en las variables del servicio. `CORS_ORIGINS` debe contener el origen exacto del sitio de Vercel, por ejemplo `https://mi-tienda.vercel.app`.
- **Vercel (cliente):** raíz `client`; comando de build `npm run build`; directorio de salida `dist`. Definí `VITE_API_BASE` con la URL pública de Render, sin `/` final, por ejemplo `https://mi-api.onrender.com`.

La gestión de productos se encuentra en `/admin/crear-producto` y permite crear, editar y eliminar productos.

La ruta `GET /api/health` informa si la API está conectada a MongoDB.
