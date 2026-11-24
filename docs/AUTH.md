# Autenticación — Fase 1

Implementación backend de usuarios, autenticación JWT y autorización por roles. No incluye todavía la protección de las rutas de productos e imágenes ni los pedidos (fases 2 y 3).

## Variables de entorno

Agregar al `.env` del backend (nunca commitear el archivo):

| Variable | Obligatoria | Valor por defecto | Descripción |
|---|---|---|---|
| `JWT_SECRET` | Sí | — | Secreto para firmar y verificar JWT. La aplicación no inicia si falta o está vacío. |
| `JWT_EXPIRES_IN` | No | `1d` | Vigencia del token. Se convierte a segundos antes de firmar. Unidades en minúscula: `s`, `m`, `h`, `d`, `w`, `y`; también se acepta un número entero de segundos (`3600`). |
| `BCRYPT_SALT_ROUNDS` | No | `12` | Rondas de bcrypt. Valores admitidos: 10 a 15. |

Generar un secreto local:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Endpoints

Base: `/api/auth`

### `POST /api/auth/register`

```json
{
  "nombre": "Ana Pérez",
  "email": "ana@example.com",
  "password": "secreto123"
}
```

- Normaliza el email a minúsculas y sin espacios.
- Hashea la contraseña con bcrypt.
- Ignora cualquier `rol` enviado: el registro público siempre crea `customer`.
- Respuesta `201`:

```json
{
  "usuario": {
    "id": "650000000000000000000000",
    "nombre": "Ana Pérez",
    "email": "ana@example.com",
    "rol": "customer"
  },
  "token": "<jwt>"
}
```

Errores: `400` datos inválidos (con `errors`), `409` email ya registrado.

### `POST /api/auth/login`

```json
{
  "email": "ana@example.com",
  "password": "secreto123"
}
```

- Respuesta `200` con `usuario` y `token`.
- Credenciales incorrectas o usuario inexistente: `401` con el mismo mensaje genérico.
- Datos faltantes o email inválido: `400`.
- La contraseña no puede superar los 72 bytes de bcrypt, igual que en el registro: `400`.

### `GET /api/auth/me`

Requiere `Authorization: Bearer <token>`.

- Respuesta `200` con `usuario`.
- Sin token, token inválido, token expirado o usuario inexistente: `401`.

El JWT contiene sólo `sub` (id del usuario) y `rol`. No incluye email, nombre ni hash de contraseña.

## Middlewares

`backend/middleware/auth.js`:

- `requireAuth`: valida el esquema `Bearer`, la firma, la expiración y que el usuario exista. Carga `request.user` con `{ id, nombre, email, rol }`.
- `requireRole('admin')`: exige un usuario autenticado con alguno de los roles indicados. Devuelve `403` si el rol no alcanza.

Uso previsto en fases siguientes:

```js
router.post('/', requireAuth, requireRole('admin'), createProduct);
```

## Rutas administrativas protegidas (Fase 2)

| Método | Ruta | Acceso |
|---|---|---|
| `GET` | `/api/productos` y `/api/productos/:id` | Público |
| `POST`, `PUT`, `DELETE` | `/api/productos` | Sólo admin |
| `POST` | `/api/imagenes` | Sólo admin |
| `GET` | `/api/imagenes/:id` | Público |

Las rutas protegidas requieren `Authorization: Bearer <token>`. Devuelven `401` sin token o con token inválido/expirado, y `403` si el usuario autenticado no es admin.

La interfaz de administración actual todavía no envía el token; se adaptará en la fase de frontend. Hasta entonces, sus operaciones de escritura recibirán `401`.

## Primer administrador

No existe endpoint público para cambiar roles. Para promover un usuario existente:

```sh
cd backend
node scripts/promoteAdmin.js ana@example.com
```

El script:

- Carga las variables desde `backend/.env`.
- Busca el usuario por email normalizado.
- Falla si el usuario no existe (no lo crea).
- Asigna `rol: "admin"` sólo si el usuario existe y no es admin.
- Requiere ejecución manual con acceso al entorno del backend.

## Pruebas

```sh
cd backend
npm test
```

Las pruebas usan Jest, Supertest y MongoDB Memory Server; no se conectan a Atlas ni a una base real. Cubren registro, login, hash de contraseña, email duplicado, token válido/inválido/expirado, usuario inexistente, autorización por roles, límite de 72 bytes en registro y login, compatibilidad de los formatos de `JWT_EXPIRES_IN` con `jsonwebtoken`, protección de escritura de productos y de subida de imágenes (`401` anónimo, `403` customer, admin autorizado).
