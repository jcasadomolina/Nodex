# Diseño: pestañas de Nodexs (HU-22, parte 2 · `RF-22.5`)

Fecha: 2026-10-29 · Rama: `feature/pestanas-nodex`

## Comportamiento (como en Obsidian)

- **Clic normal** en un Nodex: lo abre en la pestaña activa, o en la que ya tenga si está abierto.
- **Ctrl/Cmd + clic o clic central**: lo abre en una pestaña nueva. Funciona en las tarjetas del panel y de la búsqueda, en los relacionados, en el tablero y el calendario de tareas y en el grafo. El resto (campana, sugerencias, Redescubre) abre siempre en la activa.
- **La barra** aparece solo en las páginas de Nodex. Las pestañas se recuerdan en `localStorage` (`nodex-tabs`); si no está disponible, solo duran la sesión.
- **Cerrar** (la "×" o el clic central sobre la pestaña): si era la activa, pasas a la de la derecha, luego a la de la izquierda y, si no queda ninguna, al panel.
- **"+"**: abre la ventana "Nuevo Nodex" y el Nodex creado se abre en una pestaña nueva.
- **Máximo 20:** al pasar de ahí se cierra la más antigua que no esté activa.
- **Nodex borrado:** su pestaña dice "No encontrado".

## Diseño técnico

- **`lib/tabs.ts`:** un almacén pequeño con `useSyncExternalStore`. El estado es `{ tabs: string[], active: string | null }`.
  - `showInTabs(id)` la llama la página al montarse: activa la pestaña de ese Nodex, o sustituye la activa (o crea una) según el clic.
  - `requestNewTab(id)` marca que la próxima apertura de ese Nodex va en una pestaña nueva.
  - `closeTab(id)` devuelve a qué id hay que ir, o `null` para el panel.
  - `useTabs()` lee el estado (en el servidor, vacío).
- **`lib/use-open-nodex.ts`:** `useOpenNodex()` → `(id, newTab = false) => { if (newTab) requestNewTab(id); router.push(\`/nodexs/${id}\`) }`.
- **`components/nodex-tabs.tsx`:**
  - `role="tablist"`, con cada pestaña como `role="tab"` y `aria-selected`.
  - Las flechas izquierda/derecha se mueven y activan.
  - El título sale de `useNodex(id)`, compartido con la caché.
- **`onOpen(id, newTab?)`:** en `NodexCard`, `SortableTask`, `TaskChip`, los relacionados y el grafo, `newTab` viene de `ctrlKey`/`metaKey` o de `button === 1` (con `onAuxClick` en los botones).
- **`NodexDialog`** acepta `newTab` para el "+" de la barra.

## Pruebas

En el navegador:
- Abrir con clic normal y con Ctrl + clic.
- Cerrar la activa y cerrar la última.
- Recargar y que las pestañas sigan.
- Cerrar por encima de 20.
- Crear con "+".
- Probar las flechas del teclado.
- Comprobar que no hay desbordamiento en el móvil.

Después, revisión independiente.

## Fuera de alcance

Historial propio de cada pestaña, reordenar arrastrando, fijar pestañas y dividir en paneles (parte 3).
