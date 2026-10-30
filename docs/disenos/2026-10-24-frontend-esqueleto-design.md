# Diseño: esqueleto funcional del frontend

Fecha: 2026-10-24 · Rama: `feature/frontend-base` · Estado: pendiente de revisión por Jose

## Objetivo

Primer subproyecto del bloque de frontend. Consiste en levantar una versión **funcional** de Nodex que recorra todo el camino (navegador → Next.js → backend → base de datos) con la **estructura de los bocetos**, pero con un estilo provisional. Sirve para destapar pronto los problemas de integración y para usar la app de verdad antes de invertir en el diseño visual.

El diseño definitivo (paleta, tipografía, logo) se decide después, cambiando solo los *tokens* (`RNF-07.3`).

### Subproyectos del bloque de frontend

1. **Esqueleto funcional** (este documento).
2. Diseño visual: paleta, tipografía, logo y carrusel del login.
3. Personalidades: vista previa de enlaces, tablero y calendario de tareas, recordatorios.
4. Perfil completo y tutorial (HU-02, HU-10).
5. Grafo de Nodexs con su panel de ajustes (`RF-04.5`).
6. Sugerencias de IA en la interfaz (`RF-04.2`).
7. PWA: instalación, notificaciones push y compartir enlaces (`RF-05.6`).

## Bocetos

Los bocetos están en [`docs/bocetos/bocetos-v1.jpg`](../../bocetos/bocetos-v1.jpg).

| Boceto | Pantalla |
|--------|----------|
| 1 | Login y registro: fondo degradado naranja, tarjeta con el formulario y, a su lado, un carrusel con el detalle de la aplicación |
| 2 | Panel principal (modo claro): barra lateral con iconos de vista, barra superior en forma de píldora que indica dónde estás, y los Nodexs |
| 3 | Grafo de Nodexs (modo oscuro), con un panel de ajustes del grafo a la derecha, al estilo del grafo de Obsidian |
| 4 | Icono de la vista de grafo; sirve también como pantalla de carga |
| 5 | Ventana de ajustes de la aplicación, con el fondo de la app difuminado |

Estilo: el naranja como color principal, modo claro y oscuro, formas redondeadas (píldoras y tarjetas).

## Decisiones aprobadas

| Tema | Decisión |
|------|----------|
| Enfoque | Primero el esqueleto funcional con la estructura de los bocetos en gris y *tokens* provisionales; el logo, en paralelo |
| Estilos | Tailwind CSS + shadcn/ui |
| Framework | Next.js 16 (App Router) con TypeScript |
| Datos | TanStack Query desde el navegador; Next.js se encarga de rutas, *layouts* y del *rewrite* de `/api` |
| Organización | Enfoque A: `frontend/` es un proyecto independiente con su propio `package.json`; los tipos de la API se escriben a mano en el frontend |
| Nodexs en el panel | Rejilla *masonry* de tarjetas, como Google Keep |
| Grupos | Fila de etiquetas que filtra la rejilla (Todos, Huérfanos y los grupos del usuario) |
| Crear y editar | Botón flotante "+" que abre una ventana con el fondo difuminado; la misma ventana sirve para editar |
| Móvil | La barra lateral pasa a ser una barra inferior |
| Prioridad | Editable en la ventana del Nodex; el panel permite ordenar por prioridad y filtrar por ella (HU-11) |

## 1. Estructura y pantallas

### Rutas

| Ruta | Pantalla |
|------|----------|
| `/login` | Correo y contraseña, más los botones de Google y GitHub. El hueco del carrusel queda como bloque provisional |
| `/registro` | Nombre, correo y contraseña |
| `/` | Panel principal |
| `/nodexs/[id]` | El panel con la ventana de ese Nodex abierta. Es la URL de las notificaciones de recordatorio, que el backend ya genera |
| `/perfil` | Provisional: nombre, correo y cuentas vinculadas, con enlaces para vincular Google y GitHub. Es la página a la que redirige el backend tras vincular una cuenta |

