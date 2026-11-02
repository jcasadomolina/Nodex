# Diseño: IA en el dispositivo

Fecha: 2026-11-02 · Rama: `feature/ia-en-el-dispositivo` · Motivo: el backend no cabe en los 512 MB de Render Free

El modelo de embeddings (`Xenova/paraphrase-multilingual-MiniLM-L12-v2`, `q8`, 384 dimensiones) ocupa unos **550 MB de pico** él solo, medido con el código compilado y sin Express ni Prisma. En Render Free (512 MB) el servidor se reinicia cada vez que calcula un embedding, por ejemplo al crear una demo. Ningún ajuste de onnxruntime lo baja (`graphOptimizationLevel` `disabled` o `basic`: igual; `q4`: 870 MB).

La solución es que **el dispositivo calcule los vectores** (navegador, PWA y más adelante APK y `.exe`) y el backend solo los guarde y los compare con pgvector, que no necesita el modelo.

## Decisiones

| Pregunta | Decisión | Por qué |
|----------|----------|---------|
| Dónde se calcula la IA | En el **dispositivo**, con `@huggingface/transformers` en un Web Worker | Gratis, sin terceros: las notas no salen del dispositivo para calcular la IA. Sirve igual para web, PWA, APK y `.exe`. Mismo modelo y mismos vectores que hoy: no hay que recalcular nada |
| Si el modelo no está listo al crear | **Se guarda al momento sin vector** y se completa después | Nunca se bloquea al usuario. Duplicados y sugerencias llegan un poco más tarde |
| Cuándo se descarga el modelo (~120 MB) | **Se pregunta antes**, y hay un interruptor en Ajustes | No todos los usuarios aceptan que se llene la memoria o se gasten datos sin preguntar |
| Cómo llega el vector al backend | **Endpoint aparte** (`PUT /nodexs/:id/embedding`) más una lista de pendientes | Un solo camino para todo: el Nodex recién creado, los creados sin IA, los de otro dispositivo y los que fallaron |
| Demo | **Vectores precalculados** en un JSON | El servidor nunca carga el modelo y la demo se crea en segundos |

Fuera de alcance: el modelo dentro del APK, cambiar de modelo y la API de Gemini.

## Backend

### Endpoints nuevos

- `GET /api/nodexs/pending-embeddings` devuelve `{ nodexs: [{ id, text }] }`: hasta 50 Nodexs del usuario sin vector y fuera de la papelera. `text` es el resultado de `nodexText` (título, contenido, dominio y palabras de la URL), la misma función de hoy. La receta del texto vive solo en el backend: el frontend calcula el vector del `text` que recibe, sin saber cómo se arma.
- `PUT /api/nodexs/:id/embedding` con `{ text, embedding }`:
  - zod valida que `embedding` son exactamente 384 números finitos (`400` si no);
  - el Nodex tiene que ser del usuario y no estar borrado (`404` si no);
  - si `text` ya no coincide con el `nodexText` actual, el Nodex cambió mientras se calculaba: no se guarda nada y responde `409`. El siguiente ciclo lo recalcula con el texto nuevo;
  - si todo cuadra, guarda el vector, busca duplicados, sugiere grupo y responde `{ duplicates }`, con el mismo formato de Nodex que devolvía antes `POST /nodexs`.

### Endpoints que cambian

- `POST /api/nodexs` no calcula nada y deja de devolver `duplicates`.
- `PATCH /api/nodexs/:id`: si cambia el título, el contenido o la URL, pone `embedding = NULL`. Ya no lanza nada en segundo plano.
- `GET /api/nodexs/search?q=` pasa a `POST /api/nodexs/search` con `{ q, limit?, embedding? }`, porque 384 números no caben bien en una URL. La consulta SQL no cambia: con el vector a `NULL` ya busca solo por texto.
- `POST /api/suggestions/refresh` deja de rellenar embeddings. Solo sugiere grupo a los huérfanos y propone grupos nuevos con los vectores que ya hay.

### Lo que se borra

- Las llamadas a `embed()` en la app: `checkNewNodex`, `processNodex`, `processInBackground`, `updateEmbedding` y la parte de IA de `searchNodexs`.
- `scripts/ai-backfill.ts`: ahora rellena el frontend con los pendientes.
- `@huggingface/transformers` pasa a `devDependencies`. `lib/embeddings.ts` queda solo para los tests y el script de la demo; en Render no se carga nunca.

### Seguridad

Todo va detrás de `requireAuth` y filtrado por `user_id`, como el resto de rutas: nadie puede escribir vectores en Nodexs ajenos. Un vector con sentido raro solo estropea las sugerencias de los propios Nodexs del usuario que lo manda.

## Frontend

### Piezas

