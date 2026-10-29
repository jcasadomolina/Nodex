# Backend

API de Nodex en Express.js (Node.js) y TypeScript, con PostgreSQL en Neon y Prisma.

Diseño de la base de datos: [docs/08-base-de-datos.md](../docs/08-base-de-datos.md).

## Puesta en marcha

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Crea un `.env` en la **raíz del repositorio** (no en `backend/`) con las dos cadenas de conexión de Neon. Pon `sslmode=verify-full` al final de cada una: comprueba el certificado del servidor y evita un aviso de seguridad del driver de PostgreSQL.

   ```
   DATABASE_URL="...?sslmode=verify-full"   # con pooling (host con "-pooler"): la usa la aplicación
   DIRECT_URL="...?sslmode=verify-full"     # directa: la usan las migraciones
   SESSION_SECRET="..."                     # mínimo 32 caracteres aleatorios
   PORT=4000                                # opcional, 4000 por defecto
   APP_URL="http://localhost:3000"          # URL pública que ve el navegador (la del frontend)
   GOOGLE_CLIENT_ID="..."                   # opcionales: sin ellas, el login con Google
   GOOGLE_CLIENT_SECRET="..."               #   o GitHub responde 503
   GITHUB_CLIENT_ID="..."
   GITHUB_CLIENT_SECRET="..."
   CLOUDINARY_URL="cloudinary://..."        # opcional: sin ella, subir foto responde 503
   VAPID_PUBLIC_KEY="..."                   # opcionales: claves para las notificaciones push.
   VAPID_PRIVATE_KEY="..."                  #   Se generan con: npm run push:keys
   VAPID_SUBJECT="mailto:tu-email@..."      #   Contacto para los servicios push
   ```

   Cómo conseguir las credenciales de Google y GitHub: [docs/06-sistema-backend.md](../docs/06-sistema-backend.md#registrar-nodex-en-google-y-github).

   Tienes la plantilla en [`.env.example`](../.env.example). Para generar un `SESSION_SECRET` seguro:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

3. Aplica las migraciones y genera el cliente de Prisma:

   ```bash
   npm run db:deploy
   npm run db:generate
   ```

4. Arranca el servidor en modo desarrollo y comprueba que responde en http://localhost:4000/api/health:

   ```bash
   npm run dev
   ```

## Scripts

| Script | Qué hace |
|--------|----------|
| `npm run dev` | Arranca el servidor con tsx y lo reinicia al guardar cambios |
| `npm run build` | Compila TypeScript a JavaScript en `dist/` |
| `npm start` | Arranca la versión compilada (producción) |
| `npm run typecheck` | Comprueba los tipos sin generar archivos |
| `npm run ai:backfill` | Calcula el vector de IA de los Nodexs que no lo tengan (antiguos o con error) |
| `npm run push:keys` | Genera un par de claves VAPID para las notificaciones push (se hace una sola vez) |

La primera vez que se usa la IA, el modelo (118 MB) se descarga en `.cache/models`, que no se sube a Git.

En local, el `.env` se carga con la opción `--env-file-if-exists` de Node. En producción no hay archivo: el alojamiento define las variables directamente.

## Scripts de base de datos

| Script | Qué hace |
|--------|----------|
| `npm run db:generate` | Genera el cliente TypeScript de Prisma en `generated/prisma` (no se sube a Git) |
| `npm run db:migrate` | En desarrollo: crea una migración nueva a partir de los cambios en `schema.prisma` y la aplica |
| `npm run db:deploy` | Aplica las migraciones pendientes, sin crear ninguna (producción) |
| `npm run db:studio` | Abre Prisma Studio, un panel web para ver y editar los datos |

## Endpoints

| Método y ruta | Respuesta |
|---------------|-----------|
| `GET /api/health` | `200 {"status":"ok","database":"ok"}`, o `503` si la base no responde (el servidor sigue en pie) |
| `POST /api/auth/register` | Body `{ name, email, password }`. `201 { user }` e inicia sesión. `409` si el email ya existe |
| `POST /api/auth/login` | Body `{ email, password }`. `200 { user }` e inicia sesión. `401` si las credenciales no son válidas |
| `POST /api/auth/logout` | `204`. Cierra la sesión y borra la cookie |
| `GET /api/auth/me` | `200 { user }` con el usuario de la sesión, o `401` |
| `GET /api/me` | `200 { user }` con el perfil, `hasPassword` (si tiene contraseña) y `providers` (cuentas vinculadas: `google`, `github`) |
| `PATCH /api/me` | Body `{ name }`. `200 { user }` |
| `PUT /api/me/avatar` | Formulario `multipart/form-data` con el campo `avatar` (JPG, PNG, WebP o GIF, máx. 5 MB). `200 { user }`. `413` si pesa demasiado, `502` si Cloudinary falla, `503` si no está configurado |
| `DELETE /api/me/avatar` | `200 { user }` con `avatarUrl: null` |
| `DELETE /api/me/providers/:provider` | `204`. Desvincula `google` o `github`. `409` si es el único método de inicio de sesión |
| `GET /api/suggestions` | `200 { suggestions, newGroups }`: sugerencias de la IA pendientes (Nodex → grupo existente) y propuestas de grupos nuevos (`{ name, nodexs }`) |
| `POST /api/suggestions/refresh` | Calcula los vectores que falten y revisa todos los huérfanos y recalcula las propuestas de grupos nuevos. `200 { reviewed, pending, newGroups }` |
| `POST /api/suggestions/new-groups/accept` | Body `{ name, groupName }`. `201 { group }`: crea el grupo y mete los Nodexs de la propuesta que siguen huérfanos. `409` si ya existe un grupo con ese nombre |
| `POST /api/suggestions/new-groups/reject` | Body `{ name }`. `204`. Esos Nodexs no vuelven a salir en propuestas de grupo nuevo |
| `POST /api/suggestions/:id/accept` | `204`. Mete el Nodex en el grupo sugerido |
| `POST /api/suggestions/:id/reject` | `204`. Descarta la sugerencia; ese grupo no se vuelve a proponer para ese Nodex. La búsqueda de otro grupo sigue en segundo plano |
| `PUT /api/me/tutorial` | Body `{ version }` (entero ≥ 1). `200 { tutorialCompletedVersion }`. Marca qué versión del tutorial ha visto el usuario |
| `GET /api/auth/google` · `GET /api/auth/github` | Redirige al login del proveedor. `503` si no está configurado |
| `GET /api/auth/google/callback` · `GET /api/auth/github/callback` | El proveedor vuelve aquí. Inicia sesión y redirige a `APP_URL`, o a `APP_URL/login?error=<proveedor>` si falla |
| `GET /api/auth/google/link` · `GET /api/auth/github/link` | Requiere sesión. Vincula esa cuenta al usuario actual y redirige a `APP_URL/perfil?linked=<proveedor>`, o a `APP_URL/perfil?error=<proveedor>` si no se puede |

### Grupos, Nodexs y panel (requieren sesión)

| Método y ruta | Respuesta |
|---------------|-----------|
| `GET /api/groups` | `200 { groups }`, cada uno con `nodexCount` |
| `POST /api/groups` | Body `{ name, description? }`. `201 { group }`. `409` si ya tienes un grupo con ese nombre |
| `PATCH /api/groups/:id` | Body `{ name?, description? }`. `200 { group }` |
| `DELETE /api/groups/:id` | `204`. Lo envía a la papelera; sus Nodexs no se borran |
| `POST /api/groups/:id/nodexs` | Body `{ nodexId }`. `204`. Si ya estaba en el grupo, no hace nada |
| `DELETE /api/groups/:id/nodexs/:nodexId` | `204`. Saca el Nodex del grupo |
| `GET /api/nodexs` | `200 { nodexs, nextCursor }`. Filtros: `groupId`, `orphan=true`, `type=note\|link`, `priority=low\|medium\|high\|urgent`, `readLater=true` (enlaces para leer más tarde, del más antiguo al más nuevo), `limit` (1–100, 50 por defecto) y `cursor`. Orden: `sort=recent` (por defecto) o `sort=priority` (más prioritarios primero; sin prioridad al final) |
| `POST /api/nodexs` | Body `{ type, title, content?, url?, priority?, groupIds?, tags?, readLater? }`. `readLater` solo se aplica a enlaces. `tags`: hasta 10; se normalizan (minúsculas, espacios a guiones, sin `#`, máximo 30 caracteres). `201 { nodex, duplicates }`. Los enlaces necesitan `url` (`http` o `https`). `duplicates`: Nodexs casi iguales ya guardados (misma URL o similitud ≥ 0,9), cada uno con `similarity`; el Nodex se crea igualmente |
| `GET /api/nodexs/search` | `?q=` (1–200 caracteres) y `limit` (1–50, 20 por defecto). `200 { nodexs }` ordenados por `score`: mezcla el parecido de significado con la coincidencia de texto en título, contenido o URL |
| `GET /api/nodexs/read-later/count` | `200 { count }`: enlaces marcados para leer más tarde |
| `GET /api/nodexs/rediscover` | `200 { nodexs }`: hasta 3 Nodexs sin abrir desde hace 30 días (sin prioridad alta ni urgente), primero los parecidos a lo abierto en los últimos 7 días. La parte de azar cambia una vez al día (hora de España); la preferencia se actualiza con lo que abres |
| `POST /api/nodexs/:id/open` | `204`. Marca el Nodex como abierto ahora (no cambia `updatedAt`) |
| `GET /api/nodexs/:id` | `200 { nodex }` |
| `GET /api/nodexs/:id/related` | `?limit=` (1–20, 5 por defecto). `200 { nodexs }`: los más parecidos (similitud ≥ 0,45), cada uno con `similarity` |
| `PATCH /api/nodexs/:id` | Body `{ title?, content?, url?, priority?, tags?, readLater? }` (`priority: null` la quita; `tags` sustituye todas las etiquetas; `readLater: true` marca un enlace para leer más tarde sin cambiar la fecha si ya lo estaba, y `false` lo quita). `200 { nodex }` |
| `GET /api/tags` | `200 { tags }`: las etiquetas en uso, cada una con `nodexCount`, por orden alfabético |
| `DELETE /api/nodexs/:id` | `204`. Lo envía a la papelera |
| `GET /api/board` | `200 { groups, nodexs, orphanIds }`: todo lo necesario para dibujar el panel central. Cada grupo trae `nodexIds` |
| `GET /api/board/related` | `200 { pairs }`: pares `{ a, b, similarity }` de Nodexs relacionados para el grafo (los 3 más parecidos de cada uno, con similitud ≥ 0,45, sin repetir el par) |
| `PUT /api/tasks/:nodexId` | Body `{ status?, dueAt? }`. Convierte el Nodex en tarea (`201`) o la actualiza (`200`). `status`: `todo`, `doing` o `done`; `dueAt`: fecha ISO con zona horaria o `null` |
| `DELETE /api/tasks/:nodexId` | `204`. Quita la personalidad de tarea; el Nodex sigue existiendo |
| `GET /api/tasks/board` | `200 { columns: { todo, doing, done } }`: el tablero, cada columna ordenada |
| `POST /api/tasks/:nodexId/move` | Body `{ status, index }`. Mueve la tarea a esa columna y posición (empezando en 0). `200 { task }` |
| `GET /api/tasks/calendar` | `?from=&to=` (fechas ISO, máximo 100 días). `200 { tasks }` con fecha límite en ese rango |
| `PUT /api/reminders/:nodexId` | Body `{ remindAt }` (fecha ISO futura). Programa o reprograma el recordatorio. `200 { reminder }` |
| `DELETE /api/reminders/:nodexId` | `204`. Quita el recordatorio |
| `GET /api/reminders` | `?status=upcoming` (por defecto: los que aún no han llegado) o `?status=due` (los que ya han llegado y no se han descartado, para el aviso dentro de la app) |
| `POST /api/reminders/:nodexId/dismiss` | `204`. Marca como visto un recordatorio que ya ha llegado |
| `GET /api/push/public-key` | `200 { publicKey }`: la clave VAPID pública que necesita el navegador para suscribirse. `503` si push no está configurado |
| `POST /api/push/subscriptions` | Body: la suscripción del navegador (`{ endpoint, keys: { p256dh, auth } }`). `204` |
| `DELETE /api/push/subscriptions` | Body `{ endpoint }`. `204`. Deja de enviar notificaciones a ese dispositivo |
| `GET /api/links/broken` | `200 { links }`: enlaces rotos del usuario, con la copia de archive.org si existe |
| `POST /api/links/:nodexId/refresh` | Vuelve a comprobar el enlace ahora. `200 { preview }`. Máximo 10 por minuto |
| `GET /api/trash` | `200 { nodexs, groups }`: Nodexs y grupos borrados (papelera), del más reciente al más antiguo. Los grupos incluyen `nodexCount` |
| `POST /api/trash/nodexs/:id/restore` | `204`. Restaura el Nodex con sus grupos, etiquetas, tarea y recordatorio |
| `POST /api/trash/groups/:id/restore` | `200 { group }`. Si el nombre ya está en uso, se restaura como «Nombre (restaurado)», «(restaurado 2)»… |
| `DELETE /api/trash/nodexs/:id`, `DELETE /api/trash/groups/:id` | `204`. Elimina para siempre uno que esté en la papelera |
| `DELETE /api/trash` | `200 { nodexs, groups }`: vacía la papelera y dice cuántos se han eliminado. Además, cada hora se elimina para siempre lo que lleve más de 30 días en la papelera |

Cada `nodex` incluye `groupIds`: los grupos (no borrados) en los que está, y `tags`: sus etiquetas, por orden alfabético. Un grupo o Nodex de otro usuario, o un ID con formato incorrecto, responde `404`.

Cada `nodex` incluye también `task` (`{ status, dueAt, completedAt }`) si es una tarea, y `reminder` (`{ remindAt, sentAt, dismissedAt }`) si tiene recordatorio, y `linkPreview` (`{ status, title, description, imageUrl, siteName, archiveUrl, lastCheckedAt }`) si tiene URL; `null` en caso contrario.

`user` siempre tiene la forma `{ id, name, email, avatarUrl, tutorialCompletedVersion }`; nunca incluye la contraseña. `register` y `login` admiten 10 intentos cada 15 minutos por IP; a partir de ahí responden `429`.

Los errores siempre devuelven JSON con un campo `error`: `400` (datos no válidos), `401` (sin sesión o credenciales incorrectas), `404` (ruta no encontrada), `409` (conflicto), `429` (demasiados intentos) o `500` (error interno, sin detalles para el cliente).

## Archivos

- `src/server.ts`: arranca el servidor y lo cierra ordenadamente (Ctrl+C).
- `src/app.ts`: crea la aplicación Express y registra middlewares y rutas.
- `src/config/env.ts`: valida las variables de entorno con Zod; si falta alguna, el servidor no arranca.
- `src/lib/prisma.ts`: única conexión a la base, con el adaptador `@prisma/adapter-pg`.
- `src/lib/http-error.ts`: `HttpError`, para lanzar errores con código HTTP desde cualquier ruta.
- `src/lib/session.ts`: configuración de las sesiones y la cookie `nodex.sid`.
- `src/middleware/error-handler.ts`: convierte cualquier error en una respuesta JSON.
- `src/middleware/require-auth.ts`: corta con `401` las peticiones sin sesión.
- `src/types/express-session.d.ts`: le dice a TypeScript que la sesión guarda `userId`.
- `src/types/passport.d.ts`: le dice a TypeScript que `req.user` tiene `id`.
- `src/modules/auth/oauth.routes.ts`: login con Google y GitHub (Passport).
- `src/modules/groups/`, `src/modules/nodexs/`, `src/modules/board/`: grupos, Nodexs y panel central.
- `src/modules/me/`: datos del propio usuario (por ahora, el tutorial).
- `src/modules/tasks/`: personalidad tarea: tablero, calendario y movimientos.
- `src/modules/reminders/`: recordatorios y el proceso que envía los avisos cada minuto (`reminders.worker.ts`).
- `src/modules/push/`, `src/lib/push.ts`: suscripciones y envío de notificaciones push.
- `src/modules/links/`: vista previa de enlaces, comprobación periódica (`links.worker.ts`) y copias de archive.org.
- `src/lib/safe-fetch.ts`: descarga páginas de forma segura (protección contra SSRF). `src/lib/html-meta.ts`: extrae título, descripción e imagen.
- `src/lib/params.ts`: `parseId`, que convierte un ID mal formado en un `404`.
- `src/lib/embeddings.ts`: carga el modelo de IA y convierte texto en vectores.
- `src/modules/ai/`: cálculo de vectores, sugerencias de grupo y sus endpoints.
- `src/scripts/ai-backfill.ts`: script de `npm run ai:backfill`.
- `src/lib/storage.ts`: subida y borrado de fotos en Cloudinary. Es el único archivo que conoce Cloudinary.
- `src/lib/db-errors.ts`: `isUniqueViolation`, para detectar valores duplicados (código `P2002` de Prisma).
- `src/modules/`: una carpeta por funcionalidad.
- `prisma/schema.prisma`: definición de las tablas.
- `prisma/migrations/`: historial de cambios en la base, en SQL. Nunca se editan una vez aplicadas.
- `prisma.config.ts`: configuración de la CLI de Prisma (dónde está el esquema y qué `.env` cargar).
