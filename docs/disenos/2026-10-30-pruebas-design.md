# Diseño: Bloque de pruebas

Fecha: 2026-10-30 · Ramas: `feature/pruebas-base`, `feature/pruebas-integracion`, `feature/pruebas-frontend`, `feature/pruebas-e2e` · Requisitos: el bloque 4 del [plan de implementación](../02-plan-de-implementacion.md), antes del alojamiento

Hoy solo hay 4 archivos de tests unitarios en el backend (`node:test`), ninguno en el frontend, ni integración, ni end-to-end, ni CI. Este bloque protege lo que ya funciona antes de publicar Nodex: cada PR comprobará solo que nada se ha roto.

## Decisiones

| Pregunta | Decisión | Por qué |
|----------|----------|---------|
| Base de datos de las pruebas | PostgreSQL con pgvector en **Docker** | Se crea vacía en segundos, se puede romper sin miedo y es la misma en el PC y en GitHub Actions. No toca Neon |
| Herramientas | **Vitest** (unitarias e integración, backend y frontend), **Supertest** (API) y **Playwright** (end-to-end) | Un solo estilo de test, entiende TypeScript y los alias `@/`. Supertest llama a Express sin abrir un puerto. Playwright usa un navegador de verdad |
| Alcance | **Por riesgo**, con CI en cada PR | Todos los endpoints, la lógica pura y los recorridos que haría un visitante. Sin objetivo de cobertura: los tests miran el comportamiento, no los detalles internos |
| Fallos que aparezcan | Se informan, no se arreglan sobre la marcha | Cada arreglo es una decisión de Jose y va en su propia rama |

## Base de datos de pruebas

- `compose.yaml` en la raíz con el servicio `db-test`: imagen `pgvector/pgvector:pg17` (PostgreSQL 17, como Neon), puerto **5433**, usuario y contraseña `nodex`/`nodex`, base `nodex_test` y datos en `tmpfs` (memoria). Cada arranque empieza vacío.
- `backend/vitest.config.ts` fija en `test.env`:
  - `DATABASE_URL` y `DIRECT_URL` a `postgresql://nodex:nodex@localhost:5433/nodex_test`;
  - `SESSION_SECRET` de prueba;
  - `NODE_ENV=test`.

  No son secretos y no hace falta ningún `.env`.
- Un `globalSetup` que, antes de los tests:
  1. **Se niega a seguir** si el host de `DATABASE_URL` no es `localhost` o `127.0.0.1`. Así nunca se toca Neon por error.
  2. Aplica las migraciones con `prisma migrate deploy`.
- Los tests no vacían la base: cada uno crea sus propios usuarios con email aleatorio (`test-<uuid>@ejemplo.com`), así no se pisan aunque Vitest los ejecute en paralelo.

## Backend (Vitest + Supertest)

### Unitarias

- Los 4 tests actuales pasan de `node:test` a Vitest: cambian los `import` (`describe`/`test`/`expect` en lugar de `node:assert`).
- Nuevas:
  - `nodexs.schemas`: `priorityToNumber` y `priorityToName` (ida y vuelta), la normalización de etiquetas (minúsculas, sin `#`, espacios a guiones, 30 caracteres, máximo 10, sin repetidas) y que un enlace exige URL.
  - `safe-fetch`: `safeFetch` rechaza con `BlockedUrlError` `http://127.0.0.1`, `http://10.0.0.1`, `http://169.254.169.254`, `http://[::1]` y los protocolos que no son `http` o `https`. Son IP literales, así que no sale nada a Internet.
  - `errorHandler`: un `ZodError` da `400` con `details` por campo, un `HttpError` da su código y mensaje, un JSON mal formado da `400` "El JSON enviado no es válido", y cualquier otro error da `500` sin filtrar el mensaje interno.

### Integración

- `backend/src/test/helpers.ts`:
  - `newUser()` registra un usuario con `supertest.agent(app)`, que guarda la cookie de sesión, y devuelve `{ agent, user }`;
  - `anonymous()` devuelve un agente sin sesión.
- **Límites de peticiones:**
  - `authLimiter`, `demoLimiter` y `refreshLimiter` se exportan;
  - un `beforeEach` común los reinicia con `resetKey` para la IP del test.

  El comportamiento en producción no cambia, y un test comprueba aparte que el límite salta (`429`).
- **Un archivo por módulo** (`<módulo>.routes.test.ts`). En cada endpoint:
  1. el caso bueno, con su código y la forma de la respuesta;
  2. la validación (`400` con el campo que falla) cuando recibe datos;
  3. sin sesión (`401`) cuando la exige;
  4. el **aislamiento**: un segundo usuario recibe `404` (o una lista sin esos datos) con los Nodexs, grupos, tareas, recordatorios, papelera y sugerencias del primero.
- **Servicios externos simulados con `vi.mock`:**
  - `lib/safe-fetch` y el `fetch` global (archive.org), con una página HTML de ejemplo, para las vistas previas;
  - `lib/push` (`pushEnabled` y `sendPush`), para los recordatorios;
  - `lib/storage` (`storageEnabled`, `uploadAvatar` y `deleteAvatar`), para la foto.

  También se prueba el `503` cuando el servicio no está configurado.
- **La IA es la real**, para que la búsqueda, los relacionados, los duplicados, las sugerencias y la demo se prueben de verdad. El modelo se descarga una vez y se guarda en `.cache/models`.
- **Procesos de fondo:** se llama directamente a sus funciones con fechas puestas a mano:
  - `purgeTrash`, `purgeDemos`, `checkStaleLinks` (enlaces rotos) y `sendDueReminders` (recordatorios vencidos);
  - en los recordatorios se comprueba que cada uno se envía una sola vez y que una suscripción caducada se borra.