- **Dependencia nueva:** `@huggingface/transformers`, la misma versión que el backend. En el navegador funciona con WebAssembly. El modelo se descarga del CDN de Hugging Face y queda en la caché del navegador.
- **`lib/ai/embedding-worker.ts`:** Web Worker que carga el modelo (`q8`) y calcula vectores con `pooling: "mean"` y `normalize: true`, igual que el backend. Va aparte del hilo principal para que la pantalla no se congele. Avisa del progreso de la descarga.
- **`lib/ai/ai.ts`:** lo único que usa el resto de la app:
  - la preferencia del dispositivo en `localStorage` (`on`, `off` o sin decidir). Es por dispositivo porque el modelo se guarda en cada uno;
  - el estado del modelo: `desactivado`, `descargando` (con porcentaje) o `listo`;
  - `embed(text)`, que devuelve el vector o `null` si la IA no está lista.
- **Sincronización de pendientes:** un hook en el layout de `(app)`. Cuando el modelo está listo, y después de cada crear o editar, pide los pendientes, calcula los vectores uno a uno y los manda con `PUT`. Si el `PUT` del Nodex que se acaba de crear devuelve duplicados, sale el aviso de duplicados de ahora. Un `409` se ignora; cualquier otro fallo deja el Nodex pendiente para el siguiente ciclo.
- **Búsqueda:** manda `{ q, embedding }` si la IA está lista y `{ q }` si no.

### Interfaz

- **Aviso de descarga:** la primera vez que se entra en la app con la preferencia sin decidir, sale un toast fijo de sonner que no se cierra solo: *"Nodex puede descargar su IA a este dispositivo (~120 MB, una sola vez) para ordenar y buscar tus Nodexs. Tus notas no salen del dispositivo para esto."* Tiene dos botones, **Descargar** y **Ahora no**. Es un toast y no un diálogo para no tapar la app ni chocar con el tutorial.
- **Ajustes:** sección **"IA en este dispositivo"** debajo de las notificaciones push, con un interruptor. Mientras descarga muestra la rueda de carga (`Spinner`) y el porcentaje; al terminar, *"Lista"*. Al desactivarla deja de usarse y ofrece **"Borrar el modelo"** para liberar el espacio.
- **Si dijo "Ahora no":** no se vuelve a preguntar. El panel de sugerencias muestra *"La IA está desactivada en este dispositivo. Actívala en Ajustes."*

### Fallos

- Si la descarga falla (sin conexión, por ejemplo), el estado vuelve a `desactivado`, sale un toast de error y el interruptor permite reintentar.
- La app nunca se bloquea por la IA: guardar, editar y buscar por texto funcionan siempre.

## Demo

- **`backend/src/scripts/demo-embeddings.ts`** (`npm run demo:embeddings`) calcula los vectores de los 26 Nodexs de la demo con `nodexText` y el modelo, y los guarda en `modules/demo/demo.embeddings.json` junto al texto de cada uno, redondeados a 6 decimales. Se ejecuta a mano solo cuando cambian los datos de la demo.
- **`createDemoUser`** guarda esos vectores en la misma transacción que crea los Nodexs. **`prepareDemoAi`** solo sugiere grupo a los huérfanos y propone grupos nuevos.
- Un test comprueba que el texto guardado de cada Nodex coincide con su `nodexText` actual. Si alguien cambia `demo.data.ts` sin regenerar, el test falla.

## Pruebas

- **Backend (Vitest + Supertest):**
  - Tests nuevos:
    - `GET /pending-embeddings`: solo los del usuario, sin los de la papelera, con su `text`.
    - `PUT /embedding`:
      - guarda el vector, devuelve duplicados y crea la sugerencia de grupo;
      - `400` si no son 384 números;
      - `404` si el Nodex es de otro usuario;
      - `409` si el texto ya no coincide.
    - `PATCH` deja el vector a `NULL` al cambiar el texto.
    - `POST /search` funciona con vector y sin él.
    - La demo usa los vectores precalculados.
  - Los tests de IA existentes cambian `waitForEmbeddings` por un helper `embedPending(agent)` que hace lo mismo que el frontend: pide los pendientes, calcula con el modelo y manda el `PUT`.
- **Frontend (Vitest):** la sincronización con el modelo y la API simulados (envía los pendientes, ignora el `409`, no hace nada con la IA en `off`) y la lógica de la preferencia.
- **E2E (Playwright):** el usuario de pruebas entra con la IA en `off` para no descargar 120 MB en cada ejecución de la CI. La búsqueda se prueba por texto. Un spec corto comprueba que sale el aviso y que **Ahora no** se recuerda.
- **A mano:** la IA real en el navegador se prueba una vez en local y otra en producción: tiempo de descarga, velocidad por vector y memoria de Render en *Metrics*.

## Documentación

- `06-sistema-backend`: endpoints nuevos y por qué la IA se fue al dispositivo.
- `09-frontend`: el worker, el aviso y la sección de Ajustes.
- `10-pruebas`: el helper `embedPending` y la IA en `off` en E2E.
- `11-despliegue`: Render ya cabe en 512 MB y la URL real `https://nodex-api-pstg.onrender.com`.
- `02-plan-de-implementacion`: estado actualizado.
