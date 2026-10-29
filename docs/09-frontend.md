# Frontend

Interfaz web de Nodex: lo que ve y usa el usuario. Pide los datos a la API del backend ([Sistema de backend](06-sistema-backend.md)).

Esta primera versión es el **esqueleto funcional**: login, registro, panel con grupos y Nodexs, prioridad y búsqueda, con la estructura de los [bocetos](bocetos/bocetos-v1.jpg) pero con colores y logo provisionales. Diseño y plan: [especificación](superpowers/specs/2026-10-24-frontend-esqueleto-design.md) y [plan](superpowers/plans/2026-10-24-frontend-esqueleto.md).

## Stack (aprobado)

| Necesidad | Elección | Por qué |
|-----------|----------|---------|
| Framework | **Next.js 16** (App Router) + TypeScript | Framework acordado. Rutas por carpetas y un servidor que reenvía `/api` al backend |
| Estilos | **Tailwind CSS 4** | Los estilos se escriben como clases en el propio componente; no hay que inventar nombres de clases CSS |
| Componentes | **shadcn/ui** (sobre Radix) | Diálogos, menús y formularios accesibles. Se copian a `src/components/ui/`: son código nuestro, no una dependencia cerrada |
| Datos | **TanStack Query 5** | Caché de las respuestas, estados de carga y error, y refresco tras cada cambio |
| Tema | **next-themes** | Modo claro, oscuro o el del sistema, recordado en el navegador |
| Avisos | **Sonner** | Mensajes breves en una esquina (*toasts*) |
| Arrastrar y soltar | **dnd-kit** | El tablero de tareas. Funciona con ratón, dedo y teclado, y anuncia los movimientos a los lectores de pantalla |

## Cómo se conecta con el backend

```
Navegador ──► Next.js (localhost:3000)
                 ├─ /login, /, /nodexs/…  → páginas de React
                 └─ /api/*               → reenvío (rewrite) → Express (localhost:4000)
```

El navegador solo conoce **un dominio**. Next.js reenvía cualquier ruta `/api/...` al backend (`rewrites` en `next.config.ts`). Así la cookie de sesión `nodex.sid` viaja sola en cada petición y no hace falta configurar CORS. Por eso `APP_URL` vale ahora `http://localhost:3000`: es la dirección que ve el usuario, y el backend la usa para las URLs de vuelta de Google y GitHub.

En producción, la variable `BACKEND_URL` dice a dónde reenviar (por defecto, `http://localhost:4000`).

## Conceptos de Next.js que se usan

- **Rutas por carpetas.** Cada carpeta de `src/app/` con un `page.tsx` es una URL: `app/(auth)/login/page.tsx` → `/login`.
- **Layouts.** Un `layout.tsx` envuelve todas las páginas de su carpeta. El raíz carga la fuente y los *providers*; el de `(app)` pinta la barra lateral.
- **Grupos de rutas.** Las carpetas entre paréntesis, `(auth)` y `(app)`, agrupan páginas con el mismo *layout* sin añadir nada a la URL.
- **Componentes de servidor y de cliente.** Por defecto, un componente se ejecuta en el servidor. Los que usan estado, efectos o eventos llevan `"use client"` en la primera línea. Casi toda la app es de cliente porque es muy interactiva.
- **`proxy.ts`** (antes `middleware.ts`). Se ejecuta antes de cada página: sin cookie de sesión te lleva a `/login`, y con cookie, de `/login` al panel. **No es seguridad**: solo evita un parpadeo. Quien decide si la sesión vale es siempre el backend.
- **`<Suspense>`.** Next.js 16 prerenderiza el esqueleto de cada página. Lo que depende de la URL (`params`, `usePathname`, `useSearchParams`) va dentro de un `<Suspense>` para no bloquear ese prerender.

## Cómo se piden los datos: TanStack Query