Los **ajustes** son una ventana, no una ruta (boceto 5). En el esqueleto incluyen el tema (claro, oscuro o el del sistema), un enlace al perfil y el botón de cerrar sesión.

### Disposición del panel

- **Barra lateral** (en el móvil, barra inferior): logo arriba e iconos de vista, con la activa marcada. En el esqueleto solo aparecen **Panel** y **Ajustes**; las demás vistas se añaden cuando existan.
- **Barra superior (píldora):** indica dónde estás ("Panel · Cocina") y contiene la búsqueda.
- **Fila de filtros:** etiquetas de grupo (Todos, Huérfanos y los grupos del usuario), con acciones para crear, renombrar y borrar grupos, y un menú **Ordenar y filtrar**: orden por recientes o por prioridad, y filtro por prioridad (urgente, alta, media o baja).
- **Rejilla *masonry*:** cada tarjeta muestra el título, un extracto del contenido, el dominio si es un enlace, la prioridad y las etiquetas de sus grupos.
- **Botón "+" flotante:** abre la ventana de crear Nodex.

### Ventana del Nodex

Sirve para crear y para editar: tipo (nota o enlace; pegar una URL en el título lo convierte en enlace), título, contenido, URL, prioridad y grupos. En modo edición, además, muestra los **relacionados** (`RF-05.8`) y el botón de borrar.

### Carpetas

```
frontend/
├── next.config.ts            rewrite /api/:path* → http://localhost:4000/api/:path*
├── proxy.ts                  sin cookie nodex.sid → /login; con cookie en /login o /registro → /
└── src/
    ├── app/
    │   ├── (auth)/           login y registro, con su propio layout (degradado)
    │   ├── (app)/            panel, nodexs/[id] y perfil, con barra lateral y superior
    │   ├── error.tsx         error inesperado de React, con "Reintentar"
    │   └── globals.css       tokens de color y tamaño (modo claro y oscuro)
    ├── components/
    │   ├── ui/               componentes de shadcn/ui
    │   └── …                 nodex-card, nodex-dialog, nodex-grid, group-filter,
    │                         sort-menu, sidebar, top-bar, settings-dialog, logo
    └── lib/
        ├── api.ts            fetch a /api y ApiError
        ├── types.ts          User, Group, Nodex, Priority…
        └── queries/          hooks de TanStack Query por recurso
```

## 2. Datos y sesión

### Cliente de la API

`api(ruta, opciones)` llama a `/api…` desde el mismo dominio, así que la cookie viaja sola y no hace falta CORS. Si la respuesta no es correcta, lanza `ApiError(status, message)` con el mensaje del campo `error` del backend.

### Sesión

- `proxy.ts` (en Next.js 16, el antiguo `middleware.ts`) solo comprueba si existe la cookie `nodex.sid`. Es un atajo para evitar parpadeos, no una medida de seguridad: la validez de la sesión la decide siempre el backend.
- El *layout* de `(app)` pide `GET /api/auth/me`. Un `401` en cualquier petición vacía la caché y lleva a `/login?expired=1`.
- Login y registro hacen un `POST`, refrescan `["me"]` y llevan al panel. Google y GitHub son enlaces normales a `/api/auth/google` y `/api/auth/github`.
- Cerrar sesión: `POST /api/auth/logout`, se vacía la caché y se va a `/login`.

### Caché de TanStack Query

| Clave | Endpoint |
|-------|----------|
| `["me"]` | `GET /auth/me` |
| `["groups"]` | `GET /groups` |
| `["nodexs", { groupId, orphan, priority, sort }]` | `GET /nodexs`, con `useInfiniteQuery` y `cursor` (50 por página) |
| `["search", q]` | `GET /nodexs/search?q=`. Espera 300 ms tras la última tecla; mientras hay texto, sustituye a la rejilla y ordena por relevancia |
| `["nodex", id]` | `GET /nodexs/:id` |
| `["related", id]` | `GET /nodexs/:id/related` |

