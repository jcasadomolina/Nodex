# Plan: IA en el dispositivo

> **Para agentes:** usar superpowers:executing-plans o superpowers:subagent-driven-development. Los pasos usan casillas (`- [ ]`).

**Objetivo:** que el backend no cargue nunca el modelo de embeddings y quepa en los 512 MB de Render Free. El dispositivo calcula los vectores y el backend los guarda y compara.

**Arquitectura:** el backend expone los Nodexs pendientes de vector (con su texto ya preparado) y un `PUT` para guardar cada vector. El frontend carga el modelo en un Web Worker, si el usuario lo acepta, y sincroniza los pendientes. Los vectores de la demo van precalculados en un JSON.

**Stack:** Express 5 + Prisma 7 + pgvector · Next 16 + React 19 + TanStack Query + sonner · `@huggingface/transformers` 4.3.1 · Vitest + Supertest · Playwright

**Spec:** [docs/disenos/2026-11-02-ia-en-el-dispositivo-design.md](../disenos/2026-11-02-ia-en-el-dispositivo-design.md)

## Restricciones globales

- Modelo `Xenova/paraphrase-multilingual-MiniLM-L12-v2`, `dtype: "q8"`, `pooling: "mean"`, `normalize: true`, 384 dimensiones, igual en backend (tests y script) y frontend.
- `@huggingface/transformers` en la misma versión (4.3.1) en los dos lados; en el backend pasa a `devDependencies`.
- Código sin comentarios, en español lo visible, rueda de carga (`Spinner`) y no esqueletos.
- Git lo hace Jose: los pasos de "commit" son solo un punto de control; se dejan los cambios sin commitear.
- Textos fijos del spec, literales:
  - Aviso: `Nodex puede descargar su IA a este dispositivo (~120 MB, una sola vez) para ordenar y buscar tus Nodexs. Tus notas no salen del dispositivo para esto.` con botones `Descargar` y `Ahora no`.
  - Ajustes: sección `IA en este dispositivo`, estado `Lista`, botón `Borrar el modelo`.
  - Sugerencias con la IA en `off`: `La IA está desactivada en este dispositivo. Actívala en Ajustes.`
- Preferencia en `localStorage`, clave `nodex-ai`, valores `"on"` / `"off"` / ausente.

## Puntos de revisión

1. **Editar mientras se calcula el vector:** el `PUT` llega con el texto viejo → `409`, no se guarda y el Nodex sigue pendiente (test en la tarea 1).
2. **Nodex en la papelera o ajeno:** `PUT` → `404`; los pendientes no los incluyen (tests en la tarea 1).
3. **Dos sincronizaciones a la vez** (crear dos Nodexs seguidos): no se envía dos veces el mismo vector a la vez; la segunda espera a la primera (test en la tarea 3).
4. **Sin conexión durante la descarga:** el estado vuelve a `desactivado` con un toast de error y se puede reintentar (test en la tarea 3).
5. **Más de 50 pendientes** (usuario con muchos Nodexs que activa la IA tarde): la sincronización pide páginas hasta vaciar la lista (test en la tarea 3).

---

### Tarea 1: Backend sin modelo

**Archivos:**
- Modificar: `backend/src/modules/ai/ai.service.ts`, `backend/src/modules/ai/suggestions.routes.ts`, `backend/src/modules/nodexs/nodexs.routes.ts`, `backend/src/modules/nodexs/nodexs.schemas.ts`, `backend/src/test/helpers.ts`, `backend/package.json`
- Borrar: `backend/src/scripts/ai-backfill.ts` y el script `ai:backfill` de `package.json`
- Tests: `backend/src/modules/nodexs/nodexs.routes.test.ts`, `backend/src/modules/ai/suggestions.routes.test.ts`, `backend/src/modules/board/board.routes.test.ts`

**Interfaces:**
- Produce:
  - `GET /api/nodexs/pending-embeddings` → `200 { nodexs: { id: string; text: string }[] }` (máx. 50, sin vector, `deleted_at IS NULL`, del usuario).
  - `PUT /api/nodexs/:id/embedding` body `{ text: string; embedding: number[] }` → `200 { duplicates: NodexMatch[] }` | `400` | `404` | `409`.
  - `POST /api/nodexs/search` body `{ q, limit?, embedding? }` → `200 { nodexs }` (mismo formato que el `GET` de ahora, que se elimina).
  - `POST /api/nodexs` → `201 { nodex }` (sin `duplicates`).
  - En `ai.service.ts`: `nodexText` exportada; `saveEmbedding(userId, nodexId, text, embedding): Promise<Match[] | null>` (`null` = el texto no coincide); `searchNodexs(userId, query, limit, embedding?: number[])`.
  - En `helpers.ts`: `embedPending(agent: Agent): Promise<void>`, que sustituye a `waitForEmbeddings`.