Todas las peticiones pasan por `api()` (`lib/api.ts`). Si la respuesta es un error, lanza un `ApiError` con el código HTTP y el mensaje en español del backend.

Cada dato tiene una **clave** en la caché:

| Clave | Endpoint |
|-------|----------|
| `["me"]` | `GET /auth/me` |
| `["groups"]` | `GET /groups` |
| `["nodexs", filtros]` | `GET /nodexs` (de 50 en 50, con `useInfiniteQuery`) |
| `["search", texto]` | `GET /nodexs/search` |
| `["nodex", id]`, `["related", id]` | Un Nodex y sus relacionados |
| `["tasks", "board"]`, `["tasks", "calendar", desde]` | `GET /tasks/board` y `GET /tasks/calendar` |
| `["alerts", "due" \| "upcoming" \| "broken"]` | `GET /reminders?status=due` (cada 60 s), `?status=upcoming` y `GET /links/broken` |
| `["nodexs", "suggestions"]` | `GET /suggestions` (cuelga de `nodexs` para recargarse al guardar un Nodex) |

Después de crear, editar o borrar, se **invalidan** las claves afectadas y TanStack Query vuelve a pedirlas. Si cualquier petición devuelve `401` (sesión caducada), se cierra la sesión en el backend, que borra la cookie, y se va a `/login?expired=1`. Cerrar antes la sesión evita un bucle: con la cookie todavía puesta, `proxy.ts` devolvería al usuario al panel.

### Editar los grupos de un Nodex

`PATCH /nodexs/:id` no acepta `groupIds`. Al guardar, la ventana compara los grupos de antes y los de ahora, y llama a `POST /groups/:id/nodexs` por cada grupo añadido y a `DELETE /groups/:id/nodexs/:nodexId` por cada grupo quitado.

## Pantallas

| Ruta | Qué hay |
|------|---------|
| `/login`, `/registro` | Formulario sobre un degradado naranja, con Google y GitHub. A la derecha queda el hueco del futuro carrusel |
| `/` | Panel: barra superior con la ubicación y la búsqueda, etiquetas de grupo, "Ordenar y filtrar" y la rejilla de Nodexs |
| `/nodexs/[id]` | Página del Nodex: título, propiedades y contenido en Markdown (HU-22). Las notificaciones de recordatorio enlazan aquí |
| `/perfil` | Foto (subir a Cloudinary o quitar), nombre, correo y cuentas vinculadas (vincular o desvincular) |
| `/grafo` | Vista gráfica |
| `/tareas` | Tablero y calendario de tareas |

Al pulsar un Nodex (panel, grafo, tareas, campana, Redescubre, sugerencias o relacionados) se navega a su página con `router.push`. "Volver" usa `router.back()`, así que el panel recupera su estado.

### Página del Nodex (HU-22)

Diseño: [especificación](superpowers/specs/2026-10-29-vista-nodex-design.md). `components/nodex-view.tsx`:

- **Título** editable al pulsarlo; **propiedades** en una tabla como la de Obsidian, cada una guardándose al momento (solo envía su cambio). Los controles (prioridad, tarea, fecha, recordatorio, grupos) están en `components/nodex-fields.tsx` y los comparte la ventana de creación.
- **Contenido en Markdown** con `react-markdown` + `remark-gfm` (`components/markdown.tsx`): tablas, casillas, tachado, código… No ejecuta HTML incrustado y descarta los enlaces `javascript:`. Los estilos están en `globals.css` (`.markdown`), con los colores del tema.
- **Editar:** "Editar" o doble clic abre un `textarea`; se guarda 1 s después de dejar de escribir y también al salir del campo o de la página (una referencia guarda la última función de guardado para llamarla al desmontar). Mientras editas, el texto local manda: una recarga de datos no lo pisa.
- **Guardar sin perder cambios:** `useUpdateNodex` actualiza la caché del Nodex antes de enviar la petición (actualización optimista) y la deshace si falla. Además, todas las ediciones van en una cola (`scope` de TanStack Query), así que dos cambios seguidos llegan al servidor en orden y el segundo parte del resultado del primero.
- **Enlace y tipo:** el tipo sigue a la URL. Ponerle una URL a una nota la convierte en enlace (y aparece "Leer más tarde"); quitarla la convierte en nota.
- **Crear:** la ventana "Nuevo Nodex" pide título, enlace y, en "Más opciones", el resto de propiedades. Al crear se abre la página en `?editar=1` para escribir el contenido.
- `TopBar` pinta el enlace del perfil solo tras hidratar (`useSyncExternalStore`): en páginas que se hidratan tarde (dentro de `<Suspense>`), el usuario ya está en caché y el HTML no coincidiría con el del servidor.

