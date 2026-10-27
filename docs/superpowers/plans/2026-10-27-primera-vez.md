# La primera vez en Nodex: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Pantalla de inicio estilo portada, carrusel de bienvenida y tutorial con bocadillos.
**Architecture:** Todo en el frontend; el backend ya guarda `tutorialCompletedVersion`. Componentes nuevos en `src/components/`, ruta nueva `app/bienvenida/`.
**Tech Stack:** Next.js 16, Tailwind 4, shadcn/ui (Popover), TanStack Query. Sin dependencias nuevas.
**Spec:** [`docs/superpowers/specs/2026-10-27-primera-vez-design.md`](../specs/2026-10-27-primera-vez-design.md)

## Global Constraints

- Sin comentarios en el código; texto visible en español; Git lo hace Jose (un commit al final).
- Cargas con `Spinner`; animaciones solo CSS/SVG y quietas con `prefers-reduced-motion`.
- `TUTORIAL_VERSION = 1`; marca de sesión `nodex-tour` en `sessionStorage` (envuelta en try/catch).
- Verificación: `npm run lint`, `npm run typecheck`, `npm run build` y navegador (sin tests automáticos hasta el bloque de pruebas).

## Review Focus

1. Bucle de redirección: tras "Entrar a Nodex", el layout no debe volver a mandar a `/bienvenida` mientras dure el tutorial.
2. Un paso cuyo elemento no está en pantalla (p. ej. barra lateral oculta) no debe romper el tutorial: se salta ese paso.
3. Si `PUT /me/tutorial` falla, el tutorial se cierra igual y se avisa con un toast; volverá a salir.
4. `sessionStorage` inaccesible (modo privado estricto) no debe romper la app.
5. En el móvil, el formulario debe quedar visible sin desplazarse más de una pantalla.

### Task 1: Fondo animado y pantalla de inicio
**Files:** Create `src/components/auth-background.tsx`, `src/components/app-preview.tsx`; Modify `src/app/(auth)/layout.tsx`, `src/components/auth-form.tsx`, `src/app/globals.css`.
- `AuthBackground`: SVG fijo detrás de todo (`absolute inset-0 -z-10`), mancha naranja y red de ~10 nodos y líneas con `@keyframes` lentos de desplazamiento.
- `AppPreview`: 3 vistas con `NodexCard` y datos de ejemplo, apiladas y alternadas con una animación de opacidad de 12 s y retrasos de 0/4/8 s.
- Layout: dos columnas en `md+` (texto y formulario | `AppPreview`); en el móvil, solo la izquierda.
- `AuthForm`: botones OAuth arriba con logos SVG, separador "o con tu correo", mostrar/ocultar contraseña y aviso de longitud.
- Verificar en el navegador a 1280 y 375 px, claro y oscuro.

### Task 2: Bienvenida
**Files:** Create `src/app/bienvenida/page.tsx`, `src/lib/tour.ts`; Modify `src/app/(app)/layout.tsx`, `src/components/settings-dialog.tsx`.
- `lib/tour.ts`: `TUTORIAL_VERSION`, `startTour()`, `tourPending(): boolean`, `endTour()` sobre `sessionStorage`.
- Layout `(app)`: si `me.data.tutorialCompletedVersion` es menor que la versión y no hay `tourPending()`, `router.replace("/bienvenida")`.
- Página: carrusel `scroll-snap`, puntos, Anterior/Siguiente, flechas; "Entrar a Nodex" → `startTour()` y `router.push("/")`.
- Ajustes: enlace "Ver la bienvenida otra vez".

### Task 3: Tutorial
**Files:** Create `src/components/tour.tsx`, `src/components/ui/popover.tsx` (shadcn); Modify `top-bar.tsx`, `group-filter.tsx`, `sort-menu.tsx`, `board.tsx`, `sidebar.tsx` (atributos `data-tour`).
- `Tour`: si `tourPending()`, recorre los 7 pasos; busca `[data-tour=…]` visible, ancla el Popover con `virtualRef`, añade la clase de resalte; Terminar/Saltar/Esc → `PUT /me/tutorial`, `setQueryData(["me"])`, `endTour()`.
- Montado en `Board`.

### Task 4: Documentación y recorrido
- `docs/09-frontend.md`: inicio, bienvenida y tutorial. Recorrido completo de la spec y limpieza de usuarios de prueba.
