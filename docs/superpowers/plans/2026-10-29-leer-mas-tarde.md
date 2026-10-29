# Leer más tarde: plan de implementación

> **Para agentes:** superpowers:executing-plans (modo nativo).

**Especificación:** `docs/superpowers/specs/2026-10-29-leer-mas-tarde-design.md`

## Restricciones globales

- Sin comentarios en el código. Textos en español. Sin dependencias nuevas.
- Migración sin conexión (`prisma migrate diff`), después `db:deploy` y `db:generate`.
- Claude no hace commits. Comprobaciones: `tsc` en backend y frontend, `eslint` en frontend y `npx tsx --test src/lib/html-meta.test.ts`.

## Puntos de revisión

1. **Activarlo dos veces** no cambia `readLaterAt`.
2. **Las notas** no pueden quedar marcadas.
3. **El cursor** de `readLater=true` pagina sin repetir ni saltar Nodexs.
4. **Las páginas no-artículo** (cortas, solo scripts) no muestran tiempo.
5. **El botón de la ventana** no pierde lo que el usuario está editando en el formulario.

---

### Tarea 1: `readingMinutes` y sus tests
**Archivos:** `backend/src/lib/html-meta.ts` y `backend/src/lib/html-meta.test.ts`.
- [ ] Escribir los tests y ver que fallan. Implementar y ver que pasan.

### Tarea 2: migración y API
**Archivos:** `schema.prisma`, la migración `20261029120000_add_read_later`, `links.service.ts`, `nodexs.schemas.ts`, `nodexs.routes.ts` y `backend/README.md`.
- [ ] Migración, lógica y rutas.
- [ ] Script temporal contra la API (puntos de revisión 1, 2 y 3).

### Tarea 3: frontend
**Archivos:** `lib/types.ts`, `lib/queries/nodexs.ts`, `group-filter.tsx`, `board.tsx`, `nodex-dialog.tsx` y `nodex-card.tsx`.
- [ ] Implementar y probar en el navegador (puntos de revisión 4 y 5).

### Tarea 4: documentación y revisión
- [ ] HU-21 en `docs/03`, las columnas en `docs/08`, la sección en `docs/09` y marcarla en `docs/02`.
- [ ] Revisión independiente (opus). Corregir lo confirmado. Dar a Jose el commit y el PR.