### La rejilla tipo Keep (*masonry*)

Se hace con **columnas CSS** (`columns-1 sm:columns-2 lg:columns-3 xl:columns-4`), sin librería. Las tarjetas se reparten **de arriba abajo por columnas**, no por filas. Para un panel de notas es aceptable, y se cambiará si hace falta un orden estricto por filas.

## La primera vez en Nodex

Diseño: [especificación](superpowers/specs/2026-10-27-primera-vez-design.md).

### Pantalla de inicio (`/login` y `/registro`)

Inspirada en la portada de Calendly. A la izquierda van el titular, los botones de Google y GitHub y el formulario (con mostrar/ocultar contraseña). A la derecha, `AppPreview` alterna tres vistas de la app (panel, Nodex abierto y búsqueda) con un fundido cada 4 s. No son capturas: son los **componentes reales** (`NodexCard`) con datos de ejemplo, así que siempre coinciden con la interfaz y siguen el tema claro u oscuro. Al fondo, `AuthBackground` pinta una mancha naranja y una red de nodos que se mueve despacio. Todo es CSS y SVG, y se queda quieto con `prefers-reduced-motion`.

### Bienvenida (`/bienvenida`)

El layout de la app manda aquí a quien no ha completado el tutorial (`tutorialCompletedVersion < TUTORIAL_VERSION`, en `lib/tour.ts`). Así la ve quien acaba de registrarse y quien entra por primera vez con Google o GitHub, en cualquier dispositivo. Es un carrusel de 4 diapositivas hecho con **`scroll-snap` de CSS**: en el móvil se desliza con el dedo sin librerías, y los botones y las flechas del teclado mueven el carrusel con `scrollTo`. La última explica el único permiso que pediremos (notificaciones, al crear el primer recordatorio) y lleva a "Entrar a Nodex".

### Tutorial

"Entrar a Nodex" deja la marca `nodex-tour` en `sessionStorage` y va al panel. Mientras exista, el layout no vuelve a redirigir a la bienvenida, y `Tour` muestra 7 bocadillos anclados con el Popover de Radix a los elementos con `data-tour` (búsqueda, grupos, "+ Grupo", ordenar, "+", Panel y Ajustes). Los pasos cuyo elemento no se ve se saltan. Al terminar, saltarlo o pulsar `Esc`, se guarda `PUT /me/tutorial { version: 1 }`, así que no vuelve a salir en ningún dispositivo. Si se cierra la pestaña a medias, saldrá otra vez porque no se completó. Para repetirlo: Ajustes → "Ver la bienvenida otra vez".

## Etiquetas (HU-13)

En la ventana del Nodex, el campo "Etiquetas" (`components/tag-input.tsx`) convierte lo que escribes en una etiqueta al pulsar `Enter` o escribir una coma, con la misma normalización que el backend. Las sugerencias salen de `GET /api/tags` con un `<datalist>`, el autocompletado nativo del navegador. Las tarjetas muestran las etiquetas como `#cocina`, y la búsqueda del panel también encuentra por etiqueta.

## Sugerencias de la IA (`RF-04.2`)

