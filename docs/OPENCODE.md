# Instrucciones para OpenCode — Sprint 8

## Lectura obligatoria antes de editar
1. Leer `AGENTS.md` completo.
2. Leer `docs/SPRINT-8-PLAN.md` completo.
3. Revisar los archivos implicados y sus tests actuales antes de proponer cambios.
4. Verificar la línea base real con los scripts de `backend/package.json` y `client/package.json`. No asumir que el README/AGENTS están actualizados si contradicen los scripts o el árbol.

## Restricción obligatoria: modelo Product y base de datos

Antes de modificar cualquier modelo, inspeccioná cómo está implementado actualmente y cómo se utiliza en el resto del proyecto.

El modelo Product de los sprints 5 y 6 tiene esta estructura:

```js
{
  nombre: String,       // required
  descripcion: String,
  precio: Number,       // required
  stock: Number,
  imagenUrl: String
}
```

Debés respetar esta estructura:

- Mantener los nombres y tipos originales.
- No traducir los campos al inglés.
- No crear modelos de productos duplicados.
- No agregar campos obligatorios que puedan generar incompatibilidades.
- No modificar el esquema sin justificar técnicamente el cambio y consultar previamente.

### Estado de la base de datos

La aplicación utiliza una nueva base de MongoDB Atlas llamada `muebleria`, actualmente vacía.

Por lo tanto:

- No asumir que existen productos ni documentos de los sprints anteriores.
- No intentar recuperar datos que no están disponibles.
- Definir los modelos necesarios en Mongoose.
- No crear colecciones manualmente desde Atlas: MongoDB las generará al insertar documentos.
- Si hacen falta productos de prueba, proponer un seed de desarrollo separado y claramente identificado.
- No cargar datos ficticios en producción.
- No modificar ni mostrar credenciales almacenadas en `.env`.
- Mantener `.env` excluido de Git y utilizar `.env.example` para documentar las variables necesarias.

Antes de comenzar la implementación, informar si el modelo Product existente necesita alguna adaptación. No realizar cambios incompatibles sin autorización.

## Rol y límites
Actuá como implementador. El usuario utiliza ChatGPT como auditor independiente. No declares una tarea terminada por haber escrito código: ejecutá pruebas y reportá resultados reales.

- No hagas cambios funcionales hasta recibir una instrucción explícita para comenzar la implementación.
- No despliegues, no modifiques secretos/variables remotas, no cambies servicios de Render/Vercel/Atlas y no hagas push/merge sin autorización explícita.
- No sobrescribas trabajo ajeno ni hagas reset/rebase destructivo.
- No introduzcas dependencias sin justificar su necesidad y actualizar el lockfile con npm.
- No cambies estilos, textos ni arquitectura existente si no es necesario para el requisito.
- No rompas compatibilidad con productos existentes, IDs MongoDB ni rutas actuales.
- No confíes en datos del cliente para userId, rol, precio, total o stock.
- Nunca permitas que el registro público asigne rol admin.
- No devuelvas ni registres hashes, contraseñas, JWT ni secretos.
- No agregues archivos .env, tokens, URI de base real ni secretos al control de versiones.

## Protocolo por tarea
1. Resumir objetivo y archivos que probablemente cambien.
2. Inspeccionar dependencias, llamadas, contratos y pruebas relacionadas.
3. Proponer implementación mínima y riesgos antes de tocar archivos.
4. Implementar en cambios pequeños y coherentes.
5. Agregar/actualizar tests automatizados para el comportamiento nuevo y regresiones.
6. Ejecutar los comandos correspondientes desde la carpeta correcta.
7. Revisar diff completo buscando cambios accidentales, secretos, código muerto y errores.
8. Informar archivos modificados, decisiones, pruebas ejecutadas con resultado exacto, limitaciones y pendientes.

## Comandos del repositorio
Backend (desde `backend/`):
- `npm ci`
- `npm test -- --runInBand` si el script acepta argumentos; en caso contrario `npm test`
- `npm start` sólo para prueba local cuando exista configuración segura.

Frontend (desde `client/`):
- `npm ci`
- `npm test`
- `npm run lint`
- `npm run build`

No conectar tests a MongoDB Atlas ni a una base de datos de producción. Usar MongoDB Memory Server; si se prueban transacciones, configurar MongoMemoryReplSet.

## Reglas específicas de autenticación
- Hash de contraseñas con bcrypt antes de persistir.
- JWT firmado con secreto sólo del backend y expiración explícita.
- Middleware debe validar esquema Bearer, firma, expiración y usuario existente.
- 401 para ausencia/token inválido; 403 para usuario autenticado sin permisos.
- Seleccionar/excluir passwordHash al consultar y serializar usuarios.
- Validar email y contraseña en servidor; manejar duplicados de forma controlada.
- Añadir Authorization a CORS.
- Proteger endpoints, no solamente componentes React.

## Reglas específicas de pedidos
- El userId proviene exclusivamente de la identidad autenticada.
- El cliente manda IDs y cantidades; servidor carga productos, verifica stock y calcula precio/total.
- Guardar snapshot de producto/precio en el pedido.
- Asegurar consistencia de stock y pedido ante concurrencia/fallos; preferir transacción MongoDB.
- Historial filtrado por usuario autenticado.
- No vaciar carrito del cliente si POST falla.
- No simular pagos ni afirmar que hubo cobro.

## Reglas específicas de React
- AuthContext y CartContext separados, con hooks de consumo.
- Estado de restauración de sesión para evitar mostrar rutas privadas antes de validar /me.
- ProtectedRoute conserva el destino al redirigir al login.
- Los errores de autenticación y checkout deben tener feedback accesible y en español.
- Token Bearer agregado sólo a llamadas protegidas; no enviar JWT a recursos públicos innecesariamente.
- Logout limpia estado y almacenamiento de sesión.
- Carrito se limpia sólo tras respuesta exitosa del pedido.

## Formato del reporte final
- Resumen del cambio.
- Archivos creados/modificados.
- Decisiones técnicas relevantes.
- Comandos ejecutados y resultado real (incluyendo tests que fallaron).
- Riesgos, limitaciones y tareas no realizadas.
- No afirmar despliegue, pruebas manuales ni éxito de integración que no se haya verificado.
