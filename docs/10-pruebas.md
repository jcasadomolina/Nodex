# Pruebas

Diseño: [especificación](disenos/2026-10-30-pruebas-design.md) · Plan: [plan](planes/2026-10-30-pruebas.md).

## Qué es un test y para qué sirve

Un **test** es un trozo de código que usa la aplicación y comprueba que hace lo que debe. Por ejemplo, "si creo un Nodex sin título, el servidor responde `400`". Se ejecutan en segundos, siempre igual, y avisan si un cambio rompe algo que antes funcionaba. A eso se le llama **regresión**.

Hay tres tipos, de más pequeño a más grande:

| Tipo | Qué prueba | Ejemplo en Nodex | Velocidad |
|------|-----------|------------------|-----------|
| **Unitaria** | Una función suelta, sin base de datos ni red | `priorityToNumber("high") === 3` | Milisegundos |
| **Integración** | Varias piezas juntas: la API con la base de datos | `POST /api/nodexs` crea el Nodex y otro usuario no puede verlo | Décimas de segundo |
| **End-to-end** | La aplicación entera en un navegador, como un usuario | Registrarse, crear una nota y verla en el panel | Segundos |

Se escriben muchas unitarias, bastantes de integración y pocas end-to-end. Es la **pirámide de pruebas**: las de abajo son rápidas y dicen exactamente qué falla; las de arriba son lentas, pero comprueban que todo encaja.

## Herramientas

- **Vitest:** ejecuta los tests y da `test`, `expect` y las simulaciones (`vi.mock`). Entiende TypeScript sin compilar antes.
- **Supertest:** hace peticiones a una app de Express sin tener que arrancar el servidor (abre un puerto temporal por su cuenta). Ya lo usa `middleware/error-handler.test.ts`; la rama de integración lo usa con la API entera.
- **Playwright:** maneja un navegador de verdad (llega en la rama de end-to-end).

## La base de datos de pruebas

Los tests que tocan la base **nunca** usan Neon. Usan un PostgreSQL en **Docker**:

- `compose.yaml` (en la raíz) define el servicio `db-test`: la imagen `pgvector/pgvector:pg17`, la misma versión que Neon y con pgvector, en el puerto **5433**.
- Guarda los datos en memoria (`tmpfs`): al pararla se borra todo y la siguiente vez empieza vacía.

Docker ejecuta programas dentro de **contenedores**: cajas aisladas con todo lo que necesitan. Así no hay que instalar PostgreSQL en el PC.

Antes de empezar, Vitest ejecuta `src/test/global-setup.ts`, que hace dos cosas:

1. **Protección:** comprueba que `DATABASE_URL` y `DIRECT_URL` apuntan a `localhost`. Si alguna apunta a otro sitio, para con "Los tests solo se ejecutan contra la base local de Docker". Hay que mirar las dos porque `prisma migrate` usa `DIRECT_URL`, y si falta, `prisma.config.ts` la leería del `.env` de Neon.
2. **Migraciones:** crea las tablas con `prisma migrate deploy`.

Las variables de las pruebas están en `src/test/database.ts`. No son secretos: solo sirven para la base local.

## Cómo ejecutarlas

```bash
docker compose up -d --wait db-test
```

```bash
cd backend
npm test
```

- `npm test` las ejecuta una vez.
- `npm run test:watch` las repite cada vez que guardas un archivo.
- Para parar la base: `docker compose down`.

Vitest usa como mucho **2 procesos** a la vez (`maxWorkers: 2`), porque cada uno que carga el modelo de IA ocupa unos 600 MB.

## Cómo escribir una unitaria

El archivo va junto al código que prueba, con `.test.ts`:

```ts
import { expect, test } from "vitest";
import { priorityToName, priorityToNumber } from "./nodexs.schemas.js";

test("las prioridades van y vuelven", () => {
  expect(priorityToName(priorityToNumber("high"))).toBe("high");
});
```

- `test("qué comprueba", () => { ... })`: el nombre dice el comportamiento, en español.
- `expect(valor).toBe(esperado)`: compara. También hay `toEqual` (para objetos y listas), `toBeGreaterThanOrEqual`, `toThrow` y `rejects` (para promesas que fallan).
- `test.each([...])` repite el mismo test con varios datos (ver `lib/safe-fetch.test.ts`).

Unitarias del backend hoy:

