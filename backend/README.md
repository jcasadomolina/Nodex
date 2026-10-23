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
   APP_URL="http://localhost:4000"          # URL pública que ve el navegador
   GOOGLE_CLIENT_ID="..."                   # opcionales: sin ellas, el login con Google
   GOOGLE_CLIENT_SECRET="..."               #   o GitHub responde 503
   GITHUB_CLIENT_ID="..."
   GITHUB_CLIENT_SECRET="..."
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
| `GET /api/me` | `200 { user }` con el perfil y `providers` (cuentas vinculadas: `google`, `github`) |
| `PATCH /api/me` | Body `{ name }`. `200 { user }` |
| `PUT /api/me/avatar` | Formulario `multipart/form-data` con el campo `avatar` (JPG, PNG, WebP o GIF, máx. 5 MB). `200 { user }`. `413` si pesa demasiado, `502` si Cloudinary falla, `503` si no está configurado |
| `DELETE /api/me/avatar` | `200 { user }` con `avatarUrl: null` |
| `DELETE /api/me/providers/:provider` | `204`. Desvincula `google` o `github`. `409` si es el único método de inicio de sesión |
| `GET /api/suggestions` | `200 { suggestions }`: sugerencias de la IA pendientes, con el Nodex y el grupo propuesto |
| `POST /api/suggestions/refresh` | Calcula los vectores que falten y revisa todos los huérfanos. `200 { reviewed, pending }` |
| `POST /api/suggestions/:id/accept` | `204`. Mete el Nodex en el grupo sugerido |
| `POST /api/suggestions/:id/reject` | `204`. Descarta la sugerencia; ese grupo no se vuelve a proponer para ese Nodex |
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
| `GET /api/nodexs` | `200 { nodexs, nextCursor }`. Filtros: `groupId`, `orphan=true`, `type=note\|link`, `priority=low\|medium\|high\|urgent`, `limit` (1–100, 50 por defecto) y `cursor`. Orden: `sort=recent` (por defecto) o `sort=priority` (más prioritarios primero; sin prioridad al final) |
| `POST /api/nodexs` | Body `{ type, title, content?, url?, priority?, groupIds? }`. `201 { nodex }`. Los enlaces necesitan `url` (`http` o `https`) |
| `GET /api/nodexs/:id` | `200 { nodex }` |
| `PATCH /api/nodexs/:id` | Body `{ title?, content?, url?, priority? }` (`priority: null` la quita). `200 { nodex }` |
| `DELETE /api/nodexs/:id` | `204`. Lo envía a la papelera |
| `GET /api/board` | `200 { groups, nodexs, orphanIds }`: todo lo necesario para dibujar el panel central. Cada grupo trae `nodexIds` |
| `PUT /api/tasks/:nodexId` | Body `{ status?, dueAt? }`. Convierte el Nodex en tarea (`201`) o la actualiza (`200`). `status`: `todo`, `doing` o `done`; `dueAt`: fecha ISO con zona horaria o `null` |
| `DELETE /api/tasks/:nodexId` | `204`. Quita la personalidad de tarea; el Nodex sigue existiendo |
| `GET /api/tasks/board` | `200 { columns: { todo, doing, done } }`: el tablero, cada columna ordenada |
| `POST /api/tasks/:nodexId/move` | Body `{ status, index }`. Mueve la tarea a esa columna y posición (empezando en 0). `200 { task }` |
| `GET /api/tasks/calendar` | `?from=&to=` (fechas ISO, máximo 100 días). `200 { tasks }` con fecha límite en ese rango |

Cada `nodex` incluye `groupIds`: los grupos (no borrados) en los que está. Un grupo o Nodex de otro usuario, o un ID con formato incorrecto, responde `404`.

Cada `nodex` incluye también `task` (`{ status, dueAt, completedAt }`) si es una tarea, o `null` si no lo es.

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