- **Fuera de alcance:** el flujo real de Google y GitHub, porque necesita sus servidores. Solo se prueba el `503` sin configurar y que vincular en la demo da `403`.

## Frontend (Vitest)

- `frontend/vitest.config.ts` con el alias `@/`, entorno `node`, y `jsdom` solo en los archivos que usan `localStorage`.
- Unitarias de la lógica pura:
  - `lib/format.ts`: fechas de ida y vuelta, `domainOf` y `looksLikeUrl`.
  - `lib/tabs.ts`: abrir, cerrar, abrir a la derecha, dividir, `clampSplit` y que el estado se recupera de `localStorage`.
  - `lib/graph-settings.ts`: `matchesRule` (texto, etiqueta, grupo) y que unos ajustes guardados mal vuelven a los de por defecto.
  - `lib/api.ts`, con `fetch` simulado: `204` da `undefined`, un error trae `ApiError` con `status`, `message` y `fields`, y sin red da `status: 0`.
  - `normalizeTag` de `components/tag-input.tsx`.
- Los componentes de React no se prueban uno a uno: los cubren los recorridos end-to-end.

## End-to-end (Playwright)

- `e2e/` en la raíz, con su `package.json` y `playwright.config.ts`. `webServer` arranca:
  - el backend en el puerto **4100** contra la base de Docker;
  - el frontend en el **3100**, con `BACKEND_URL=http://localhost:4100`.
- Navegador: Chromium. Viewport de escritorio y uno de móvil (375 px) para el recorrido 8.
- Los recorridos:
  1. **Cuenta:** registrarse, cerrar sesión y volver a entrar. Una contraseña incorrecta muestra el error.
  2. **Nota:** crear una nota con prioridad Alta y una etiqueta, abrir su página, escribir Markdown y ver que se guarda y se muestra con formato.
  3. **Grupo:** crear un grupo, añadirle un Nodex y filtrar el panel por él.
  4. **Búsqueda por significado:** con varios Nodexs, buscar una idea sin las mismas palabras y encontrar el correcto.
  5. **Tarea:** convertir un Nodex en tarea y moverla de "Pendiente" a "En curso" con el teclado (espacio, flecha, espacio).
  6. **Papelera:** borrar un Nodex, pulsar "Deshacer"; borrarlo otra vez y restaurarlo desde la papelera.
  7. **Modo demo:** "Probar sin registrarse", recorrer la bienvenida, aceptar una sugerencia de la IA y convertir la demo en cuenta real.
  8. **Móvil:** navegar con la barra inferior y crear un Nodex con el botón flotante.
- Sin enlaces a webs externas, para que el resultado no dependa de Internet.
- Cada recorrido crea su propio usuario, así que pueden ejecutarse en cualquier orden.

## Scripts

| Dónde | Script | Qué hace |
|-------|--------|----------|
| raíz | `docker compose up -d db-test` | Levanta la base de pruebas (documentado; no hace falta script) |
| `backend/` | `npm test` | Unitarias e integración con Vitest |
| `backend/` | `npm run test:watch` | Igual, repitiendo al guardar |
| `frontend/` | `npm test` | Unitarias del frontend |
| `e2e/` | `npm test` | Recorridos con Playwright |

## CI (`.github/workflows/tests.yml`)

Se ejecuta en cada PR y en cada push a `develop` y `main`. Son tres trabajos:

1. **backend:**
   - servicio `pgvector/pgvector:pg17` y Node 24;
   - `npm ci`, `prisma generate`, `typecheck` y `npm test`;
   - caché de `.cache/models` para no descargar el modelo cada vez.
2. **frontend:** `npm ci`, `lint`, `typecheck` y `npm test`.
3. **e2e:**
   - depende de los dos anteriores;
   - mismo servicio de base y navegadores de Playwright en caché;
   - si falla, sube el informe de Playwright como artefacto.

Es gratis en repositorios públicos.

## Ramas

| Rama | Contenido |
|------|-----------|
| `feature/pruebas-base` | `compose.yaml`, Vitest en el backend, `globalSetup` con la protección, los 4 tests migrados, las unitarias nuevas del backend y el trabajo **backend** de CI |
| `feature/pruebas-integracion` | Helpers, limitadores exportados y los tests de integración de los 15 módulos y de los procesos de fondo |
| `feature/pruebas-frontend` | Vitest en el frontend, sus unitarias y el trabajo **frontend** de CI |
| `feature/pruebas-e2e` | Playwright, los 8 recorridos y el trabajo **e2e** de CI |

## Documentación

- `docs/10-pruebas.md`, explicado para un junior:
  - qué es cada tipo de prueba y por qué la pirámide (muchas unitarias, bastantes de integración, pocas end-to-end);
  - cómo arrancar la base y ejecutar cada grupo;
  - cómo escribir un test nuevo, con un ejemplo de cada tipo;
  - qué hace la CI.
- `02-plan-de-implementacion.md`: el bloque de pruebas en curso y luego hecho, y el alojamiento como siguiente paso. La guía de despliegue pasará a ser `11-despliegue.md`.
- `README.md` y `docs/README.md`: cómo ejecutar los tests y el enlace al nuevo documento.

## Fuera de alcance

- Login real con Google y GitHub.
- Tests de componentes de React uno a uno y un mínimo de cobertura obligatorio.
- Firefox y Safari en Playwright (se puede añadir después cambiando una línea).
- Pruebas de carga y de rendimiento.
- Arreglar los fallos que descubran las pruebas: se anotan y se deciden aparte.
