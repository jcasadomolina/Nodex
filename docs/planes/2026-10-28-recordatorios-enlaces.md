# Avisos (recordatorios y enlaces rotos): plan de implementación

> **Para agentes:** sub-skill obligatoria: superpowers:executing-plans (modo nativo, elegido por Jose para la rama anterior).

**Objetivo:** campana de avisos, sección "Recordatorio" y estado del enlace en la ventana del Nodex, y etiquetas en la tarjeta.

**Arquitectura:** sin cambios en el backend. El recordatorio se guarda dentro de las mutaciones de Nodex, igual que la tarea. La campana es un Popover en la barra lateral que lee tres consultas bajo la clave `["alerts"]`.

**Especificación:** `docs/disenos/2026-10-28-recordatorios-enlaces-design.md`

## Restricciones globales

- Sin comentarios en el código. Textos en español. Cargas con `<Spinner />`.
- Sin dependencias nuevas.
- Claude no hace commits. Comprobación de cada tarea: `cd frontend && npx tsc --noEmit && npx eslint src`, sin errores, y la prueba en el navegador.

## Puntos de revisión

1. **Primera carga:** no sale aviso de los recordatorios que ya estaban vencidos. Uno nuevo sí avisa una vez, no en cada refresco.
2. **Hora local:** un recordatorio a las 9:00 se muestra y se guarda a las 9:00 locales (`datetime-local`).
3. **Fecha pasada:** guardar un recordatorio en el pasado muestra el error del backend y no cierra la ventana.
4. **Interruptor sin fecha:** activar el recordatorio sin fecha y guardar no llama al backend.
5. **"Abrir" desde la campana:** desde `/tareas` o `/grafo` lleva a `/nodexs/:id` y abre la ventana.

---

### Tarea 1: tipos, formatos y consultas

**Archivos:** `frontend/src/lib/types.ts`, `frontend/src/lib/format.ts`, `frontend/src/lib/queries/alerts.ts` (nuevo) y `frontend/src/lib/queries/nodexs.ts`.

**Produce:**
- Los tipos `Reminder`, `ReminderItem` y `BrokenLink`, `Nodex.reminder`, y `LinkPreview.archiveUrl` y `LinkPreview.lastCheckedAt`.
- `formatDateTime(iso)`, `toDateTimeInput(iso)` → `"AAAA-MM-DDTHH:mm"` local, y `fromDateTimeInput(value)` → ISO.
- Las consultas y mutaciones de la especificación.
- `useCreateNodex` y `useUpdateNodex` con `reminder?: string | null`.
- `["alerts"]` dentro de `useInvalidateNodexs`.

- [ ] Implementar y pasar la comprobación global.

### Tarea 2: ventana del Nodex y tarjeta

**Archivos:** `frontend/src/components/nodex-dialog.tsx` y `frontend/src/components/nodex-card.tsx`.

**Usa** lo que produce la tarea 1.

- [ ] Sección "Recordatorio":
  - Estado `remindAt: string | null` (ISO) y `reminderOn: boolean`.
  - Atajos calculados en el clic.
  - Texto "Avisado el …" si `nodex.reminder.sentAt` existe y la fecha no ha cambiado.
  - Al guardar: `reminder: null` si se apaga y existía; el ISO si cambió; `undefined` en los demás casos, incluido el interruptor encendido sin fecha.
- [ ] Estado del enlace con "Comprobar ahora" (con `useRefreshLink` y rueda) y "Ver copia".
- [ ] Etiquetas de la tarjeta.
- [ ] Comprobación global y prueba en el navegador: los atajos, guardar, reabrir con la misma hora y la fecha pasada (puntos de revisión 2, 3 y 4).

### Tarea 3: campana y aviso al llegar la hora

**Archivos:** `frontend/src/components/alerts-button.tsx` (nuevo), `frontend/src/components/sidebar.tsx` y `frontend/src/components/tour.tsx`.

**Produce:** `AlertsButton({ className })`, que el `Sidebar` pinta entre la navegación y Ajustes.

- [ ] Popover con los tres apartados, "Todo al día", "Abrir" (`router.push`) y "Descartar".
- [ ] Número rojo con `aria-label` "Avisos, N pendientes".
- [ ] Aviso de los recordatorios nuevos:
  - Un `useRef<Set<string> | null>` con los ids vencidos ya vistos. Se rellena en la primera carga sin avisar.
  - En las siguientes, `toast` solo para los ids nuevos, con la acción "Abrir".
  - Se hace en un efecto que depende de `due.data`.
- [ ] Paso del tutorial: "Avisos: tus recordatorios y los enlaces que han dejado de funcionar".
- [ ] Comprobación global y prueba en el navegador: un recordatorio a 1–2 minutos (número rojo, aviso, Descartar), "Abrir" desde `/tareas` y un enlace roto (puntos de revisión 1 y 5).

### Tarea 4: documentación, prueba y revisión

- [ ] Sección "Avisos" en `docs/09-frontend.md` y la clave `["alerts", …]` en su tabla.
- [ ] Revisión independiente (opus) con los puntos de revisión. Corregir lo que se confirme.
- [ ] Borrar el usuario de prueba y dar a Jose el commit y el PR.
