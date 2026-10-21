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
   PORT=4000                                # opcional, 4000 por defecto
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

Los errores siempre devuelven JSON con un campo `error`: `400` (datos no válidos), `404` (ruta no encontrada) o `500` (error interno, sin detalles para el cliente).

## Archivos

- `src/server.ts`: arranca el servidor y lo cierra ordenadamente (Ctrl+C).
- `src/app.ts`: crea la aplicación Express y registra middlewares y rutas.
- `src/config/env.ts`: valida las variables de entorno con Zod; si falta alguna, el servidor no arranca.
- `src/lib/prisma.ts`: única conexión a la base, con el adaptador `@prisma/adapter-pg`.
- `src/lib/http-error.ts`: `HttpError`, para lanzar errores con código HTTP desde cualquier ruta.
- `src/middleware/error-handler.ts`: convierte cualquier error en una respuesta JSON.
- `src/modules/`: una carpeta por funcionalidad.
- `prisma/schema.prisma`: definición de las tablas.
- `prisma/migrations/`: historial de cambios en la base, en SQL. Nunca se editan una vez aplicadas.
- `prisma.config.ts`: configuración de la CLI de Prisma (dónde está el esquema y qué `.env` cargar).