- [ ] **Paso 1: tests nuevos en `nodexs.routes.test.ts`** (fallan):
  - `pending-embeddings devuelve los Nodexs propios sin vector con su texto`: crea un Nodex con título `Receta de paella` → la respuesta contiene `{ id, text }` con `text` que empieza por `Receta de paella`; un Nodex de otro usuario y uno en la papelera no aparecen.
  - `PUT embedding guarda el vector y deja de estar pendiente`: tras `embedPending`, `pending-embeddings` devuelve `[]`.
  - `PUT embedding responde 400 si no son 384 números`: `embedding: [1, 2]` → 400; 383 números → 400; 384 elementos con un texto dentro → 400.
  - `PUT embedding responde 404 con un Nodex ajeno o en la papelera`.
  - `PUT embedding responde 409 si el Nodex cambió`: pide pendientes, hace `PATCH` del título y manda el `PUT` con el `text` viejo → 409, y sigue en pendientes.
  - `PUT embedding devuelve duplicados`: dos Nodexs con el mismo título y contenido; tras `embedPending` del primero, el `PUT` del segundo devuelve `duplicates` con el primero.
  - `PATCH del título deja el vector a NULL`: tras `embedPending` y un `PATCH` de `title` → vuelve a pendientes. Un `PATCH` solo de `priority` no lo vuelve pendiente.
  - `POST search con y sin embedding`: sin `embedding` encuentra por texto; con el vector de `paella` encuentra `Receta de paella` buscando `arroz valenciano`.
- [ ] **Paso 2:** `npm test -- nodexs.routes` en `backend/` → FALLAN.
- [ ] **Paso 3: implementar.**
  - Schemas: `embeddingSchema = z.array(z.number().finite()).length(384)`; `saveEmbeddingSchema = z.object({ text: z.string(), embedding: embeddingSchema })`; `searchNodexsSchema` pasa a body con `embedding: embeddingSchema.optional()` y `limit` sin `coerce`.
  - `saveEmbedding`: lee el Nodex (del usuario, no borrado; si no, `HttpError(404)`), compara `nodexText(nodex) === text` (si no, `null`), hace el `UPDATE ... embedding = toVector(embedding)`, luego `findDuplicates` y `suggestGroup`, y devuelve los duplicados. La ruta responde `409` con `{ error: "El Nodex ha cambiado" }` si es `null`, y si no `loadInOrder` de los duplicados.
  - `toVector` se queda en `lib/embeddings.ts`, pero eso importaría transformers en producción: muévela a `ai.service.ts` (o a `lib/vector.ts`) y que `embeddings.ts` solo exporte `embed`.
  - `PATCH`: si cambia título, contenido o URL, añadir `embedding: null` al `UPDATE`. `embedding` es `Unsupported("vector")` en Prisma, así que se hace con `$executeRaw` tras el `update`.
  - Borrar `updateEmbedding`, `processNodex`, `processInBackground`, `checkNewNodex` y la llamada a `embed` de `searchNodexs` (usa `toVector(embedding)` o `null`). En `/suggestions/refresh`, quitar el bucle de `withoutEmbedding`.
  - `@huggingface/transformers` a `devDependencies` (`npm i -D @huggingface/transformers@4.3.1`).
- [ ] **Paso 4:** `helpers.ts`: `embedPending(agent)` pide `GET /api/nodexs/pending-embeddings` en bucle hasta vaciarla, y por cada uno hace `embed(text)` y `PUT`. Borrar `waitForEmbeddings`. Pasar `suggestions.routes.test.ts` y `board.routes.test.ts` a `embedPending`, y el `GET /search` de los tests a `POST`.
- [ ] **Paso 5:** `docker compose up -d db-test` y `npm test` en `backend/` → todo en verde. `grep -rn "lib/embeddings" backend/src --include=*.ts | grep -v test` → solo `scripts/demo-embeddings.ts` (tras la tarea 2) o nada.
- [ ] **Paso 6: punto de control** (Jose hace el commit).

### Tarea 2: Demo con vectores precalculados

**Archivos:**
- Crear: `backend/src/scripts/demo-embeddings.ts`, `backend/src/modules/demo/demo.embeddings.json`
- Modificar: `backend/src/modules/demo/demo.service.ts`, `backend/package.json` (script `demo:embeddings`)
- Test: `backend/src/modules/demo/demo.routes.test.ts` (o el archivo de tests de la demo que exista)

**Interfaces:**
- Consume: `nodexText` de la tarea 1.
- Produce: `demo.embeddings.json` = `{ title: string; text: string; embedding: number[] }[]`, en el orden de `DEMO_NODEXS`.

