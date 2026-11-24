# Sprint 8 — Plan de implementación y auditoría

## 1. Objetivo

Completar Mueblería Hermanos Jota como e-commerce MERN, conservando catálogo, administración, imágenes GridFS, diseño y comportamiento existente que no contradiga los requisitos del Sprint 8.

Este documento describe el estado observado en la rama `main` al iniciar el análisis. No implica que los cambios funcionales ya estén implementados.

## 2. Estado inicial verificado

### Stack y estructura
- Repositorio dividido en `backend/` y `client/`; no hay package.json en la raíz.
- Backend: CommonJS, Node.js, Express 5, Mongoose 9, MongoDB.
- Frontend: React 19, Vite, React Router DOM 7.
- Backend usa Jest, Supertest y MongoDB Memory Server.
- Frontend usa Vitest, Testing Library y Oxlint.
- Persistencia de imágenes mediante GridFS, bucket `imagenesProductos`.
- Despliegue documentado: backend en Render, frontend en Vercel, MongoDB Atlas.

### Funcionalidades existentes
- Catálogo, detalle, búsqueda/listado y administración CRUD de productos.
- Subida y recuperación de imágenes.
- Carrito basado en IDs en localStorage, con validación de stock en el cliente.
- La aplicación concentra estado de productos y carrito en `client/src/App.jsx`.
- `Cart.jsx` muestra un aviso demostrativo: no crea pedidos ni procesa pagos.

### Pendientes confirmados
- No se encontraron modelos, controladores ni rutas de usuarios, autenticación o pedidos.
- No se encontraron contextos React para autenticación o carrito.
- No se encontraron páginas de login, registro, perfil o pedidos.
- No existe middleware de autorización JWT.
- Los endpoints de escritura de productos no exigen autenticación.
- CORS permite `Content-Type`, pero no declara `Authorization`.
- La documentación operativa presenta inconsistencias: `AGENTS.md` describe el test del backend como marcador aunque `backend/package.json` configura Jest; README menciona una prueba AdminCrearProducto que no aparece en el árbol actual. Verificar los comandos reales y actualizar documentación con resultados ejecutados.

## Compatibilidad del modelo Product y estado de la base de datos

La versión anterior del proyecto, correspondiente a los sprints 5 y 6, utiliza el siguiente modelo de productos:

| Campo | Tipo | Restricción |
|---|---|---|
| `nombre` | String | Obligatorio |
| `descripcion` | String | Opcional |
| `precio` | Number | Obligatorio |
| `stock` | Number | Opcional |
| `imagenUrl` | String | Opcional |

Este esquema debe mantenerse como referencia de compatibilidad para el Sprint 8.

**Requisitos:**
- Conservar los nombres originales de los campos y sus tipos.
- No reemplazar `nombre` por `name`, `imagenUrl` por `image` ni crear un segundo modelo de productos.
- El catálogo, detalle, carrito, administración y checkout deben utilizar esta misma estructura.
- La validación de precios y stock debe realizarse en el backend.
- Los pedidos deben guardar una copia de los datos relevantes del producto al momento de la compra, especialmente nombre y precio unitario.
- No modificar el esquema Product sin una justificación técnica, evaluación de compatibilidad y documentación previa.

### Estado de MongoDB Atlas

El proyecto utiliza una nueva base de datos MongoDB Atlas llamada `muebleria`, que actualmente está vacía.

- No existen productos, usuarios ni pedidos cargados.
- No se debe asumir que los datos de los sprints 5 y 6 están disponibles.
- Los modelos y esquemas deben definirse en el backend mediante Mongoose.
- MongoDB creará las colecciones correspondientes al insertar los primeros documentos; no es necesario crearlas manualmente desde Atlas.
- Si se necesitan datos para pruebas, deben prepararse mediante un seed de desarrollo separado, sin mezclar datos ficticios con producción.
- La importación de productos anteriores, si fuera necesaria, se realizará posteriormente y de forma independiente.

