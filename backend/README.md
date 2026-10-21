# Backend

API de Nodex en Express.js (Node.js) y TypeScript, con PostgreSQL en Neon y Prisma.

Diseño de la base de datos: [docs/08-base-de-datos.md](../docs/08-base-de-datos.md).

## Puesta en marcha

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Crea un `.env` en la **raíz del repositorio** (no en `backend/`) con las dos cadenas de conexión de Neon:

   ```
   DATABASE_URL="..."   # con pooling (host con "-pooler"): la usa la aplicación
   DIRECT_URL="..."     # directa: la usan las migraciones
   ```

3. Aplica las migraciones y genera el cliente de Prisma:

   ```bash
   npm run db:deploy
   npm run db:generate
   ```

## Scripts de base de datos

| Script | Qué hace |
|--------|----------|
| `npm run db:generate` | Genera el cliente TypeScript de Prisma en `generated/prisma` (no se sube a Git) |
| `npm run db:migrate` | En desarrollo: crea una migración nueva a partir de los cambios en `schema.prisma` y la aplica |
| `npm run db:deploy` | Aplica las migraciones pendientes, sin crear ninguna (producción) |
| `npm run db:studio` | Abre Prisma Studio, un panel web para ver y editar los datos |

## Archivos

- `prisma/schema.prisma`: definición de las tablas.
- `prisma/migrations/`: historial de cambios en la base, en SQL. Nunca se editan una vez aplicadas.
- `prisma.config.ts`: configuración de la CLI de Prisma (dónde está el esquema y qué `.env` cargar).