- [ ] **Paso 1: tests** (fallan):
  - `los vectores de la demo están al día`: para cada `DEMO_NODEXS[i]`, `nodexText(...)` es igual a `json[i].text` y `json[i].embedding.length === 384`.
  - `la demo se crea sin pendientes`: tras `POST /api/auth/demo`, `GET /api/nodexs/pending-embeddings` devuelve `[]` y hay sugerencias o propuestas de grupo (como comprueba hoy el test de la demo).
- [ ] **Paso 2:** el script recorre `DEMO_NODEXS`, arma el texto con `nodexText` (con `content` y `url` a `null` si faltan), calcula con `embed` y escribe el JSON con números redondeados a 6 decimales. Lanzar `npm run demo:embeddings` y comprobar que el JSON tiene 26 entradas.
- [ ] **Paso 3:** `createDemoUser` guarda los vectores dentro de la transacción (un `UPDATE nodexs SET embedding = v.e::vector FROM (SELECT unnest(ids), unnest(vectores))`, o uno por Nodex). `prepareDemoAi(userId, orphanIds, linkIds)` hace `suggestGroup` para los huérfanos, `proposeNewGroups` y las vistas previas de enlaces. No importa `embeddings.ts`.
- [ ] **Paso 4:** `npm test` en `backend/` → verde. Medir la memoria: `npm run build && node dist/src/server.js`, crear una demo con `curl` y comprobar que el RSS (Administrador de tareas) queda muy por debajo de 300 MB.
- [ ] **Paso 5: punto de control.**

### Tarea 3: Núcleo de IA en el frontend

**Archivos:**
- Crear: `frontend/src/lib/ai/embedding-worker.ts`, `frontend/src/lib/ai/ai.ts`, `frontend/src/lib/ai/sync.ts`
- Test: `frontend/src/lib/ai/ai.test.ts`, `frontend/src/lib/ai/sync.test.ts`
- Modificar: `frontend/package.json` (`@huggingface/transformers@4.3.1`)

**Interfaces:**
- Produce (`ai.ts`):
  - `type AiStatus = { state: "off" } | { state: "loading"; progress: number } | { state: "ready" }`
  - `getPreference(): "on" | "off" | null`, `setPreference(value: "on" | "off"): void`
  - `useAiStatus(): AiStatus` (con `useSyncExternalStore`)
  - `enableAi(): Promise<void>` (guarda `on` y carga el modelo; si falla, `off` en el estado, sin tocar la preferencia, y lanza el error), `disableAi(): void`, `deleteModel(): Promise<void>` (`caches.delete("transformers-cache")`)
  - `embed(text: string): Promise<number[] | null>` (`null` si el estado no es `ready`)
- Produce (`sync.ts`): `syncPending(): Promise<Map<string, NodexMatch[]>>` (duplicados por id de Nodex enviado).
- Worker: mensajes `{ type: "load" }` → `{ type: "progress", progress }` / `{ type: "ready" }` / `{ type: "error", message }`; `{ type: "embed", id, text }` → `{ type: "vector", id, embedding }`.

- [ ] **Paso 1: tests** con el worker simulado (`vi.mock`), `api` simulado y `localStorage` de jsdom:
  - `ai.test.ts`:
    - `getPreference` es `null` al principio y `setPreference("off")` lo guarda en `nodex-ai`.
    - `embed` devuelve `null` mientras el estado es `off`.
    - Si el worker manda `error` durante `enableAi`, el estado vuelve a `off` y `enableAi` rechaza.
  - `sync.test.ts`:
    - Con dos pendientes, manda dos `PUT` con `{ text, embedding }` y devuelve sus duplicados en el `Map`.
    - Un `PUT` con `409` se ignora y no rompe el resto.
    - Con 50 pendientes en la primera página y 1 en la segunda, procesa los 51.
    - Con `embed` devolviendo `null`, no llama a la API.
    - Dos `syncPending()` seguidos no mandan el mismo id dos veces a la vez (la segunda espera a la primera).
- [ ] **Paso 2:** `npm test -- lib/ai` en `frontend/` → FALLAN.
- [ ] **Paso 3: implementar.** El worker se crea con `new Worker(new URL("./embedding-worker.ts", import.meta.url), { type: "module" })`, solo en el navegador y al llamar a `enableAi`. Dentro del worker: `pipeline("feature-extraction", MODEL, { dtype: "q8", progress_callback })`; el progreso es el del archivo `.onnx`. Al arrancar la app con la preferencia `on`, `ai.ts` carga el modelo solo (ya está en la caché). `syncPending` encadena llamadas en una promesa a nivel de módulo; pagina `GET /nodexs/pending-embeddings` hasta que una página no tenga ids nuevos.
- [ ] **Paso 4:** `npm test` y `npm run build` en `frontend/` → verde. El build comprueba que Turbopack empaqueta el worker.
- [ ] **Paso 5: punto de control.**