## 3. Principios de implementación

1. Leer y respetar `AGENTS.md`, los componentes actuales, convenciones de idioma y estilos.
2. Cambios incrementales y acotados; evitar reescrituras generales de `App.jsx`.
3. No romper catálogo, administración, GridFS, validaciones de stock, responsive ni rutas actuales.
4. No confiar en el frontend para seguridad, precios, propiedad del pedido o disponibilidad.
5. No almacenar contraseñas en texto plano, secretos en el repositorio ni datos sensibles dentro del JWT.
6. No inventar pagos: el alcance es registrar pedidos, no integrar una pasarela.
7. No afirmar que una prueba pasó sin ejecutarla y observar su salida.
8. No desplegar ni cambiar servicios/variables de producción sin autorización explícita.
9. Mantener compatibilidad de productos existentes y no cambiar sus campos innecesariamente.
10. Antes de cada cambio, revisar impacto y pruebas; al terminar, informar archivos modificados y comandos ejecutados.

## 4. Diseño funcional y técnico propuesto

### Backend

#### Usuarios y autenticación
- Crear modelo `User` con email normalizado y único, nombre y contraseña hasheada con bcrypt; agregar rol con valores controlados (`customer` y `admin`).
- El endpoint público de registro siempre asigna `customer`; nunca aceptar el rol desde el body.
- Validar y normalizar entradas; devolver errores claros para datos inválidos y email duplicado.
- Login verifica contraseña con bcrypt y emite JWT firmado con `JWT_SECRET` y expiración configurable (`JWT_EXPIRES_IN`).
- No devolver hash de contraseña en ninguna respuesta.
- Crear middleware que lea `Authorization: Bearer <token>`, verifique firma/expiración y cargue identidad mínima del usuario.
- Crear middleware de autorización por rol para operaciones administrativas.
- Endpoints sugeridos: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
- No registrar tokens, contraseñas ni secretos en logs.

#### Autorización de catálogo y administración
- Lecturas públicas de productos se mantienen públicas.
- Proteger POST, PUT y DELETE de `/api/productos` con autenticación y rol admin. El frontend actualmente expone administración sin login; deberá adaptarse a una sesión admin.
- Proteger subida de imágenes `POST /api/imagenes` para que no pueda ser utilizada anónimamente para cargar archivos. Mantener GET de imágenes público para renderizar catálogo.
- No confundir ocultar enlaces/componentes con autorización real: cada endpoint debe validar permisos.

#### Pedidos
- Crear modelo `Order` vinculado al usuario mediante ObjectId.
- Guardar snapshot de cada línea: producto, nombre, precio unitario y cantidad; incluir total, estado y timestamps.
- El cliente envía IDs y cantidades, nunca un precio/total autoritativo ni userId.
- El backend obtiene productos desde MongoDB, valida IDs, cantidades enteras positivas y stock; calcula precios y total desde datos persistidos.
- Asociar el pedido exclusivamente al usuario autenticado (`req.user`).
- Crear `POST /api/pedidos` protegido y `GET /api/pedidos/mis-pedidos` protegido, filtrado siempre por el usuario autenticado.
- Evitar pedidos vacíos, cantidades fuera de stock, productos inexistentes y stock negativo.
- Evitar duplicación por doble clic/reintento mediante control de petición o estrategia idempotente si se incorpora.
- La actualización de stock y creación del pedido deben ser consistentes ante concurrencia y fallos. Preferir transacción MongoDB compatible con Atlas y probarla en entorno replica set; si el entorno de test no soporta transacciones, configurar MongoMemoryReplSet o documentar una alternativa segura. No aplicar decrementos parciales sin rollback.
- El vaciado del carrito en frontend ocurre solamente después de respuesta exitosa del servidor.