| Archivo | Qué comprueba |
|---------|---------------|
| `lib/html-meta.test.ts` | Minutos de lectura y que leer HTML enorme no tarda |
| `lib/safe-fetch.test.ts` | Que no se pueden visitar direcciones internas (SSRF) |
| `middleware/error-handler.test.ts` | Qué código y mensaje da cada tipo de error |
| `modules/ai/new-groups.test.ts` | Cómo se agrupan los huérfanos parecidos y qué nombre se propone |
| `modules/nodexs/nodexs.schemas.test.ts` | Prioridades, etiquetas y validación de enlaces |
| `modules/trash/trash.names.test.ts` | Los nombres "(restaurado)" de la papelera |
| `modules/demo/demo.data.test.ts` | Que los datos de la demo son válidos y enseñan todo |

## Pruebas de integración del backend

Comprueban la API entera: la petición entra por Express, pasa por la validación y la sesión, y llega a la base de Docker. Hay un archivo `<módulo>.routes.test.ts` por cada módulo de `src/modules/`. Las excepciones son health y el login con Google y GitHub, que van en `auth.routes.test.ts`, y las etiquetas, que van en `board.routes.test.ts`.

### Cómo se escribe una

```ts
import { expect, test } from "vitest";
import { createNodex, newUser } from "../../test/helpers.js";

test("otro usuario no puede ver un Nodex ajeno", async () => {
  const { agent: a } = await newUser();
  const { agent: b } = await newUser();
  const nodex = await createNodex(a, { title: "Secreto de A" });

  expect((await b.get(`/api/nodexs/${nodex.id}`)).status).toBe(404);
});
```

- **Supertest** (`request(app)`) arranca la app en un puerto libre temporal, hace la petición y lo cierra, sin que tengas que levantar el servidor. Un **`agent`** es como un navegador: guarda la cookie de sesión y la manda en las siguientes peticiones.
- Los **helpers** (`src/test/helpers.ts`) evitan repetir lo de siempre:
  - `newUser()` registra un usuario con email aleatorio y devuelve su `agent`;
  - `anonymous()` hace peticiones sin sesión;
  - `createNodex()` y `createGroup()` crean datos;
  - `warmUpAi()` y `waitForEmbeddings()` sirven para los tests de IA (ver más abajo).
- Cada test crea sus propios usuarios, así que **no hace falta vaciar la base** y los tests no dependen del orden. Se ha comprobado ejecutándolos en orden aleatorio (`npx vitest run --sequence.shuffle`).

### Qué se comprueba en cada endpoint

1. **El caso bueno:** el código (`200`, `201`, `204`) y la forma de la respuesta.
2. **La validación:** datos incorrectos dan `400` y dicen qué campo falla.
3. **Sin sesión:** `401`.
4. **El aislamiento:** un segundo usuario recibe `404` con los Nodexs, grupos, tareas, recordatorios, papelera y sugerencias del primero, y sus listas no los muestran. Es la prueba más importante para la seguridad: un fallo aquí dejaría ver datos de otras personas.

### Simular servicios externos

Los tests no pueden depender de webs ajenas ni de servicios de pago. La única excepción es la primera descarga del modelo de IA desde Hugging Face, que luego se queda en `.cache/models`. Con **`vi.mock`** se sustituye un módulo por una versión de prueba:

```ts
vi.mock("../../lib/safe-fetch.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/safe-fetch.js")>()),
  safeFetch: vi.fn(),
}));
```

- `importOriginal` conserva el resto del módulo y solo cambia lo indicado.
- Se simulan:
  - las visitas a webs (`safe-fetch`) y archive.org (`fetch`, con `vi.stubGlobal`);
  - el envío push (`lib/push`);
  - Cloudinary (`lib/storage`);
  - la carga de vistas previas en segundo plano (`refreshPreviewInBackground`).
- **Cuidado:** `vi.mock` solo afecta a los módulos que todavía no se han cargado. Por eso `src/test/setup.ts`, que se ejecuta antes de cada archivo, importa las rutas *dentro* del `beforeEach` y no arriba del todo. Si las importara arriba, las simulaciones llegarían tarde y los tests harían peticiones reales a Internet.

### La IA en los tests

La IA **no se simula**: así se prueba de verdad que la búsqueda, los relacionados, las sugerencias y la demo funcionan. Dos detalles:

- Al crear un Nodex, la aplicación espera a su vector como mucho 3 segundos y después sigue en segundo plano. El primer Nodex de cada proceso tarda más, porque carga el modelo. Por eso los archivos de IA llaman a `warmUpAi()` en un `beforeAll`, y antes de buscar esperan a los vectores con `waitForEmbeddings()`.
- Los textos de prueba tienen que parecerse de verdad. Los relacionados exigen una similitud de 0,45 o más. Por ejemplo, "paella" y "arroz con pollo" solo llegan a 0,35, y "Viaje a Lisboa" y "Qué ver en Lisboa" a 0,78.

### Procesos de fondo y límites

