# Diseño: dividir en dos paneles (HU-22, parte 3 · `RF-22.6`)

Fecha: 2026-10-29 · Rama: `feature/dos-paneles`

## Comportamiento

- **Cabecera de la página del Nodex**, arriba a la derecha: un botón ↗ "Abrir enlace" (solo si hay URL; antes estaba en "⋯"), un botón "Dividir" con el icono `SquareSplitHorizontal` y el texto de ayuda "Abrir a la derecha" (solo en el panel izquierdo), y el menú "⋯" con "Abrir a la derecha" (en el izquierdo) y "Borrar".
- **Abrir a la derecha:**
  - con "Dividir" o "Abrir a la derecha", el Nodex actual;
  - con Ctrl/Cmd + Alt + clic en tarjetas, relacionados, tareas, calendario y grafo, cualquier Nodex.
  - Si el panel derecho ya existe, se abre en él como pestaña nueva, o se activa si ya estaba.
- **Cada panel tiene sus pestañas:**
  - Los clics dentro de un panel (en los relacionados) se abren en ese mismo panel: clic normal en su pestaña activa, Ctrl + clic en una pestaña nueva y Ctrl + Alt + clic a la derecha.
  - Cerrar la última pestaña del derecho lo cierra y vuelves a un solo panel.
  - El "+ Nuevo" y la pista solo están en la barra del izquierdo. La pista dice: "Ctrl + clic: otra pestaña · Ctrl + Alt + clic: a la derecha".
- **Separador** con `role="separator"`: se arrastra con el puntero entre el 25 % y el 75 %, las flechas lo mueven de 5 en 5, el doble clic lo devuelve al 50 % y el valor se recuerda.
- **Panel izquierdo:** sigue a la URL, como hasta ahora. El derecho **no** va en la URL; se guarda en `localStorage` junto a las pestañas.
- **Móvil (< `md`):** no se ve el panel derecho ni el botón "Dividir", aunque el estado se conserva.
- **Borrar desde el panel derecho** cierra su pestaña en lugar de volver al panel principal.

## Técnico

- **`lib/tabs.ts`:**
  - El estado pasa a `{ left: Pane, right: Pane | null, split: number }`, con `Pane = { tabs, active }`. Lo guardado con el formato anterior (`{ tabs, active }`) se convierte en `left`.
  - Funciones:
    - `showInTabs(id)`, que trabaja sobre el izquierdo y no cambia de comportamiento;
    - `openRight(id)` y `showInRight(id, newTab)`;
    - `closeTab(side, id)`, que devuelve el siguiente id;
    - `activateRight(id)` y `setSplit(n)`.
  - `requestNewTab(id)` se mantiene.
- **`lib/use-open-nodex.ts`:**
  - `type OpenTarget = "active" | "newTab" | "right"`.
  - `openTarget(event)`: Ctrl/Cmd + Alt → `"right"`; Ctrl/Cmd o clic central → `"newTab"`; si no, `"active"`.
  - `useOpenNodex()` → `(id, target = "active")`. Si el destino es `"right"`, llama a `openRight` y, si no estás en una página de Nodex, navega a la pestaña activa del izquierdo (o abre ese mismo Nodex a la izquierda si no hay ninguna).
- **`NodexPane`** (en `components/nodex-view.tsx`, junto a título, propiedades y contenido): se extrae de `NodexView` (cabecera, estados, título, propiedades, contenido y relacionados) con las props `id` y `side`. `NodexView` pasa a pintar `TopBar` y uno o dos paneles, cada uno con su `NodexTabs side`, separados por `PaneSeparator`.
- **`onOpen(id, target?: OpenTarget)`** sustituye a `onOpen(id, newTab?)` en tarjetas, tareas, calendario y grafo.

## Pruebas

- Tests de la lógica en el scratchpad:
  - abrir a la derecha, también cuando ya existe y cuando el Nodex ya está abierto en el derecho;
  - cerrar la última pestaña del derecho;
  - convertir el formato antiguo;
  - que `split` quede entre 25 y 75.
- Navegador: "Dividir", Ctrl + Alt + clic, relacionados dentro del panel derecho, arrastrar el separador y que en el móvil no se vea.
- Revisión independiente.

## Fuera de alcance

Más de dos paneles, división horizontal y arrastrar pestañas de un panel a otro.
