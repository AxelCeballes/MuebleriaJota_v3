# AGENTS.md

## Proyecto

Mueblería Jota es una tienda web MERN. El frontend está hecho con React, Vite y React Router; la API usa Node.js, Express y Mongoose; MongoDB guarda productos, usuarios, pedidos e imágenes. La interfaz y los mensajes están en español rioplatense.

## Estructura

- `client/src/App.jsx`: rutas, carga de productos (`AppCatalogo`) y composición de providers (`CartProvider` envuelve a `AppContent`).
- `client/src/context/`: `AuthContext` y `CartContext` (los objetos context van en archivos separados).
- `client/src/hooks/`: `useAuth`, `useCart` y `useCheckout`.
- `client/src/services/checkout.js`: POST a `/api/pedidos` con Bearer e `Idempotency-Key`.
- `client/src/pages/`: administración, login, registro, perfil, mis pedidos y 404.
- `client/src/components/`: catálogo, carrito, navegación, `ProtectedRoute` y contacto.
- `client/src/utils/`: formato, stock y helpers de API.
- `client/public/img/`: recursos estáticos del frontend.
- `backend/index.js`: validación de configuración de auth, MongoDB e inicio/cierre del servidor.
- `backend/app.js`: middleware general, health, rutas y errores.
- `backend/config/`: Mongoose, CORS y validación de JWT/bcrypt.
- `backend/models/`: esquemas `Product`, `User` y `Order`.
- `backend/controllers/`: productos, imágenes, autenticación y pedidos.
- `backend/routes/`: `/api/productos`, `/api/imagenes`, `/api/auth` y `/api/pedidos`.
- `backend/middleware/`: JWT/roles y carga de imágenes.
- `backend/services/imageStorage.js`: acceso al bucket GridFS `imagenesProductos`.
- `backend/services/productSeed.js`: importación idempotente del catálogo heredado.
- `backend/data/productosLegado.js`: los 11 productos originales de MuebleriaJota_v2.
- `backend/scripts/`: `migrateProductos.js` (importación manual del catálogo) y `promoteAdmin.js` (primer administrador).

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

Para verificar ambos proyectos:

```sh
cd backend && npm test     # Jest + MongoMemoryReplSet: 6 suites, 137 tests
cd client && npm test      # Vitest: 12 archivos, 87 tests
cd client && npm run lint  # oxlint: 0 errores, 2 warnings conocidos
cd client && npm run build # genera dist/
```

`npm ci` es preferible a `npm install` cuando existe lockfile. Ningún test se conecta a Atlas ni a producción.

## Configuración

- El backend requiere `MONGODB_URI` y `JWT_SECRET` (sin valor por defecto: no inicia sin ellos). Opcionales: `JWT_EXPIRES_IN` (1d), `BCRYPT_SALT_ROUNDS` (12), `PORT` y `CORS_ORIGINS` en producción.
- El cliente usa `VITE_API_BASE` para la URL base de la API. Si queda vacío en desarrollo, Vite reenvía `/api` a `http://localhost:3000`. Nunca pongas `JWT_SECRET` en una variable `VITE_*`.
- No guardes secretos, URI de MongoDB ni archivos `.env` en el repositorio. Los `.env` están ignorados por Git.
- En despliegues, las variables se configuran en el servicio correspondiente; el frontend requiere rebuild después de cambiar variables `VITE_*`.

## API y persistencia

