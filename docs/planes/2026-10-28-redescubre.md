# Redescubre: plan de implementación

> **Para agentes:** superpowers:executing-plans (modo nativo).

**Especificación:** `docs/disenos/2026-10-28-redescubre-design.md`

## Restricciones globales

- Sin comentarios en el código. Textos en español. Sin dependencias nuevas.
- Migración sin conexión: `prisma migrate diff --from-schema <esquema anterior> --to-schema prisma/schema.prisma --script`, después `npm run db:deploy` y `npm run db:generate`.
- Claude no hace commits. Comprobaciones: `tsc` en backend y frontend, y `eslint` en frontend.

## Puntos de revisión

1. **Las recargas no cuentan como aperturas:** `POST /open` solo se llama al abrir la ventana, no al recargar datos.
2. **`updated_at` no cambia** al abrir un Nodex. Si cambiara, alteraría el orden "más recientes".
3. **Determinismo:** el mismo día devuelve los mismos 3 si nada cambia.
4. **Rutas:** `/rediscover` no choca con `/:id`.
5. **`localStorage` bloqueado:** la franja sigue funcionando.

---

### Tarea 1: migración y backend

**Archivos:** `backend/prisma/schema.prisma`, `backend/prisma/migrations/20261028120000_add_nodex_last_opened_at/migration.sql`, `backend/src/modules/nodexs/rediscover.ts` (nuevo, con `findForgotten(userId)`), `nodexs.routes.ts` y `backend/README.md`.

- [ ] Crear y aplicar la migración, y regenerar el cliente.
- [ ] Implementar `findForgotten` y las dos rutas.
- [ ] Script de prueba con fechas a mano (puntos de revisión 2, 3 y 4).

### Tarea 2: frontend

**Archivos:** `lib/queries/nodexs.ts` (`useRediscover`, `useMarkOpened`), `components/rediscover.tsx` (nuevo), `components/nodex-dialog.tsx` y `components/board.tsx`.

- [ ] Implementar lo de la especificación.
- [ ] Prueba en el navegador (puntos de revisión 1 y 5).

### Tarea 3: documentación y revisión

- [ ] HU-20 en `docs/03`, la columna en `docs/08`, la sección en `docs/09` y marcar la idea en `docs/02`.
- [ ] Revisión independiente (opus). Corregir lo confirmado. Dar a Jose el commit y el PR.
