# Mueblería Jota

Aplicación con frontend React/Vite, API Express y persistencia en MongoDB.

## Configuración local

Copiá `backend/.env.example` como `backend/.env` y configurá `MONGODB_URI`, `ADMIN_PASSWORD` y `JWT_SECRET`. `ADMIN_PASSWORD` debe tener al menos 12 caracteres y `JWT_SECRET` debe ser aleatorio y tener al menos 32 caracteres. El archivo `.env` está excluido de Git.

Iniciá la API desde `backend` con `npm install` y `npm run dev`. Iniciá el cliente desde `client` con `npm install` y `npm run dev`. En desarrollo, Vite reenvía `/api` a `http://localhost:3000`.

## Despliegue

- **Render (API):** raíz `backend`; comando de inicio `npm start`. Definí `MONGODB_URI`, `ADMIN_PASSWORD`, `JWT_SECRET` y `CORS_ORIGINS` en las variables del servicio. `CORS_ORIGINS` debe contener el origen exacto del sitio de Vercel, por ejemplo `https://mi-tienda.vercel.app`.
- **Vercel (cliente):** raíz `client`; comando de build `npm run build`; directorio de salida `dist`. Definí `VITE_API_BASE` con la URL pública de Render, sin `/` final, por ejemplo `https://mi-api.onrender.com`.

La administración se encuentra en `/admin/crear-producto`. Iniciá sesión con `ADMIN_PASSWORD`; el servidor entrega un token firmado que dura ocho horas. Los endpoints `POST`, `PUT` y `DELETE` de productos requieren ese token como `Authorization: Bearer <token>`.

La ruta `GET /api/health` informa si la API está conectada a MongoDB.
