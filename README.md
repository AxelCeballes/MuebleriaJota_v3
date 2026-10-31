# Configurar el backend en Render

Esta guía configura la API Express de Mueblería Jota y la conecta con MongoDB. La API guarda los productos en MongoDB y almacena las imágenes en GridFS.

## Crear o actualizar el servicio

En Render, abrí el servicio web conectado a este repositorio o creá uno nuevo:

1. Seleccioná el repositorio `MuebleriaJota_v3` y la rama que querés desplegar. Para probar una rama secundaria, el servicio debe estar conectado a esa rama; un servicio conectado a `main` no despliega automáticamente los cambios de otras ramas.
2. Elegí **Node** como runtime.
3. Configurá **Root Directory** como `backend`.
4. Usá estos comandos:
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
5. En **Settings → Build & Deploy**, habilitá **Auto-Deploy: On Commit** si querés que Render despliegue cada push a la rama seleccionada.

## Variables de entorno

En el servicio de Render, abrí **Environment** y agregá:

| Variable | Valor |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | URI de conexión de MongoDB Atlas para la base del proyecto. Guardala como variable secreta; no la subas a Git. |
| `ADMIN_PASSWORD` | Contraseña de administrador de al menos 12 caracteres. |
| `JWT_SECRET` | Secreto aleatorio de al menos 32 caracteres para firmar sesiones. |
| `CORS_ORIGINS` | Dominio exacto del frontend de Vercel, sin barra final. Se pueden separar varios orígenes con comas. |

Render asigna `PORT` automáticamente; no hace falta definirlo a mano.

Para este despliegue, el frontend público es `https://muebleria-jota-v3.vercel.app`, así que `CORS_ORIGINS` puede configurarse como:

```text
https://muebleria-jota-v3.vercel.app
```

`ADMIN_PASSWORD` y `JWT_SECRET` deben ser distintos. Generá el secreto con un gestor de contraseñas o localmente con Node:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

MongoDB Atlas debe permitir conexiones desde Render y el usuario de base de datos necesita permisos de lectura y escritura en la base usada por la aplicación. GridFS crea el bucket `imagenesProductos` dentro de esa misma base; no requiere un disco persistente de Render.

## Conectar el frontend de Vercel

En Vercel, abrí el proyecto del cliente y agregá `VITE_API_BASE` con la URL pública del servicio Render, sin barra final. Por ejemplo:

```text
https://muebleriajota-v3.onrender.com
```

Después de cambiar una variable `VITE_*`, ejecutá un nuevo deployment de Vercel. Si usás previews de ramas, agregá también el dominio de preview a `CORS_ORIGINS` o probá desde el dominio de producción.

## Verificar el despliegue

1. Esperá que el deployment de Render termine correctamente y revisá sus logs.
2. Abrí `https://<servicio>.onrender.com/api/health`. La respuesta esperada contiene `"status": "ok"` y `"mongodb": "connected"`.
3. Desde `/admin/crear-producto` en el frontend, iniciá sesión con `ADMIN_PASSWORD`.
4. Probá crear un producto y subir una imagen JPG, PNG o WebP de hasta 3 MB. La carga de imagen debe responder `201` y devolver `imagenUrl`.

El endpoint de login es `POST /api/admin/login`. El token de sesión dura ocho horas y se requiere para crear, editar o borrar productos y para subir imágenes. Las lecturas del catálogo y de imágenes son públicas.
