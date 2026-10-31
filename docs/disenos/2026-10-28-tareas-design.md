# Diseño: interfaz de tareas (`/tareas`)

Fecha: 2026-10-28 · Rama: `feature/tareas-interfaz` · Requisitos: `RF-12.1`, `RF-12.4`, `RF-12.5`, `RF-12.6`

El backend ya existe (`/api/tasks`) y cada Nodex trae su tarea en el campo `task`. Esta rama solo añade la interfaz.

## Pantallas

### Barra lateral

Icono nuevo "Tareas" (`SquareCheckBig`) entre "Vista gráfica" y "Ajustes". Lleva a `/tareas`.

### `/tareas`

- Barra superior con "Tareas" y dos pestañas: **Tablero** (por defecto) y **Calendario**.
- Botón flotante **+**: abre la ventana del Nodex con la tarea ya activada.
- Sin tareas: mensaje "Aún no tienes tareas" y botón "Crear tarea".
- Cargando: rueda que gira. Error: mensaje y botón "Reintentar".

### Tablero (`RF-12.6`)

- Tres columnas: **Pendiente** (`todo`), **En curso** (`doing`) y **Hecha** (`done`), con su número de tareas.
- Tarjeta: título, prioridad y fecha límite. La fecha va en rojo si ya pasó y la tarea no está hecha.
- Arrastrar con **dnd-kit**:
  - Ratón: arrastrar tras moverse 5 px, para que el clic siga abriendo el Nodex.
  - Dedo: mantener pulsado 200 ms, para no bloquear el scroll.
  - Teclado: espacio para coger o soltar, flechas para mover y `Esc` para cancelar, con avisos en español para lectores de pantalla.
- Al soltar, la tarjeta se coloca al momento (actualización optimista) y se envía `POST /tasks/:nodexId/move { status, index }`. Si falla, se recarga el tablero y sale un aviso con el error.
- Pulsar una tarjeta abre la ventana del Nodex.
- Móvil: las columnas se desplazan en horizontal (cada una ocupa casi todo el ancho).

### Calendario (`RF-12.5`)

- Vista de mes hecha a mano (rejilla CSS), semana de lunes a domingo, con los nombres en español mediante `Intl`.
- Flechas ◀ ▶ para cambiar de mes y botón "Hoy". El día de hoy va marcado.
- Datos: `GET /tasks/calendar?from=&to=` con el rango visible (como máximo 42 días).
- Cada tarea es una etiqueta con el color de su estado (pendiente: gris, en curso: naranja, hecha: tachada). Pulsarla abre el Nodex.
- Las tareas se colocan por el día **local** de `dueAt`.
- Móvil (`< md`): lista de los días del mes que tienen tareas, en lugar de la rejilla.
- Las tareas sin fecha no aparecen en el calendario (sí en el tablero).

### Ventana del Nodex (`RF-12.1`, `RF-12.4`)

- Sección nueva "Tarea", con un interruptor. Al activarlo aparecen:
  - Estado: tres botones (Pendiente, En curso, Hecha), con el mismo estilo que la prioridad.
  - Fecha límite: `<input type="date">` opcional, con un botón para quitarla. Se guarda como las 00:00 locales de ese día.
- Al guardar, solo se llama al backend si la tarea ha cambiado:
  - Activada y no existía, o con cambios: `PUT /tasks/:nodexId { status, dueAt }`.
  - Desactivada y existía: `DELETE /tasks/:nodexId`. El Nodex no se borra.
- La ventana recibe `defaultTask` para abrirse con la tarea ya activada desde `/tareas`.

### Tarjeta del panel

Si el Nodex es una tarea, lleva una etiqueta "Tarea", con la fecha si la tiene (p. ej. "Tarea · 3 nov"), o "Hecha" si lo está.

### Tutorial

Un paso nuevo, "tareas", que apunta al icono de la barra lateral. No cambia `TUTORIAL_VERSION`.

## Datos

- Dependencias nuevas, con versión fija: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- `lib/types.ts`:
  - `TaskStatus = "todo" | "doing" | "done"`.
  - `Task = { status, dueAt, completedAt }`.
  - `Nodex.task: Task | null`.
  - `TaskCard = Task & { nodex: { id, title, type, url, priority } }`.
- `lib/queries/tasks.ts`:
  - `useTaskBoard()`: clave `["tasks", "board"]`, `GET /tasks/board`.
  - `useTaskCalendar(from, to)`: clave `["tasks", "calendar", from]`, `GET /tasks/calendar`.
  - `useMoveTask()`: optimista sobre `["tasks", "board"]`, e invalida `["tasks"]` al terminar.
  - Sin `useSaveTask`: `useCreateNodex` y `useUpdateNodex` aceptan `task` y hacen el `PUT` o el `DELETE` dentro del mismo guardado.
- `useInvalidateNodexs` también invalida `["tasks"]`.

## Componentes

| Archivo | Qué hace |
|---------|----------|
| `app/(app)/tareas/page.tsx` | Página, pestañas, botón +, estados vacío, de carga y de error, y la ventana del Nodex |
| `components/task-board.tsx` | Columnas y arrastre con dnd-kit |
| `components/task-calendar.tsx` | Rejilla del mes y lista para el móvil |
| `components/task-card.tsx` | Tarjeta del tablero |
| `components/nodex-dialog.tsx` | Sección "Tarea" |
| `components/sidebar.tsx`, `tour.tsx`, `nodex-card.tsx` | Icono, paso del tutorial y etiqueta |

## Pruebas

Verificación manual en el navegador con un usuario `@nodex.test`, que se borra al terminar:
- Crear una tarea desde `/tareas` y desde el panel.
- Arrastrar con ratón y con teclado.
- Comprobar las fechas en el calendario y en el móvil.
- Quitar la tarea desde la ventana.

Después, una revisión independiente. Los tests automáticos quedan para el bloque de pruebas.

## Fuera de alcance

Arrastrar en el calendario, la vista semanal y limitar el número de tareas de la columna "Hecha".
