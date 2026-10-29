# Dos paneles: plan de implementación

> **Para agentes:** superpowers:executing-plans (modo nativo).

**Especificación:** `docs/superpowers/specs/2026-10-29-dos-paneles-design.md`

## Restricciones globales

- Sin comentarios en el código. Textos en español. Sin dependencias nuevas.
- Claude no hace commits. Comprobaciones: `cd frontend && npx tsc --noEmit && npx eslint src`, los tests de la lógica en el scratchpad y el navegador.

## Puntos de revisión

1. **El panel izquierdo sigue a la URL** y el derecho nunca la cambia.
2. **Cerrar la última pestaña del derecho** vuelve a un solo panel sin navegar.
3. **Las pestañas guardadas con el formato anterior** no se pierden.
4. **El separador** no sale del rango 25–75 y no rompe la selección de texto mientras se arrastra.
5. **El autoguardado del contenido** sigue funcionando en los dos paneles a la vez (dos `Content` montados).

---

### Tarea 1: estado de dos paneles y sus tests
**Archivos:** `lib/tabs.ts` y `lib/use-open-nodex.ts`.

### Tarea 2: `NodexPane`, separador y botones
**Archivos:** `components/nodex-pane.tsx` (nuevo), `components/nodex-view.tsx` y `components/nodex-tabs.tsx`.

### Tarea 3: `onOpen` con destino
**Archivos:** `nodex-card.tsx`, `nodex-grid.tsx`, `board.tsx`, `task-board.tsx`, `task-calendar.tsx`, `tareas/page.tsx`, `graph-view.tsx` y `grafo/page.tsx`.

### Tarea 4: prueba, documentación y revisión
- [ ] Navegador, `docs/09`, marcar `RF-22.6` en `docs/03` y `docs/02`.
- [ ] Revisión independiente (opus). Corregir lo confirmado. Dar a Jose el commit y el PR.
