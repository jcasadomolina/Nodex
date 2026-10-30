# Diseño: grupos nuevos con IA (`RF-04.3`)

Fecha: 2026-10-28 · Rama: `feature/ia-grupos-nuevos`

La IA propone crear grupos nuevos para huérfanos parecidos entre sí. No hay LLM: se usan los embeddings que ya existen y el nombre se saca de palabras clave. No hace falta migración: `ai_suggestions` ya admite `kind = "new_group"` y `suggested_name`. Cada propuesta son varias filas (una por Nodex) con el mismo `suggested_name`.

## Cuándo

Solo al pulsar "Revisar huérfanos" (`POST /suggestions/refresh`). Cada revisión borra las propuestas `new_group` pendientes del usuario y las vuelve a calcular.

## Agrupación (`proposeNewGroups(userId)` en `ai/new-groups.ts`)

1. **Candidatos.** Huérfanos activos con embedding, sin una sugerencia `assign_group` pendiente y sin ninguna `new_group` rechazada.
2. **Parejas.** Se obtienen con SQL entre candidatos con similitud ≥ `NEW_GROUP_SIMILARITY = 0.55`.
3. **Agrupación en estrella** (`clusterByNeighbors`, función pura). Se toma el candidato con más vecinos aún libres y el grupo es él más esos vecinos, como máximo 20, prefiriendo los más parecidos. Si el grupo tiene al menos 3 (`MIN_NEW_GROUP_SIZE`), se guarda y sus miembros quedan ocupados. Se repite hasta que no queden grupos válidos.
4. **Nombre** (`suggestName`, función pura):
   - Si al menos la mitad de los Nodexs comparten una etiqueta, se usa la etiqueta más común.
   - Si no, se usa la palabra que aparece en más títulos (como mínimo en 2), comparando sin tildes ni mayúsculas, con al menos 3 letras y fuera de una lista de palabras vacías en español e inglés. Se muestra con la primera letra en mayúscula y en la forma en que aparece más veces.
   - Si el nombre choca con un grupo existente o con otra propuesta de la misma revisión, se prueba el siguiente candidato. Si no queda ninguno, "Grupo sugerido", "Grupo sugerido 2", etc.

## API

- `GET /suggestions` devuelve además `newGroups: [{ name, nodexs: [{ id, title, type }] }]`. Solo con Nodexs que siguen siendo huérfanos y activos, y solo las propuestas que aún tienen 2 o más.
- `POST /suggestions/refresh` responde con `{ reviewed, pending, newGroups }`, donde `newGroups` es el número de propuestas.
- `POST /suggestions/new-groups/accept { name, groupName }`:
  - Crea el grupo `groupName` (validado como al crear un grupo), mete los Nodexs huérfanos de la propuesta (`addedBy: "ai"`) y marca las filas como `accepted`.
  - Responde `409` si ya existe un grupo con ese nombre y `404` si la propuesta no existe.
  - Todo va en una transacción.
- `POST /suggestions/new-groups/reject { name }`: marca las filas como `rejected` (`204`) o responde `404`.

## Interfaz (Popover ✨)

- Apartado "Grupos nuevos" bajo las sugerencias. Cada propuesta tiene:
  - Un campo con el nombre, editable.
  - "N Nodexs" en un `<details>` con los títulos (pulsar uno abre el Nodex).
  - Los botones "Crear grupo" (con rueda) y "Rechazar".
- El número del botón ✨ cuenta las sugerencias más las propuestas.
- Si no hay nada pendiente, el botón ✨ se oculta como hasta ahora.
- El aviso de la revisión dice "Revisados: N huérfanos · X sugerencias · Y grupos nuevos".
- Al crear o rechazar se invalidan las mismas claves que al editar un Nodex.

## Pruebas

- **Backend:** `ai/new-groups.test.ts` con `node:test` y `assert` (`npx tsx --test`):
  - `clusterByNeighbors`: dos estrellas separadas, una cadena que no se une y un grupo de menos de 3 que se descarta.
  - `suggestName`: etiqueta compartida, palabra repetida con tildes, choque con un nombre existente y el nombre por defecto.
- **Navegador:** con un usuario `@nodex.test` con 4 huérfanos de cocina, 3 de viajes y 1 suelto: revisar, renombrar, crear y rechazar.
- Revisión independiente al final.

## Fuera de alcance

Quitar Nodexs sueltos de una propuesta antes de crearla, generar propuestas automáticamente al guardar y usar un LLM para el nombre.
