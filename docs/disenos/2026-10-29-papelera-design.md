# Diseño: Papelera (HU-15)

Fecha: 2026-10-29 · Rama: `feature/papelera` · Requisitos: `RF-15.1` a `RF-15.4`

Borrar un Nodex o un grupo ya era un borrado lógico (`deleted_at`). Esta rama permite verlos, restaurarlos y eliminarlos para siempre.

## Backend (`modules/trash`)

- **`GET /trash`:** devuelve `{ nodexs: [{ id, title, type, deletedAt }], groups: [{ id, name, deletedAt, nodexCount }] }`, de lo más reciente a lo más antiguo. `nodexCount` cuenta los Nodexs del grupo que no están borrados.
- **`POST /trash/nodexs/:id/restore`:** vuelve a poner `deletedAt = null` (`204`, o `404` si no está en la papelera). Sus relaciones (grupos, etiquetas, tarea, recordatorio y vista previa) nunca se borraron.
- **`POST /trash/groups/:id/restore`:** igual. Si ya hay un grupo activo con ese nombre, usa `«nombre» (restaurado)` y, si también existe, `(restaurado 2)`, `(restaurado 3)`… El nombre base se recorta para no pasar de 80 caracteres. Responde `200 { group: { id, name } }`.
- **`DELETE /trash/nodexs/:id` y `DELETE /trash/groups/:id`:** borrado definitivo de uno que esté en la papelera (`204` o `404`). Las tablas relacionadas se borran en cascada; las sugerencias de IA que apuntaban a un grupo se quedan sin grupo.
- **`DELETE /trash`:** vacía la papelera del usuario y responde `{ nodexs, groups }` con lo que se ha borrado.
- **`trash.worker.ts`:** cada hora (y al arrancar) borra definitivamente, de todos los usuarios, lo que lleve más de `TRASH_DAYS = 30` días borrado. Se arranca en `server.ts`, como los otros procesos.

## Frontend

- **Ajustes:** enlace "Papelera" (icono `Trash2`) debajo de "Perfil".
- **`app/(app)/papelera/page.tsx`:**
  - `TopBar` "Papelera" y pestañas "Nodexs (N)" y "Grupos (N)".
  - Cada fila:
    - Título o nombre, y "Borrado hace X días · se elimina en Y días" (los grupos añaden "N Nodexs").
    - "Restaurar", con rueda.
    - "Eliminar para siempre", con un `ConfirmDialog` cuyo botón dice "Eliminar".
  - "Vaciar papelera", con confirmación: "Se eliminarán para siempre N elementos".
  - Estados: rueda, error con Reintentar y "La papelera está vacía".
  - Al restaurar un grupo, el aviso muestra el nombre final: "Grupo «Cocina (restaurado)» restaurado". Un grupo que ya se llamaba «X (restaurado)» no acumula sufijos: pasa a «X (restaurado 2)».
- **`lib/queries/trash.ts`:** `useTrash` (clave `["trash"]`), `useRestore`, `useDeleteForever` y `useEmptyTrash`. Todas invalidan como `useInvalidateNodexs`, que ahora también incluye `["trash"]`.
- **Deshacer:** los avisos "Enviado a la papelera" de la ventana del Nodex y del menú de grupo llevan la acción "Deshacer", que llama a la ruta de restaurar.

## Pruebas

- **Script temporal contra la API:**
  - Borrar y restaurar un Nodex con sus grupos y etiquetas.
  - Un grupo con el nombre ocupado, dos veces.
  - Eliminar uno y vaciar la papelera.
  - Que no se puedan tocar los Nodexs de otro usuario ni los que no están borrados.
  - La limpieza de más de 30 días, ejecutando `purgeTrash()` con fechas puestas a mano.
- **Navegador** y revisión independiente.

## Fuera de alcance

Acciones sobre varios elementos a la vez, búsqueda en la papelera y avisar antes de borrar definitivamente.