Las mutaciones invalidan las claves afectadas (`["nodexs"]`, `["groups"]`, `["nodex", id]`…). No hay actualizaciones optimistas en el esqueleto.

### Duplicados

`POST /nodexs` devuelve `duplicates`. Si hay alguno, la ventana no se cierra y muestra "Ya tienes algo muy parecido" con dos acciones: **Ver el existente** (abre ese Nodex) y **Borrar el que acabo de crear**. Si no hay ninguno, la ventana se cierra.

### Formularios

Formularios de React sin librería, con validación básica de HTML (`required`, `type="email"`, `minLength`) y el mensaje del backend debajo del campo.

## 3. Estados y errores

| Situación | Comportamiento |
|-----------|----------------|
| Cargando | Esqueletos de tarjeta con un leve pulso; la rejilla mantiene su forma |
| Panel vacío | "Aún no tienes Nodexs" y un botón para crear el primero |
| Filtro o búsqueda sin resultados | Mensaje específico y opción de quitar el filtro o la búsqueda |
| `400` / `409` | Mensaje del backend bajo el campo o en el formulario |
| `401` en login / `429` | Mensaje en el formulario, sin borrar lo escrito |
| Red o `5xx` | *Toast* "No se ha podido guardar. Inténtalo de nuevo"; la ventana sigue abierta con el texto |
| `401` en el resto | Vuelta a `/login` con "Tu sesión ha caducado" |
| `404` de un Nodex | La ventana dice "Este Nodex ya no existe" |
| Error de React | `error.tsx` con "Reintentar" |
| Borrar | Confirmación previa y *toast* "Enviado a la papelera" |

Los *toasts* usan **Sonner**. Todo se puede usar con el teclado (`Tab`, `Enter`, `Esc`), como ya resuelven los componentes de shadcn/ui.

## 4. Estilo provisional, logo y pruebas

### Tokens provisionales

Son variables CSS en `globals.css`, con un juego para el modo claro y otro para el oscuro:

- Color principal: naranja `#FFA247`, sacado de los bocetos.
- Fondo: blanco en modo claro; `#1F1F1F` en modo oscuro.
- Esquinas: radio grande, como las píldoras y tarjetas de los bocetos.
- Tipografía: Geist, la que trae Next.js por defecto.

El tema se cambia en los ajustes y se recuerda en el navegador. Por defecto sigue al sistema.

### Logo

Provisionalmente, el icono del boceto 4 (nodo con satélites) en SVG, en la barra lateral y como favicon. El logo definitivo se diseña en paralelo.

### Pruebas del esqueleto

- `npm run lint`, `npm run typecheck` y `npm run build` sin errores.
- Recorrido completo en el navegador con el backend arrancado: registro → crear grupo → crear una nota y un enlace → filtrar por grupo y por prioridad → ordenar por prioridad → buscar → editar → aviso de duplicado → borrar → cerrar sesión → login.
- Revisión a 375 px (móvil) y en modo oscuro.
- Login con Google y GitHub, después de que Jose actualice las URLs de vuelta.
- Usuarios de prueba `@nodex.test`, que se borran al terminar junto con sus sesiones.
- Los tests automáticos se dejan para el bloque de pruebas.

## Cambios fuera de `frontend/`

- `.env`: `APP_URL=http://localhost:3000`. El backend construye con ella las URLs de vuelta de OAuth y los enlaces de los recordatorios.
- Google Cloud y GitHub (los cambia Jose): añadir como URLs de vuelta `http://localhost:3000/api/auth/google/callback` y `http://localhost:3000/api/auth/github/callback`.
- `.env.example`: el nuevo valor por defecto de `APP_URL`.
- Documentación: `docs/09-frontend.md` (nuevo; explica cada pieza a nivel junior), `frontend/README.md`, `docs/README.md` (índice) y `CLAUDE.md` si cambia algo del stack.

## Fuera de alcance

Personalidades (vista previa de enlaces, tareas, recordatorios), grafo, tutorial, perfil con foto, sugerencias de IA, carrusel del login, logo definitivo, PWA y tests automáticos.
