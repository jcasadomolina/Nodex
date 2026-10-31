# Vista del Nodex (parte 1): plan de implementación

> **Para agentes:** superpowers:executing-plans (modo nativo).

**Especificación:** `docs/disenos/2026-10-29-vista-nodex-design.md`

## Restricciones globales

- Sin comentarios en el código. Textos en español. Cargas con `<Spinner />`.
- Lo que dependa de la URL va dentro de `<Suspense>`.
- Claude no hace commits. Comprobaciones: `cd frontend && npx tsc --noEmit && npx eslint src` y la prueba en el navegador. El backend no cambia.

## Puntos de revisión

1. **El autoguardado** no pisa lo que se está escribiendo ni se pierde al salir de la página: se guarda lo pendiente al salir de la edición y al desmontar.
2. **Ningún sitio sigue abriendo la ventana de edición antigua.**
3. **El Markdown no ejecuta HTML ni `javascript:`** en los enlaces.
4. **Editar una propiedad no guarda las demás:** cada control envía solo su cambio.
5. **Ver una página cuenta como abierta una sola vez** (Redescubre).

---

### Tarea 1: controles compartidos y ventana de creación
**Archivos:** `components/nodex-fields.tsx` (nuevo) y `components/nodex-dialog.tsx` (reescrito, solo crear).
- [ ] Extraer los controles, simplificar la ventana y navegar al crear.

### Tarea 2: página del Nodex
**Archivos:** `components/markdown.tsx`, `components/nodex-view.tsx`, `app/(app)/nodexs/[id]/page.tsx` y `app/globals.css`.
- [ ] Cabecera, título, propiedades, contenido con autoguardado y relacionados.

### Tarea 3: navegación
**Archivos:** `board.tsx`, `grafo/page.tsx`, `tareas/page.tsx` y los componentes que reciben `onOpen`.
- [ ] Sustituir la ventana por `router.push`.

### Tarea 4: prueba, documentación y revisión
- [ ] Prueba completa en el navegador (escritorio y móvil).
- [ ] HU-22 en `docs/03`, la sección en `docs/09` y la hoja de ruta en `docs/02`.
- [ ] Revisión independiente (opus). Corregir lo confirmado. Dar a Jose el commit y el PR.