#### Configuración y seguridad
- Agregar variables documentadas: `JWT_SECRET` (obligatoria), `JWT_EXPIRES_IN` (valor por defecto razonable) y, si se necesita, `BCRYPT_SALT_ROUNDS`.
- Validar al inicio que las variables críticas estén presentes en producción.
- CORS debe aceptar `Authorization` además de `Content-Type`; mantener lista de orígenes configurada por entorno.
- No agregar `credentials: true` salvo que se adopten cookies; el diseño actual usa Bearer token.
- Considerar límites de intentos de login/registro, mensajes que no faciliten enumeración de cuentas y validación de payloads.
- Nunca commitear `.env`, secretos, credenciales de Atlas ni tokens reales.

### Frontend

#### Contextos
- Crear `AuthContext` y `CartContext` con hooks de consumo claros.
- AuthContext: usuario, token, estado de inicialización/carga, login, registro, logout y restauración de sesión.
- Persistir JWT según el requisito académico y enviar siempre `Authorization: Bearer <token>` en las llamadas protegidas. Si se usa localStorage, documentar que un XSS puede robar el token y evitar insertar HTML no confiable.
- Al restaurar sesión, validar token consultando `GET /api/auth/me`; si es inválido/expirado, limpiar sesión.
- CartContext: mantener las operaciones actuales, validación visual de stock y persistencia local existente; evitar duplicar lógica entre App, Cart y componentes.
- Mantener API de props de componentes o migrarla de forma coherente y actualizar tests.

#### Rutas e interfaz
- Incorporar `/registro`, `/login`, `/perfil`, `/mis-pedidos`.
- Crear `ProtectedRoute` con estado de carga, redirección a login y retorno a la ruta solicitada después de autenticar.
- Navbar condicional: acceso a login/registro para visitantes; perfil, pedidos y logout para usuarios autenticados.
- La administración debe mostrarse sólo a admins y las operaciones API también deben estar protegidas.
- El checkout requiere sesión. Si un visitante intenta comprar, redirigir a login conservando la intención de volver al carrito.
- Enviar pedido con JWT. Mostrar confirmación y vaciar carrito sólo cuando el backend confirme la creación.
- Manejar loading, errores de validación, falta de stock, token vencido y fallos de red con mensajes en español.
- No mostrar pagos aprobados ni simular una pasarela.

## 5. Plan por fases

### Fase 0 — Preparación y línea base
- Confirmar rama y estado de trabajo limpio.
- Instalar dependencias en backend y client con lockfiles existentes.
- Ejecutar tests backend, tests frontend, lint y build.
- Registrar fallos preexistentes antes de implementar.
- Corregir documentación desactualizada separadamente de cambios funcionales.

### Fase 1 — Backend: autenticación
- Modelo User, validaciones, bcrypt, JWT.
- Controlador/rutas de registro, login y perfil actual.
- Middleware JWT y middleware de roles.
- Configuración de CORS y variables de entorno.
- Tests de registro, login, hash, duplicados, token inválido/expirado, usuario inexistente y permisos.

### Fase 2 — Backend: proteger administración
- Proteger escritura de productos y subida de imágenes.
- Mantener lecturas públicas.
- Definir y documentar procedimiento controlado para provisionar el primer admin; no permitir autoasignación de rol en registro.
- Tests de acceso anónimo (401), usuario customer (403), admin autorizado y regresión de CRUD.

### Fase 3 — Backend: pedidos
- Modelo Order, controlador y rutas.
- Recalcular precios y total en servidor.
- Validar stock y consistencia de inventario.
- Vincular pedido al usuario autenticado.
- Tests de creación, stock insuficiente, producto inexistente, payload manipulado, usuario aislado, pedido vacío, doble envío y consistencia ante error.

### Fase 4 — Frontend: estado y autenticación
- AuthContext, CartContext y hooks.
- Formularios registro/login y persistencia de sesión.
- ProtectedRoute y restauración de sesión.
- Navbar condicional y páginas perfil/mis-pedidos.
- Tests de contextos, navegación, persistencia, logout, carga y expiración.

