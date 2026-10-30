# Grupos nuevos con IA: plan de implementación

> **Para agentes:** superpowers:executing-plans (modo nativo).

**Objetivo:** que "Revisar huérfanos" proponga grupos nuevos para huérfanos parecidos y que el Popover ✨ permita crearlos o rechazarlos.

**Especificación:** `docs/disenos/2026-10-28-ia-grupos-nuevos-design.md`

## Restricciones globales

- Sin comentarios en el código. Textos en español. Sin dependencias nuevas.
- Constantes: `NEW_GROUP_SIMILARITY = 0.55`, `MIN_NEW_GROUP_SIZE = 3`, `MAX_NEW_GROUP_SIZE = 20`.
- Claude no hace commits. Comprobaciones:
  - Backend: `npx tsc --noEmit` y `npx tsx --test src/modules/ai/new-groups.test.ts`.
  - Frontend: `npx tsc --noEmit && npx eslint src`.

## Puntos de revisión

1. **Huérfano repartido:** un huérfano con sugerencia `assign_group` pendiente nunca entra en un grupo nuevo.
2. **Propuesta obsoleta:** al aceptar una propuesta en la que algún Nodex ya tiene grupo o fue borrado, solo se meten los que siguen siendo huérfanos.
3. **Choque de nombres:** si el nombre escrito ya existe, se responde 409 con mensaje y no se crea nada.
4. **Dos revisiones seguidas:** no duplican propuestas.
5. **Rechazar:** un Nodex rechazado no reaparece en la siguiente revisión.

---

### Tarea 1: funciones puras y sus tests

**Archivos:** `backend/src/modules/ai/new-groups.ts` y `backend/src/modules/ai/new-groups.test.ts`.

**Produce:**
- `clusterByNeighbors(ids: string[], pairs: { a: string; b: string; similarity: number }[]): string[][]`
- `suggestName(nodexs: { title: string; tags: string[] }[], taken: Set<string>): string`. Los nombres de `taken` van en minúsculas.

- [ ] Escribir los tests de la especificación y ver que fallan.
- [ ] Implementar las dos funciones y ver que pasan.

### Tarea 2: backend (generar, listar, aceptar y rechazar)

**Archivos:** `new-groups.ts` (`proposeNewGroups`), `suggestions.routes.ts` y `backend/README.md`.

**Usa:** las funciones de la tarea 1 y `createGroupSchema` de `groups.schemas.ts` para validar `groupName`.

- [ ] `proposeNewGroups(userId): Promise<number>`:
  - Borra los `new_group` pendientes.
  - Obtiene los candidatos (SQL) y las parejas (SQL con `<=>` entre candidatos).
  - Agrupa, pone nombre (`taken` = grupos activos del usuario más los nombres ya elegidos) y hace `createMany` de las filas.
- [ ] `refresh` llama a `proposeNewGroups` después de las sugerencias y añade `newGroups` a la respuesta.
- [ ] `GET /` añade `newGroups`.
- [ ] Rutas `accept` y `reject`, con los códigos de la especificación.
- [ ] Comprobación con `curl` o `fetch` contra el servidor de prueba (puntos de revisión 1 a 5).

### Tarea 3: frontend

**Archivos:** `frontend/src/lib/types.ts` (`NewGroupProposal`), `lib/queries/suggestions.ts` y `components/suggestions-button.tsx`.

- [ ] `useSuggestions` devuelve `{ suggestions, newGroups }`. Ajustar quien lo usa.
- [ ] `useResolveNewGroup()`: `mutate({ name, groupName?, accept })`, con aviso "Grupo «X» creado" y los errores en un aviso.
- [ ] Apartado "Grupos nuevos" en el Popover, contador total y aviso del refresh con "grupos nuevos".
- [ ] Comprobación global y prueba en el navegador.

### Tarea 4: documentación y revisión

- [ ] `docs/09-frontend.md` (sugerencias) y `docs/06-sistema-backend.md` (marcar `RF-04.3`).
- [ ] Revisión independiente (opus). Corregir lo confirmado. Dar a Jose el commit y el PR.