Al guardar un Nodex huérfano, el backend busca el grupo al que más se parece y, si destaca claramente, guarda una sugerencia. En el panel, junto a "Ordenar y filtrar", aparece un botón ✨ con el número de sugerencias pendientes (si no hay ninguna, no se muestra). Abre un Popover (`components/suggestions-button.tsx`) con una fila por sugerencia, "Título → Grupo":

- **✓ Aceptar** llama a `POST /suggestions/:id/accept` y mete el Nodex en el grupo.
- **✕ Rechazar** llama a `POST /suggestions/:id/reject`; la IA no vuelve a proponer ese grupo para ese Nodex y busca otro.
- **Revisar huérfanos** (al pie del Popover y en el menú `…` del filtro "Huérfanos") llama a `POST /suggestions/refresh`, que vuelve a revisar todos los huérfanos. Sirve para los Nodexs guardados antes de que existiera su grupo. Mientras trabaja, un aviso con rueda dice "Revisando huérfanos…".

Después de cada acción se invalidan las mismas claves que al editar un Nodex, así que el panel, los contadores de los grupos y el grafo se actualizan solos.

### Grupos nuevos (`RF-04.3`)

"Revisar huérfanos" también busca huérfanos parecidos entre sí y propone crear un grupo con ellos. Sin LLM:

1. **Parecido:** la similitud de los embeddings, más 0,3 si los dos Nodexs comparten una palabra del título o una etiqueta (la misma idea que la búsqueda híbrida). Con títulos cortos, el modelo solo daba similitudes de 0,3 a 0,5 entre temas claramente iguales, y algo de ruido entre temas distintos; la palabra en común separa bien unos de otros.
2. **Agrupación en estrella:** el huérfano con más vecinos parecidos (≥ 0,55) forma un grupo con ellos; se repite con los que quedan. Solo cuentan los grupos de 3 o más.
3. **Nombre:** la etiqueta que comparten al menos la mitad o, si no, la palabra que más se repite en los títulos, sin palabras vacías ni nombres de grupos que ya existen.

Para que el cálculo no se dispare, solo se miran los 500 huérfanos más recientes. Un bloqueo de PostgreSQL por usuario (`pg_advisory_xact_lock`) evita que dos revisiones o una revisión y una aceptación a la vez dupliquen o mezclen propuestas.

En el Popover ✨, el apartado "Grupos nuevos" deja cambiar el nombre antes de pulsar "Crear grupo". "Rechazar" hace que esos Nodexs no vuelvan a proponerse. Las funciones de agrupar y poner nombre son puras y tienen tests (`backend/src/modules/ai/new-groups.test.ts`, con `npx tsx --test`).

## Tareas (`/tareas`, `RF-12.4` a `RF-12.6`)

Diseño: [especificación](superpowers/specs/2026-10-28-tareas-design.md). Cualquier Nodex puede ser una tarea: en su ventana, el interruptor "Tarea" muestra el estado (Pendiente, En curso, Hecha) y una fecha límite opcional. La tarea se guarda dentro del mismo guardado del Nodex (`PUT` o `DELETE /tasks/:id`, solo si ha cambiado), así que hay un único botón y un único error. Las tarjetas del panel llevan la etiqueta "Tarea · 3 nov" o "Hecha".

| Pieza | Qué hace |
|-------|----------|
| `app/(app)/tareas/page.tsx` | Pestañas Tablero y Calendario, botón + (abre la ventana con la tarea ya activada) y estados vacío, de carga y de error |
| `components/task-board.tsx` | Tres columnas con **dnd-kit**. Copia las columnas a un estado local para mover la tarjeta al momento (actualización optimista) y luego llama a `POST /tasks/:id/move { status, index }`. Si falla, vuelve a los datos del servidor |
| `components/task-calendar.tsx` | Rejilla de 6 semanas (de lunes a domingo) hecha con CSS grid, sin librería. En el móvil, lista de los días con tareas |
| `components/task-card.tsx` | Tarjeta del tablero; la fecha va en rojo si ya pasó |

