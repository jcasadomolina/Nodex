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
- **Supertest:** hace peticiones a una app de Express sin abrir un puerto. Ya lo usa `middleware/error-handler.test.ts`; la rama de integración lo usa con la API entera.
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

## Integración continua (CI)

La **CI** ejecuta los tests sola en los servidores de GitHub cada vez que se abre o actualiza un PR, y en cada push a `develop` y `main`. Si algo falla, el PR lo muestra en rojo antes de integrarlo.

El archivo es `.github/workflows/tests.yml` (GitHub Actions). El trabajo **backend**:

1. Levanta la misma base con un **service container**: un contenedor de Docker que GitHub arranca junto al trabajo. Las variables `DATABASE_URL` y `DIRECT_URL` del trabajo apuntan a ella, porque en la CI no hay `.env` y `prisma.config.ts` exige `DIRECT_URL`.
2. Instala Node 24 y las dependencias (`npm ci`), y genera el cliente de Prisma.
3. Comprueba los tipos y ejecuta `npm test`.

Guarda en caché el modelo de IA (`backend/.cache/models`) para no descargarlo en cada ejecución. Si un día falla al descargarlo desde Hugging Face, basta con volver a lanzar el trabajo desde la pestaña *Actions* del repositorio.