### Tarea 4: Integración en la interfaz

**Archivos:**
- Crear: `frontend/src/components/ai-prompt.tsx` (el toast), `frontend/src/components/ai-settings.tsx` (la sección de Ajustes)
- Modificar: `frontend/src/lib/queries/nodexs.ts` (`useCreateNodex`, `useUpdateNodex`, `useSearch`), `frontend/src/components/settings-dialog.tsx`, `frontend/src/components/suggestions-button.tsx`, `frontend/src/app/(app)/layout.tsx`

**Interfaces:**
- Consume: todo lo de la tarea 3.

- [ ] **Paso 1:** `useCreateNodex`: tras el `POST`, `duplicates = (await syncPending()).get(nodex.id) ?? []` y devuelve `{ nodex, duplicates }`, así `nodex-dialog.tsx` no cambia. `useUpdateNodex`: en `onSettled`, `syncPending()` sin esperar. `useSearch`: `POST /nodexs/search` con `{ q, embedding: await embed(q) ?? undefined }`, y añadir el estado de la IA a la `queryKey` para repetir la búsqueda cuando el modelo esté listo.
- [ ] **Paso 2:** `AiPrompt` en el layout de `(app)`: si `getPreference() === null`, `toast(...)` con `duration: Infinity`, el texto literal y las acciones `Descargar` (`enableAi`, con `toast.error("No se ha podido descargar la IA")` si falla) y `Ahora no` (`setPreference("off")`). El layout también lanza `syncPending()` cuando `useAiStatus()` pasa a `ready`.
- [ ] **Paso 3:** `AiSettings` debajo de `PushButton` en `settings-dialog.tsx`: título `IA en este dispositivo`, un interruptor (`role="switch"`, accesible por teclado), `Spinner` con `{progress} %` mientras carga, `Lista` cuando está lista, y el botón `Borrar el modelo` cuando está desactivada.
- [ ] **Paso 4:** en el panel de sugerencias, si `getPreference() === "off"`, mostrar el texto literal de IA desactivada.
- [ ] **Paso 5:** `npm run lint`, `npm test` y `npm run build` en `frontend/` → verde. Probar a mano en local (backend y frontend en marcha):
  - sale el aviso, **Descargar** muestra el progreso en Ajustes y llega a `Lista`;
  - crear dos Nodexs iguales muestra el aviso de duplicados;
  - una búsqueda por significado encuentra resultados;
  - **Ahora no** no vuelve a preguntar.

  Medir el tiempo de descarga y de un vector.
- [ ] **Paso 6: punto de control.**

### Tarea 5: E2E y documentación

**Archivos:**
- Modificar: `e2e/preparar.setup.ts`, `e2e/helpers.ts`, `e2e/busqueda.spec.ts` y los specs que creen contextos nuevos sin `storageState`
- Crear: `e2e/ia.spec.ts`
- Modificar docs: `docs/06-sistema-backend.md`, `docs/09-frontend.md`, `docs/10-pruebas.md`, `docs/11-despliegue.md`, `docs/02-plan-de-implementacion.md`

- [ ] **Paso 1:** el usuario compartido y `register` dejan `localStorage["nodex-ai"] = "off"` antes de guardar el estado o de entrar. Así ningún spec descarga el modelo.
- [ ] **Paso 2:** `ia.spec.ts`:
  - `pregunta por la IA y recuerda "Ahora no"`: usuario nuevo sin la clave → ve el texto del aviso, pulsa `Ahora no`, recarga y el aviso no vuelve; en sugerencias ve el texto de IA desactivada.
- [ ] **Paso 3:** `npx playwright test` en `e2e/` → verde.
- [ ] **Paso 4:** documentación, nivel junior:
  - `06`: por qué la IA salió del servidor (las medidas de memoria), los endpoints nuevos y el `409`. Quitar `ai:backfill`.
  - `09`: el worker, `ai.ts`, la sincronización, el aviso y Ajustes.
  - `10`: `embedPending` y la IA en `off` en E2E.
  - `11`: la URL `https://nodex-api-pstg.onrender.com`, que Render ya cabe en 512 MB y `npm run demo:embeddings`.
  - `02`: estado.
- [ ] **Paso 5:** dar a Jose el título y la descripción del commit y del PR. Después del despliegue, comprobar en producción la memoria de Render en *Metrics* al crear una demo y la descarga del modelo en el móvil.