### Fase 5 — Frontend: checkout e integración
- Sustituir compra demostrativa por POST real.
- Adjuntar Bearer token.
- Mantener carrito en errores; vaciarlo sólo con pedido confirmado.
- Actualizar stock/feedback cuando corresponda.
- Tests de checkout autenticado, visitante redirigido, pedido exitoso y fallido.

### Fase 6 — Regresión y auditoría
- Ejecutar suites completas backend/frontend, lint y build.
- Revisar seguridad de todas las rutas y control de roles.
- Revisar que ningún precio/userId del cliente sea confiable.
- Revisar CORS, manejo de errores, logs, variables y secretos.
- Comprobar que catálogo, imágenes GridFS y administración sigan funcionando.
- Actualizar README, AGENTS.md y ejemplos de entorno.

### Fase 7 — Despliegue
- Backend Render: root `backend`, build `npm ci`, start `npm start`.
- Frontend Vercel: root `client`, build `npm run build`, output `dist`.
- MongoDB Atlas: URI de producción y permisos de red.
- Configurar en Render `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV=production`, `CORS_ORIGINS`.
- Configurar en Vercel `VITE_API_BASE` con URL pública del backend.
- Validar health check, registro/login, persistencia, rutas protegidas, pedido y CORS.
- No guardar secretos en Vercel si no son necesarios para el cliente; nunca exponer `JWT_SECRET` como variable `VITE_*`.

## 6. Criterios de aceptación

- [ ] Registro crea usuarios con contraseña bcrypt, sin exponer hash ni permitir asignar rol.
- [ ] Login valida credenciales y emite JWT firmado con expiración.
- [ ] Sesión se restaura después de recargar y se invalida al expirar/fallar /me.
- [ ] Rutas privadas frontend redirigen a login y permiten volver al destino.
- [ ] API protegida devuelve 401 sin token y 403 sin rol suficiente.
- [ ] Las operaciones administrativas no pueden ejecutarse directamente por un customer.
- [ ] Navbar cambia según sesión y rol.
- [ ] Carrito global conserva las funciones y persistencia existentes.
- [ ] Checkout requiere autenticación y manda Bearer token.
- [ ] Backend obtiene usuario desde JWT, calcula precios y total desde MongoDB.
- [ ] Pedido queda persistido y asociado al usuario autenticado.
- [ ] Mis pedidos sólo devuelve pedidos del usuario actual.
- [ ] Stock no queda negativo y los errores no vacían el carrito.
- [ ] Carrito se vacía sólo después de crear pedido exitosamente.
- [ ] Render, Vercel y Atlas quedan configurados sin secretos en el repositorio.
- [ ] Tests, lint y build pasan; README y AGENTS describen la realidad.

## 7. Riesgos y decisiones que deben resolverse

1. **Primer administrador:** la consigna no define cómo crear una cuenta admin. Recomendación: script controlado de promoción por email o procedimiento manual seguro en Atlas, nunca un campo role libre en registro.
2. **Persistencia JWT:** localStorage satisface el requisito académico de persistencia y Bearer header, pero tiene riesgo XSS. No guardar tokens en código, logs ni almacenamiento compartido.
3. **Transacciones y tests:** las transacciones MongoDB requieren replica set. Alinear MongoMemoryReplSet y Atlas para probar consistencia.
4. **Stock:** validar en servidor y actualizar de forma atómica; la validación actual del frontend no es suficiente.
5. **Despliegue existente:** verificar los dominios y variables actuales antes de modificarlos; no reemplazar producción durante el desarrollo.
6. **Pagos:** no están definidos; el pedido registra intención/compra académica, no cobra dinero.

## 8. Entregables de documentación
- Este plan: `docs/SPRINT-8-PLAN.md`.
- Instrucciones operativas para OpenCode: `docs/OPENCODE.md`.
- Actualizar `AGENTS.md` y `README.md` al completar cada fase y al cerrar Sprint 8.
