# Diseño: vista de detalle del Nodex (HU-22, parte 1 de 3)

Fecha: 2026-10-29 · Rama: `feature/vista-nodex`

Cada Nodex tiene su propia página, al estilo de Obsidian: título grande, propiedades editables en una tabla y contenido en Markdown. La parte 2 (pestañas) y la parte 3 (dividir en dos paneles) irán en ramas aparte.

## Requisitos (para `docs/03`)

- **RF-22.1**: Al abrir un Nodex, el sistema debe mostrar una página con su título, sus propiedades (enlace, prioridad, tarea, fecha límite, recordatorio, grupos, etiquetas, creado y modificado) y su contenido.
- **RF-22.2**: El contenido debe mostrarse formateado en Markdown (títulos, listas, casillas, tablas, código, citas y enlaces) y poder editarse en texto plano, guardándose solo.
- **RF-22.3**: Las propiedades y el título deben poder editarse directamente en la página.
- **RF-22.4**: Crear un Nodex pide solo el título y, opcionalmente, las propiedades; el contenido se escribe después, en su página.
- **RF-22.5** *(parte 2)*: El sistema debe permitir tener varios Nodexs abiertos en pestañas.
- **RF-22.6** *(parte 3)*: El sistema debe permitir dividir la vista en dos paneles, cada uno con sus pestañas.

## Página `/nodexs/:id` (`components/nodex-view.tsx`)

- **Cabecera:** botón "Volver" (`router.back()`, o el panel si no hay historial) y menú "⋯" con "Abrir enlace" (si hay URL) y "Borrar". Borrar pide confirmación, envía el Nodex a la papelera con el aviso y su "Deshacer", y vuelve al panel.
- **Título:** `h1`. Al pulsarlo se convierte en un campo; se guarda con Intro o al salir, y `Esc` cancela.
- **Propiedades:** una tabla "nombre → valor". Cada cambio se guarda al momento con `useUpdateNodex`.
  - **Enlace:** se muestra el dominio enlazado y "Editar" lo convierte en un campo.
    - Debajo: el estado si está roto o no responde ("Comprobar ahora", "Ver copia"), el tiempo de lectura y "Leer más tarde / Marcar como leído" (solo en enlaces).
    - Vaciar la URL de un enlace muestra el error del backend.
  - **Prioridad:** chips (Sin prioridad, Baja…).
  - **Tarea:** interruptor más chips de estado. **Fecha límite** (solo si es tarea): `date` con "Quitar".
  - **Recordatorio:** interruptor, `datetime-local` y los tres atajos. Una fecha pasada muestra el error en un aviso.
  - **Grupos:** chips que se activan y desactivan. **Etiquetas:** `TagInput`.
  - **Creado / Modificado:** solo lectura.
- **Contenido** (`components/markdown.tsx`):
  - Se pinta con `react-markdown` y `remark-gfm`. No ejecuta HTML incrustado (opción por defecto) y los enlaces se abren en otra pestaña con `rel="noreferrer"`.
  - "Editar" o doble clic lo convierte en un `textarea` que se guarda solo 1 s después de dejar de escribir, con el indicador "Guardando…" o "Guardado". "Listo" o `Esc` vuelven a la lectura.
  - Si está vacío: "Pulsa para escribir…".
  - Mientras se edita, el texto local manda: una recarga de datos no lo pisa.
- **Debajo:** los Nodexs relacionados (enlaces a sus páginas).
- **Al montar** la página se llama a `useMarkOpened` (Redescubre). Si devuelve 404: "Este Nodex ya no existe" y "Volver al panel". Mientras carga, la rueda.
- **`?editar=1`** abre el contenido directamente en edición. Es lo que usa la ventana de creación.
- Estilos de Markdown en `globals.css`, bajo la clase `.markdown`, con los tokens del tema.

## Creación (`components/nodex-dialog.tsx`, solo para crear)

- **`NodexDialog({ open, onOpenChange, defaultTask? })`:** título (pegar una URL la mueve a "Enlace"), enlace, y en una sección "Más opciones" desplegada: prioridad, tarea y fecha, recordatorio, grupos, etiquetas y "Leer más tarde". Sin contenido.
- **Al crear:**
  - Si no hay duplicados, navega a `/nodexs/:id?editar=1`.
  - Si los hay, muestra la lista con "Abrir" en cada uno, "Borrar el que acabo de crear" y "Mantener los dos", que navega al nuevo.
- **Controles compartidos** entre la ventana y la página: `components/nodex-fields.tsx` (`PrioritySelect`, `TaskFields`, `ReminderFields`, `GroupToggles` y `Switch`).

## Navegación

Panel, búsqueda, Redescubre, sugerencias, grafo, tareas (tablero y calendario), campana y relacionados navegan con `router.push("/nodexs/:id")`. El panel ya no usa `history.pushState` ni ventana de edición. `/nodexs/[id]/page.tsx` pinta `NodexView`, ya no el `Board`.

## Dependencias

`react-markdown@10.1.0` y `remark-gfm@4.0.1`, con la versión fija.

## Pruebas

En el navegador:
- Crear un Nodex y llegar a su página en edición.
- Escribir Markdown: tabla, casillas, código y un enlace.
- Cambiar cada propiedad y recargar para ver que se guardó.
- Borrar y deshacer.
- Abrirlo desde el grafo y desde las tareas.
- La página en el móvil.

Después, revisión independiente.

## Fuera de alcance (en esta parte)

Pestañas, división en paneles, enlaces internos `[[Nodex]]`, subir imágenes al contenido e historial de versiones.