- `GET /api/health`: estado del servidor y conexión MongoDB.
- `/api/productos`: lecturas públicas; crear, actualizar y eliminar exigen `Bearer` y rol `admin`.
- `/api/auth/register` y `/api/auth/login`: públicos; `/api/auth/me`: autenticado. El registro siempre crea `customer`; usa `scripts/promoteAdmin.js` para el primer admin.
- `POST /api/imagenes`: exige `Bearer` y rol `admin`; recibe multipart en el campo `imagen`, valida JPG/PNG/WebP y limita el archivo a 3 MB. `GET /api/imagenes/:id` es público.
- `/api/pedidos`: `POST` y `GET /mis-pedidos` exigen `Bearer`. El cliente envía ids y cantidades; el servidor calcula precios/total, valida stock y guarda el snapshot del producto.
- Las imágenes nuevas se guardan en GridFS `imagenesProductos`; `imagenUrl` conserva `/api/imagenes/<ObjectId>`. No guardes archivos subidos en disco local.
- El modelo `Product` usa `nombre`, `descripcion`, `precio`, `stock`, `imagenUrl`, `categoria`, `especificaciones` y `destacado`. No lo renombres ni lo reemplaces: `User` y `Order` son modelos nuevos y separados.
- `scripts/migrateProductos.js` importa los 11 productos de `data/productosLegado.js` usando el nombre exacto como clave (idempotente: actualiza, no duplica), sube las imágenes de `client/public/img` a GridFS y conserva el stock existente salvo que se pase `--stock`/`STOCK_INICIAL`. Es manual: nunca lo ejecutes automáticamente ni contra una base sin confirmación.

## Frontend y convenciones

- Rutas principales: `/`, `/productos`, `/productos/:id`, `/contacto`, `/carrito`, `/login`, `/registro`, `/perfil`, `/mis-pedidos` y `/admin/crear-producto`.
- `/admin/crear-producto` está detrás de `ProtectedRoute roles={['admin']}`. Las escrituras admin envían `Authorization: Bearer <token>`; la interfaz valida, pero la API es la única fuente de verdad.
- `AuthContext` guarda el JWT en `localStorage` (`auth_token`) y lo valida con `/api/auth/me` al recargar. Un `401`/4xx descarta la sesión; un `5xx` o fallo de red conserva el token, no expone `usuario` sin validar y habilita `reintentarRestauracion()`. `ProtectedRoute` muestra ese reintento en lugar de redirigir al login. Tiempo de espera de sesión y redirección con retorno al destino: no lo rompas.
- La composición de `App` es `AuthProvider` → `BrowserRouter` → `AppCatalogo` (catálogo) → `CartProvider` → `AppContent`. No llames `useCart`/`useCheckout` por encima o fuera de sus providers; `App.test.jsx` cubre la integración completa.
- El carrito se conserva en `localStorage` (`carrito`, ids de producto). `useCheckout` envía ids/cantidades con Bearer e `Idempotency-Key`; vacía el carrito **sólo** con pedido confirmado. No es una pasarela de pagos.
- Usa `resolverImagenUrl` para mostrar imágenes. Convierte las rutas `/api/imagenes/...` a la URL de API configurada; respeta rutas estáticas existentes bajo `/img`.
- Mantén el estilo existente y las variables CSS de `client/src/index.css`. Usa componentes y hooks funcionales, nombres descriptivos en el idioma predominante del archivo y mensajes visibles en español.
- Los errores esperados deben responder con códigos HTTP y mensajes claros. Evita exponer detalles internos del servidor al cliente.
- Limitaciones conocidas y aceptadas en este sprint: el JWT en `localStorage` es vulnerable a XSS y no hay rate limiting en `/api/auth/login` ni `/api/auth/register`. No las introduzcas como "arreglos" sin alcance explícito; tampoco guardes tokens en logs ni en almacenamiento compartido.
- Si agregas dependencias al backend o cliente, actualiza su `package-lock.json` con npm y no edites manualmente el lockfile.

## Despliegue

- Backend: raíz del servicio `backend`; build `npm ci`, inicio `npm start`. Variables: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`, `CORS_ORIGINS` y, si se ajustan, `JWT_EXPIRES_IN` y `BCRYPT_SALT_ROUNDS`.
- Frontend: raíz en Vercel `client`; build `npm run build`, salida `dist`, variable `VITE_API_BASE` con la URL pública sin barra final. Cambiar esa variable requiere rebuild.
- `client/vercel.json` enruta las rutas de la SPA a `index.html`.
- `JWT_SECRET` existe sólo en el backend: nunca como variable `VITE_*` ni en el repositorio. Verifica `/api/health` y el flujo login → pedido tras desplegar.
- No modificar servicios, variables ni dominios remotos sin autorización explícita; Fase 7 queda pendiente de las URLs reales.
