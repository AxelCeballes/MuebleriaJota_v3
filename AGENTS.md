# AGENTS.md

## Proyecto

Mueblería Jota es una tienda web de catálogo. El frontend está hecho con React, Vite y React Router; la API usa Node.js, Express y Mongoose; MongoDB guarda productos e imágenes. La interfaz y los mensajes están en español rioplatense.

## Estructura

- `client/src/App.jsx`: rutas, carga de productos, navegación, carrito y estado compartido.
- `client/src/pages/`: pantallas administrativas y de creación/edición.
- `client/src/components/`: catálogo, tarjetas, detalle, navegación, carrito y contacto.
- `client/src/utils/`: formato de precios, búsqueda y resolución de URL de imágenes.
- `client/public/img/`: recursos estáticos del frontend.
- `backend/index.js`: carga de variables de entorno, conexión a MongoDB e inicio/cierre del servidor.
- `backend/app.js`: middleware general, salud del servicio, rutas y errores.
- `backend/config/`: conexión de Mongoose y política CORS.
- `backend/models/Product.js`: esquema de productos.
- `backend/controllers/`: lógica de productos e imágenes.
- `backend/routes/`: endpoints REST.
- `backend/middleware/imageUpload.js`: recepción y límites de carga de imágenes.
- `backend/services/imageStorage.js`: acceso al bucket GridFS `imagenesProductos`.
- `backend/scripts/migrateProductos.js`: datos iniciales/migración del catálogo.

No hay `package.json` en la raíz. El cliente y el backend tienen dependencias y comandos independientes.

## Comandos

Ejecutar desde el directorio indicado:

```sh
# API
cd backend
npm install
npm run dev

# Cliente, en otra terminal
cd client
npm install
npm run dev
```

Para verificar el cliente:

```sh
cd client
npm run lint
npm run build
```

El script `test` del backend actualmente es un marcador que termina con error; no representa una suite de pruebas.

## Configuración

- El backend requiere `MONGODB_URI`; también utiliza `PORT` y, en producción, `CORS_ORIGINS` con orígenes separados por comas.
- El cliente usa `VITE_API_BASE` para la URL base de la API. Si queda vacío en desarrollo, Vite reenvía `/api` a `http://localhost:3000`.
- No guardes secretos, URI de MongoDB ni archivos `.env` en el repositorio. Los `.env` están ignorados por Git.
- En despliegues, las variables se configuran en el servicio correspondiente; el frontend requiere rebuild después de cambiar variables `VITE_*`.

## API y persistencia

- `GET /api/health`: estado del servidor y conexión MongoDB.
- `/api/productos`: listar, obtener por ID, crear, actualizar y eliminar productos. Las rutas de escritura actualmente no requieren inicio de sesión; conserva ese comportamiento salvo que la tarea solicite cambiarlo.
- `POST /api/imagenes`: recibe un archivo multipart en el campo `imagen`, valida JPG/PNG/WebP y limita el archivo a 3 MB.
- `GET /api/imagenes/:id`: sirve un archivo de GridFS.
- Las imágenes nuevas se guardan en el bucket GridFS `imagenesProductos`; el documento de producto conserva una ruta `/api/imagenes/<ObjectId>` en `imagenUrl`.
- Al reemplazar o borrar un producto, la API intenta borrar la imagen anterior de GridFS. No guardes archivos subidos en el disco local del servidor: el despliegue puede usar almacenamiento efímero.
- El modelo de producto usa `nombre`, `descripcion`, `precio`, `stock`, `imagenUrl`, `categoria`, `especificaciones` y `destacado`. Mantén validaciones y compatibilidad con productos existentes.

## Frontend y convenciones

- Rutas principales: `/`, `/productos`, `/productos/:id`, `/contacto`, `/carrito` y `/admin/crear-producto`.
- La administración permite crear, editar y eliminar productos sin login. La API pública debe seguir validando los datos aunque la interfaz también valide.
- El carrito se conserva en `localStorage`; no lo confundas con un pedido persistido. El botón de compra es demostrativo y no procesa pagos.
- Usa `resolverImagenUrl` para mostrar imágenes. Convierte las rutas `/api/imagenes/...` a la URL de API configurada; respeta rutas estáticas existentes bajo `/img`.
- Mantén el estilo existente y las variables CSS de `client/src/index.css`. Usa componentes y hooks funcionales, nombres descriptivos en el idioma predominante del archivo y mensajes visibles en español.
- Los errores esperados deben responder con códigos HTTP y mensajes claros. Evita exponer detalles internos del servidor al cliente.
- Si agregas dependencias al backend o cliente, actualiza su `package-lock.json` con npm y no edites manualmente el lockfile.

## Despliegue

- Backend: la raíz del servicio es `backend`; inicio con `npm start`.
- Frontend: la raíz del proyecto de Vercel es `client`; build con `npm run build`, salida `dist`.
- `client/vercel.json` enruta las rutas de la SPA a `index.html`.
- Coordina los orígenes CORS con el dominio real del frontend y configura `VITE_API_BASE` con la URL pública de la API.