- **Arrastrar:** con el ratón empieza tras moverse 5 px (así un clic abre el Nodex); con el dedo, tras mantener 200 ms (así se puede seguir haciendo scroll); con el teclado, espacio para coger y soltar, flechas para mover, `Esc` para cancelar e `Intro` para abrir.
- **Fechas:** el `<input type="date">` da `AAAA-MM-DD`; se guarda como las 00:00 de ese día en hora local (`fromDateInput`) y se lee con `toLocaleDateString("sv-SE")` (`toDateInput`), que devuelve el mismo formato. Así la tarea cae en el mismo día en cualquier pantalla.

## Papelera (`/papelera`, HU-15)

Diseño: [especificación](superpowers/specs/2026-10-29-papelera-design.md). Se llega desde Ajustes. Dos pestañas (Nodexs y Grupos) con "Restaurar" y "Eliminar para siempre" en cada fila, y "Vaciar papelera". Cada fila dice cuántos días le quedan antes de que el proceso del backend lo elimine (30 días).

- **Restaurar un grupo** cuyo nombre ya usa otro grupo lo renombra a «Nombre (restaurado)», «(restaurado 2)»… para no chocar con el índice único.
- **Deshacer:** los avisos "Enviado a la papelera" (ventana del Nodex y menú del grupo) tienen un botón "Deshacer". Usa una función normal en vez de una mutación de TanStack Query porque la ventana ya se ha cerrado cuando pulsas el botón.
- `["trash"]` está dentro de `useInvalidateNodexs`, así que borrar algo en el panel actualiza la papelera.

## Leer más tarde (HU-21)

Diseño: [especificación](superpowers/specs/2026-10-29-leer-mas-tarde-design.md).

- **Marcar:** en la ventana de un enlace, "Leer más tarde" / "Marcar como leído" hace `PATCH /nodexs/:id { readLater }` al momento, sin cerrar la ventana ni perder lo que estés escribiendo. Al crear un enlace hay un interruptor con el mismo nombre.
- **Filtro:** el chip "Leer más tarde N" (`GET /nodexs/read-later/count`) aparece junto a "Huérfanos" cuando hay alguno y muestra los enlaces del más antiguo al más nuevo (`GET /nodexs?readLater=true`).
- **Tiempo de lectura:** al descargar la vista previa, el backend (`readingMinutes` en `lib/html-meta.ts`) busca el contenido en `<article>`, `<main>` o `<body>`, quita scripts, menús y cabeceras, cuenta solo las palabras de los párrafos (`<p>`) y divide entre 200 por minuto. Con menos de 100 palabras no se muestra. Contar solo párrafos evita que tablas, listas de referencias o menús laterales inflen el tiempo. Se recorre el HTML con `indexOf` en una sola pasada: las expresiones regulares con `[\s\S]*?` tardaban unos 30 s con 1 MB de `<p>` sin cerrar y bloqueaban todo el servidor. Con este filtro, el orden por prioridad no se aplica: siempre va del más antiguo al más nuevo.

## Redescubre (HU-20)

Diseño: [especificación](superpowers/specs/2026-10-28-redescubre-design.md). Encima de la rejilla del panel (solo en "Todos", sin prioridad ni búsqueda), `components/rediscover.tsx` muestra hasta 3 Nodexs olvidados de `GET /nodexs/rediscover`:

