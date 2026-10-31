# Diseño: Redescubre (HU-20)

Fecha: 2026-10-28 · Rama: `feature/redescubre`

Cada día vuelven a aparecer 3 Nodexs olvidados, para que lo guardado no se pierda.

## Requisitos (para `docs/03`)

- **RF-20.1**: El sistema debe registrar cuándo abre el usuario cada Nodex.
- **RF-20.2**: El sistema debe mostrar cada día en el panel hasta 3 Nodexs que el usuario no abre desde hace 30 días o más, sin contar los de prioridad alta o urgente.
- **RF-20.3**: El sistema debe dar preferencia a los Nodexs olvidados que se parezcan a lo que el usuario ha abierto en los últimos 7 días.
- **RF-20.4**: El sistema debe permitir ocultar la sección hasta el día siguiente.

## Backend

- **Migración `add_nodex_last_opened_at`:** `nodexs.last_opened_at timestamptz NULL`. Prisma: `lastOpenedAt DateTime? @map("last_opened_at") @db.Timestamptz(6)`.
- **`POST /nodexs/:id/open`:** pone `last_opened_at = now()` en un Nodex activo del usuario (`204`, o `404` si no existe). No cambia `updated_at`: se hace con SQL directo.
- **`GET /nodexs/rediscover`:** devuelve `{ nodexs: Nodex[] }` (como `toNodex`), con 3 como máximo. Se registra antes de `/:id`.
  - **Candidatos:** del usuario, sin borrar, con `COALESCE(last_opened_at, created_at) <= now() - 30 días` y con `priority` nula o por debajo de alta.
  - **Recientes:** los Nodexs con `last_opened_at >= now() - 7 días` y embedding.
  - **Puntuación:** la similitud máxima con algún reciente (0 si no hay recientes o no tiene embedding) + `0,5 ×` un azar fijo por día (`('x' || substr(md5(id || fecha de hoy en Europe/Madrid), 1, 7))::bit(28)::int / 2^28`, en [0, 1); 7 cifras hexadecimales para que el entero no salga negativo). Se ordena de mayor a menor y se toman 3.
- Constantes en `nodexs/rediscover.ts`: `FORGOTTEN_DAYS = 30`, `RECENT_DAYS = 7`, `REDISCOVER_COUNT = 3`, `RANDOM_WEIGHT = 0.5`.

## Frontend

- **`useRediscover()`:** clave `["nodexs", "rediscover"]`, así se recarga al invalidar `["nodexs"]`. **`useMarkOpened()`:** `POST /nodexs/:id/open` y, al terminar, invalida `["nodexs", "rediscover"]`.
- **`NodexDialog`:** al cargar un Nodex existente, llama a `useMarkOpened` una vez por cada id abierto (en un efecto con el id como dependencia). Los fallos se ignoran.
- **`components/rediscover.tsx`:**
  - Franja con el título "Redescubre", el texto "Nodexs que hace tiempo que no abres" y un botón "×" ("Ocultar hasta mañana").
  - Hasta 3 tarjetas compactas (título, dominio si es un enlace y "Guardado el 3 sep"). Pulsar una llama a `onOpen(id)`.
  - Se oculta si no hay resultados, si falla o mientras carga (no lleva rueda: es contenido secundario).
- **`board.tsx`:** pinta `<Rediscover>` encima de la rejilla solo con el filtro "Todos", sin prioridad y sin búsqueda.
- **Ocultar:** `localStorage["nodex-rediscover-hidden"] = fecha local AAAA-MM-DD`. La franja no se muestra si la fecha es la de hoy. Las lecturas y escrituras van en `try/catch`.

## Pruebas

- **Backend:** script de prueba temporal (en el scratchpad, no en el repositorio) contra la base de datos con un usuario `@nodex.test`. Se ajustan `created_at` y `last_opened_at` a mano y se comprueba que:
  - Salen los olvidados y no los recientes ni los de prioridad alta.
  - Abrir uno lo quita de la lista.
  - Dos llamadas el mismo día devuelven lo mismo.
- **Navegador:** la franja, ocultarla y abrir un Nodex desde ella.
- Revisión independiente.

## Fuera de alcance

Intervalos que crecen con cada repaso (repetición espaciada completa), notificaciones de Redescubre y elegir cuántos Nodexs mostrar.