- Los procesos que se ejecutan solos en el servidor se prueban llamando a su función con fechas puestas a mano: `sendDueReminders`, `checkStaleLinks`, `purgeTrash` y `purgeDemos`.
- Los límites de peticiones (login, demo y comprobar enlaces) se reinician antes de cada test con `resetKey`. Si no, cada test registraría usuarios y al décimo saltaría el `429`. Hay tests aparte que comprueban que el límite sí salta.

### Tiempo y memoria

La suite completa tarda alrededor de **1 min 25 s** y llega a unos **1,8 GB** de memoria, con 2 procesos y el modelo cargado en cada uno.

**Problema abierto en Windows.** Alrededor de 1 de cada 3 o 4 ejecuciones, un proceso de Vitest se cierra de golpe con el código `0xC0000409`, una salida forzada de código nativo. Pasa mientras se ejecuta un archivo, y ha ocurrido en `nodexs`, `tasks` y `board`. La suite entera sale entonces en rojo y hay que repetirla.

La causa no está identificada. Lo que se ha descartado:

- **Que se cierre con trabajo de IA a medias al terminar el archivo:** esperar a todos los vectores pendientes no lo evitó (2 cierres en 6 ejecuciones).
- **Que la IA falle al calcular varios vectores a la vez:** 8 cálculos simultáneos, durante 30 rondas, no fallaron ninguna vez fuera de Vitest.
- **`--pool=threads`:** es peor, porque se cae el proceso entero sin resumen.

La CI se ejecuta en Linux. Si allí no aparece, el problema es propio de Windows.

## Pruebas del frontend

Son unitarias de la lógica que no depende de pantallas: la de `src/lib/` y la normalización de etiquetas. Los componentes de React no se prueban uno a uno; de eso se encargan los recorridos end-to-end.

```bash
cd frontend
npm test
```

| Archivo | Qué comprueba |
|---------|---------------|
| `lib/format.test.ts` | Fechas de ida y vuelta entre la API y los campos de fecha, el formato en español, `domainOf` y `looksLikeUrl` |
| `lib/tabs.test.ts` | Abrir, sustituir y cerrar pestañas, el máximo de 20, el panel derecho, la división entre 25 y 75 %, y lo guardado en `localStorage` (también si está corrupto) |
| `lib/graph-settings.test.ts` | Las reglas de color del grafo (`grupo:`, `etiqueta:`, `prioridad:`, `tipo:` y texto libre) y los ajustes guardados |
| `lib/api.test.ts` | La función `api()`: cómo pide, el `204`, los errores con sus campos y la falta de red |
| `components/tag-input.test.ts` | `normalizeTag` |

Algunos detalles:

- **Navegador simulado:** `tabs` y `graph-settings` usan `localStorage`, que no existe en Node. Por eso empiezan con `// @vitest-environment jsdom`. Esa línea pide a Vitest un navegador simulado (**jsdom**) solo para ese archivo; el resto corre en Node, que es más rápido.
- **Estado de módulo:** `tabs.ts` guarda el estado en una variable del módulo. Para que cada test empiece limpio, el test vacía `localStorage`, llama a `vi.resetModules()` y vuelve a importar el módulo.
- **`fetch` simulado:** `api.test.ts` sustituye `fetch` con `vi.stubGlobal` y lo restaura después de cada test con `vi.unstubAllGlobals()`.
- **Alias `@/`:** `vitest.config.mts` lo define igual que `tsconfig.json`. Usa la extensión `.mts` porque el frontend no es un paquete ESM (`"type": "module"`).

## Integración continua (CI)

La **CI** ejecuta los tests sola en los servidores de GitHub cada vez que se abre o actualiza un PR, y en cada push a `develop` y `main`. Si algo falla, el PR lo muestra en rojo antes de integrarlo.

El archivo es `.github/workflows/tests.yml` (GitHub Actions). El trabajo **backend**:

1. Levanta la misma base con un **service container**: un contenedor de Docker que GitHub arranca junto al trabajo. Las variables `DATABASE_URL` y `DIRECT_URL` del trabajo apuntan a ella, porque en la CI no hay `.env` y `prisma.config.ts` exige `DIRECT_URL`.
2. Instala Node 24 y las dependencias (`npm ci`), y genera el cliente de Prisma.
3. Comprueba los tipos y ejecuta `npm test`.

El trabajo **frontend** instala las dependencias y pasa `lint`, `typecheck` y `npm test`. No necesita base de datos.

El trabajo backend guarda en caché el modelo de IA (`backend/.cache/models`) para no descargarlo en cada ejecución. Si un día falla al descargarlo desde Hugging Face, basta con volver a lanzar el trabajo desde la pestaña *Actions* del repositorio.