- **Olvidado:** sin abrir desde hace 30 días (o desde que se creó, si nunca se abrió) y sin prioridad alta ni urgente.
- **Orden:** primero los parecidos a lo que has abierto en los últimos 7 días (embeddings), más un poco de azar que solo cambia de un día a otro (`md5(id + fecha en hora de España)`), para que la franja no cambie en cada recarga. Al abrir un Nodex la preferencia se actualiza, así que la franja puede cambiar durante el día.
- **Abrir:** la ventana del Nodex llama una vez a `POST /nodexs/:id/open` al abrirse (en un efecto que depende del id). No se usa `GET /nodexs/:id` porque TanStack Query lo repite al recargar datos y contaría aperturas falsas. Abrir un Nodex lo "renueva": tarda 30 días en volver a salir.
- **Ocultar hasta mañana:** guarda la fecha de hoy en `localStorage` (`nodex-rediscover-hidden`).

## Perfil (`/perfil`, HU-02)

- **Foto:** "Cambiar foto" abre un `<input type="file">` oculto. Antes de enviar se comprueba el tipo (JPG, PNG, WebP o GIF) y el tamaño (5 MB como máximo), y se sube con `PUT /me/avatar` como `FormData`; `api()` detecta `FormData` y no le pone `Content-Type`, para que el navegador añada el *boundary*. Sin foto se muestra la inicial (`components/avatar.tsx`), que también aparece en Ajustes.
- **Nombre:** `PATCH /me`; el botón solo se activa si cambia.
- **Cuentas:** "Desvincular" pide confirmación. Si es el único método de inicio de sesión (`hasPassword` falso y una sola cuenta vinculada), el botón sale desactivado con la explicación.
- Tras cada cambio se recargan `["profile"]` y `["me"]`, así que el nombre y la foto se actualizan en toda la app.

## Avisos: recordatorios y enlaces rotos (`RF-12.3`, `RF-12.7`)

Diseño: [especificación](superpowers/specs/2026-10-28-recordatorios-enlaces-design.md). La **campana** de la barra lateral (`components/alerts-button.tsx`) es el centro de avisos:

- El número rojo cuenta los recordatorios vencidos y sin descartar. La consulta se repite cada 60 s mientras la pestaña está visible.
- Al pulsarla, un Popover muestra "Ahora" (con Descartar), "Próximos" y "Enlaces rotos" (con "Ver copia" de archive.org si existe). "Abrir" navega a `/nodexs/:id`.
- Si llega un recordatorio nuevo con la app abierta, sale un aviso con "Abrir". Para no repetir avisos, el componente guarda en un `useRef` los recordatorios que ya ha visto; en la primera carga solo los apunta, sin avisar.

En la ventana del Nodex, la sección "Recordatorio" tiene un `<input type="datetime-local">` (hora local) y los atajos "En 1 hora", "Esta tarde (18:00)" y "Mañana a las 9:00". Se guarda junto con el Nodex (`PUT` o `DELETE /reminders/:id`). Si la fecha ya pasó, el backend responde con un error que se muestra bajo el campo. Los enlaces rotos o que no responden muestran "Comprobar ahora" (`POST /links/:id/refresh`) y "Ver copia".

Las notificaciones push al móvil llegarán con la PWA, porque necesitan un *service worker*.

## Vista gráfica (`/grafo`, `RF-04.5`)

Diseño: [especificación](superpowers/specs/2026-10-27-grafo-design.md). Funciona como el grafo de Obsidian: los grupos son nodos grandes y sus Nodexs se unen a ellos.

| Pieza | Qué hace |
|-------|----------|
| `components/graph-view.tsx` | Construye los nodos y las uniones a partir de `GET /api/board` y de los ajustes. Calcula la física con **d3-force** (uniones, repulsión, colisión y atracción al centro) y pinta en SVG. El zoom y el desplazamiento los gestiona **d3-zoom**; los nodos se arrastran con eventos de puntero |
| `components/graph-panel.tsx` | El panel de ajustes, con secciones plegables `<details>` (nativas): filtros, grupos, colores, mostrar y exportar |
| `lib/graph-settings.ts` | Ajustes por defecto, `localStorage` (`nodex-graph`) y `matchesRule`, que decide si una regla de color (`grupo:`, `etiqueta:`, `prioridad:`, `tipo:` o una palabra) se aplica a un Nodex |
| `app/(app)/grafo/page.tsx` | La página y la exportación: serializa el SVG, sustituye `currentColor` por el color real y añade el fondo del tema; para PNG y JPEG lo pinta en un `<canvas>` al doble de resolución |

