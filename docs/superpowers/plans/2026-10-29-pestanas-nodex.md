# Pestañas de Nodexs: plan de implementación

> **Para agentes:** superpowers:executing-plans (modo nativo).

**Especificación:** `docs/superpowers/specs/2026-10-29-pestanas-nodex-design.md`

## Restricciones globales

- Sin comentarios en el código. Textos en español. Sin dependencias nuevas.
- Claude no hace commits. Comprobaciones: `cd frontend && npx tsc --noEmit && npx eslint src` y la prueba en el navegador.

## Puntos de revisión

1. **Recargar la página** no duplica pestañas ni las pierde.
2. **Abrir uno que ya está abierto** activa su pestaña y no crea otra.
3. **Cerrar la activa** navega a la vecina correcta; cerrar la última vuelve al panel.
4. **Una marca de "pestaña nueva" pendiente** no afecta a una navegación posterior que no la pidió.
5. **No hay desajuste de hidratación** (el servidor no conoce `localStorage`).

---

### Tarea 1: estado y barra
**Archivos:** `lib/tabs.ts`, `lib/use-open-nodex.ts`, `components/nodex-tabs.tsx` (nuevos), `components/nodex-view.tsx` y `components/nodex-dialog.tsx`.
- [ ] Implementar el estado, la barra y el "+".

### Tarea 2: abrir en pestaña nueva
**Archivos:** `nodex-card.tsx`, `nodex-grid.tsx`, `board.tsx`, `task-board.tsx`, `task-calendar.tsx`, `tareas/page.tsx`, `graph-view.tsx`, `grafo/page.tsx` y `nodex-view.tsx` (relacionados).
- [ ] Ampliar `onOpen` a `(id, newTab?)` y usar `useOpenNodex`.

### Tarea 3: prueba, documentación y revisión
- [ ] Prueba en el navegador (todos los puntos de revisión).
- [ ] `docs/09` y marcar `RF-22.5` en `docs/03` y `docs/02`.
- [ ] Revisión independiente (opus). Corregir lo confirmado. Dar a Jose el commit y el PR.
