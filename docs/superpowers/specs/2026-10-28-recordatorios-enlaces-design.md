# Diseño: avisos (recordatorios y enlaces rotos)

Fecha: 2026-10-28 · Rama: `feature/recordatorios-enlaces` · Requisitos: `RF-12.3`, `RF-12.7` (avisos dentro de la aplicación; las notificaciones push llegan con la PWA)

El backend ya existe (`/api/reminders`, `/api/links`) y cada Nodex trae `reminder` y `linkPreview`. Esta rama solo cambia el frontend.

## Campana (centro de avisos)

- Es un botón en la barra lateral, entre "Tareas" y "Ajustes", con `data-tour="avisos"` y el icono `Bell`.
- Lleva un número rojo con los recordatorios vencidos y sin descartar. Los enlaces rotos no cuentan.
- Al pulsarlo se abre un Popover con tres apartados (los vacíos no se muestran):
  - **Ahora:** `GET /reminders?status=due`. Cada fila tiene el título, la hora y los botones "Abrir" y "Descartar" (`POST /reminders/:id/dismiss`).
  - **Próximos:** `GET /reminders?status=upcoming`, con el título y la fecha y hora.
  - **Enlaces rotos:** `GET /links/broken`, con el título, el dominio, "Abrir" y, si hay `archiveUrl`, "Ver copia", que se abre en otra pestaña.
- Si no hay nada: "Todo al día".
- "Abrir" navega a `/nodexs/:id`, la ruta que ya abre la ventana del Nodex sobre el panel, y cierra el Popover.
- Mientras carga, la rueda que gira. Si falla, "No se han podido cargar los avisos" y el botón "Reintentar".

## Aviso al llegar la hora

- `useDueReminders` se refresca cada 60 s.
- Si aparece un recordatorio vencido que no estaba en la consulta anterior, sale un aviso (`toast`) con "Recordatorio: <título>" y la acción "Abrir".
- En la primera carga no sale ningún aviso: para los que ya estaban vencidos está el número rojo.

## Ventana del Nodex

- **Sección "Recordatorio"**, debajo de "Tarea" y con el mismo interruptor:
  - Un `<input type="datetime-local">` y tres atajos:
    - "En 1 hora": ahora + 60 min.
    - "Esta tarde (18:00)": hoy a las 18:00, o mañana a las 18:00 si ya han pasado.
    - "Mañana a las 9:00".
  - Si el recordatorio ya avisó (`sentAt`) o está vencido, se ve "Avisado el 3 nov, 9:00". Cambiar la fecha lo reprograma.
  - Al activar el interruptor sin fecha, el campo queda vacío. Si se guarda así, se considera que no hay cambio.
- **Estado del enlace**, solo en Nodexs con URL cuyo `linkPreview.status` sea `broken` o `unreachable`:
  - El texto "Este enlace está roto" o "Este enlace no responde".
  - Los botones "Comprobar ahora" (`POST /links/:id/refresh`, con rueda) y "Ver copia" (si hay `archiveUrl`).

## Tarjeta del panel

- "Enlace roto" si `linkPreview.status === "broken"`.
- "🔔 3 nov, 9:00" si hay un recordatorio sin enviar (`sentAt === null`).

## Datos

- `lib/types.ts`:
  - `Reminder = { remindAt: string; sentAt: string | null; dismissedAt: string | null }`.
  - `Nodex.reminder: Reminder | null`.
  - `LinkPreview` gana `archiveUrl` y `lastCheckedAt`.
  - `ReminderItem = Reminder & { nodex: { id; title; type; priority } }`.
  - `BrokenLink = { url; archiveUrl; nodex: { id; title } }`.
- `lib/queries/alerts.ts`:
  - `useDueReminders()`: clave `["alerts","due"]`, `refetchInterval: 60_000`.
  - `useUpcomingReminders(enabled)`: clave `["alerts","upcoming"]`.
  - `useBrokenLinks(enabled)`: clave `["alerts","broken"]`.
  - `useDismissReminder()`.
  - `useRefreshLink()`, que invalida como al editar un Nodex.
- `useCreateNodex` y `useUpdateNodex` aceptan `reminder?: string | null` (un ISO, o `null` para borrar):
  - `PUT /reminders/:id { remindAt }` o `DELETE /reminders/:id`.
  - Al crear, si falla, se avisa sin propagar el error, igual que con la tarea.
- `useInvalidateNodexs` también invalida `["alerts"]`.
- Formato: `formatDateTime(iso)` con `toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })`. `toDateTimeInput(iso)` y `fromDateTimeInput(value)` usan la hora local.

## Pruebas

En el navegador, con un usuario `@nodex.test`:
- Un recordatorio a 1–2 minutos: comprobar el número rojo, el aviso y Descartar.
- Los atajos.
- Un Nodex con una URL que devuelve 404: comprobar la etiqueta, el apartado de la campana y "Comprobar ahora".

Después, una revisión independiente.

## Fuera de alcance

Notificaciones push (PWA), posponer un recordatorio y recordatorios repetidos.
