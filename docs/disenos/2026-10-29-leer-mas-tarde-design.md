# Diseño: Leer más tarde (HU-21)

Fecha: 2026-10-29 · Rama: `feature/leer-mas-tarde`

Una lista de enlaces pendientes de leer, con su tiempo estimado de lectura.

## Requisitos (para `docs/03`)

- **RF-21.1**: El sistema debe permitir marcar un enlace para leerlo más tarde y quitar la marca al leerlo.
- **RF-21.2**: El sistema debe mostrar en el panel un filtro con los enlaces pendientes de leer, del más antiguo al más nuevo.
- **RF-21.3**: El sistema debe estimar el tiempo de lectura de cada enlace y mostrarlo en su tarjeta y en su ventana.

## Backend

- **Migración `add_read_later`:**
  - `nodexs.read_later_at timestamptz NULL`.
  - `link_previews.reading_minutes smallint NULL`.
- **`readingMinutes(html)`** en `lib/html-meta.ts` (función pura):
  - Quita `script`, `style`, `noscript`, `nav`, `header`, `footer`, `aside` y `svg` (no `form`: hay webs que envuelven todo el cuerpo en uno).
  - Toma el contenido del `<article>` exterior si existe; si no, el de `<main>`; si no, el de `<body>` (o todo el HTML).
  - Cuenta solo las palabras de los párrafos (`<p>`, aunque no se cierren, como permite HTML5), tras quitar etiquetas y decodificar entidades. Tablas, listas y menús no cuentan.
  - Todo en tiempo lineal con `indexOf` (sin expresiones regulares con retroceso), para que una página de 1 MB mal formada no bloquee el servidor.
  - Devuelve `null` si hay menos de 100 palabras. Si no, `Math.max(1, Math.round(palabras / 200))`.
- **`checkUrl`** añade `readingMinutes` a la vista previa cuando la respuesta es `ok` y tiene cuerpo. Si cambia la URL, también se vacía `readingMinutes`.
- **`previewFields`** incluye `readingMinutes`; **`nodexFields`** incluye `readLaterAt`.
- **Esquemas:**
  - `readLater: z.boolean().optional()` al crear y al editar. Se traduce a `readLaterAt = now()` o `null`.
  - Activarlo cuando ya estaba activo no cambia la fecha.
  - Solo afecta a Nodexs de tipo enlace; en notas se ignora.
- **`GET /nodexs?readLater=true`:** filtra `readLaterAt != null` y ordena `readLaterAt asc, id asc`, con la misma paginación por cursor.
- **`GET /nodexs/read-later/count`:** `{ count }`. Se registra antes de `/:id`.

## Frontend

- **Tipos:** `Nodex.readLaterAt`, `LinkPreview.readingMinutes` y `BoardFilter` con `{ kind: "readLater" }`.
- **`useNodexs`:** con `filter.kind === "readLater"` envía `readLater=true`. **`useReadLaterCount()`:** clave `["nodexs", "read-later-count"]`.
- **`GroupFilter`:** el chip "Leer más tarde N" va tras "Huérfanos" y solo aparece si N > 0 o si el filtro está activo. En `board.tsx`, la ubicación es "Panel · Leer más tarde".
- **`NodexDialog`** (solo Nodexs con URL, existentes o nuevos):
  - **Existente:** botón "Leer más tarde" o "Marcar como leído". Hace `PATCH { readLater }` al momento, con rueda, aviso e invalidación, sin cerrar la ventana.
  - **Nuevo:** un interruptor "Leer más tarde" que se envía al crear.
  - Si hay `readingMinutes`, se muestra "⏱ N min de lectura".
- **`NodexCard`:** etiqueta "Para leer" si `readLaterAt`, y "⏱ N min" si hay tiempo de lectura.

## Pruebas

- **Tests** con `node:test` de `readingMinutes`: artículo con `<article>`, página sin `<article>`, página corta (`null`) y `script`/`nav` que no cuentan.
- **Script temporal contra la API:**
  - Marcar y desmarcar.
  - Filtro y orden.
  - Contador.
  - Que activarlo dos veces no cambie la fecha.
  - Que en las notas se ignore.
- **Navegador** y revisión independiente.

## Fuera de alcance

Modo lectura dentro de Nodex, progreso de lectura y estadísticas.