- **Relacionados:** al activarlos se piden a `GET /api/board/related` y se dibujan con línea discontinua.
- **Posiciones estables:** al cambiar un ajuste se vuelve a calcular el grafo, pero cada nodo conserva su posición anterior, así que no "salta".
- **Vista rápida:** en el ordenador, la tarjeta del Nodex sale al pasar el ratón y el clic abre la ventana de edición; en el móvil sale al tocar, con un botón "Abrir".
- **Simplificaciones:** las fuerzas son fijas (Obsidian deja ajustarlas) y con miles de nodos el SVG puede ir lento; en ese caso se pasaría a `<canvas>`.

## Estados y errores

| Situación | Qué ve el usuario |
|-----------|-------------------|
| Cargando | Una rueda que gira (`components/spinner.tsx`), en la pantalla o dentro del botón que se ha pulsado |
| Panel vacío | "Aún no tienes Nodexs" y un botón para crear el primero |
| Filtro o búsqueda sin resultados | Mensaje y botón para quitar el filtro o la búsqueda |
| Error de validación (`400`, `409`) | El mensaje del backend debajo del campo o en un aviso |
| Error de red o del servidor | Aviso "No se ha podido guardar. Inténtalo de nuevo"; la ventana no se cierra y no se pierde el texto |
| Sesión caducada | Vuelta a `/login` con "Tu sesión ha caducado" |
| Nodex que ya no existe | "Este Nodex ya no existe" en la ventana |
| Error inesperado de React | Página "Algo ha salido mal" con "Reintentar" |

## Estilo

Los colores son variables CSS en `src/app/globals.css`, que es como trabaja shadcn/ui, con un juego para el modo claro y otro para el oscuro. **Paleta aprobada (A, "naranja actual"):** naranja `#ffa247` como color principal, con texto `#1f1f1f` encima; fondo blanco en modo claro, y `#1f1f1f` de fondo con tarjetas `#2b2b2b` en modo oscuro; grises neutros. Se eligió frente a una variante con fondo crema y otra con grises azulados.

**Tipografía aprobada: Nunito**, de Google Fonts, cargada con `next/font` en `src/app/layout.tsx`. Sus terminaciones redondeadas repiten las formas de las píldoras y tarjetas de los bocetos. Se descartaron Geist (la de Next.js) y Outfit.

**Logo aprobado** (`components/logo.tsx`): un nodo central grande con seis satélites de distintos tamaños, dentro de un cuadrado naranja con esquinas redondeadas. Une el nodo con satélites del boceto 4 y el icono de app. `app/icon.svg` es su versión estática para el favicon.

Con `<Logo animated />` se anima en un ciclo de 4,5 s: aparece el nodo central con un pequeño rebote, después los satélites uno a uno cada 0,2 s, empezando por el de abajo y en el sentido de las agujas del reloj. Luego desaparecen en el mismo orden y, al final, el nodo central. Es CSS puro (`@keyframes` en `globals.css`, con un retraso por satélite mediante la variable `--i`), y se queda quieto si el sistema pide reducir el movimiento (`prefers-reduced-motion`). Se usa animado en el login y en `app/loading.tsx`, la pantalla que muestra Next.js mientras carga una ruta; quieto, en la barra lateral.

## Decisiones técnicas

- **Una regla de ESLint desactivada:** `@next/next/no-img-element`. Las imágenes de vista previa de los enlaces vienen de cualquier web, y `next/image` exigiría declarar todos los dominios.
- **`AGENTS.md`:** lo crea y lo mantiene Next.js. Avisa a los asistentes de IA de que consulten la documentación de la versión instalada.
