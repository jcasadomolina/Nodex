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

Después de crear, editar o borrar, se **invalidan** las claves afectadas y TanStack Query vuelve a pedirlas. Si cualquier petición devuelve `401` (sesión caducada), se cierra la sesión en el backend, que borra la cookie, y se va a `/login?expired=1`. Cerrar antes la sesión evita un bucle: con la cookie todavía puesta, `proxy.ts` devolvería al usuario al panel.

### Editar los grupos de un Nodex

`PATCH /nodexs/:id` no acepta `groupIds`. Al guardar, la ventana compara los grupos de antes y los de ahora, y llama a `POST /groups/:id/nodexs` por cada grupo añadido y a `DELETE /groups/:id/nodexs/:nodexId` por cada grupo quitado.

## Pantallas

| Ruta | Qué hay |
|------|---------|
| `/login`, `/registro` | Formulario sobre un degradado naranja, con Google y GitHub. A la derecha queda el hueco del futuro carrusel |
| `/` | Panel: barra superior con la ubicación y la búsqueda, etiquetas de grupo, "Ordenar y filtrar" y la rejilla de Nodexs |
| `/nodexs/[id]` | El panel con la ventana de ese Nodex abierta (las notificaciones de recordatorio enlazan aquí) |
| `/perfil` | Provisional: nombre, correo y cuentas vinculadas |

Al abrir un Nodex desde el panel, la URL cambia con `history.pushState`, sin navegar: el panel no se desmonta y conserva los filtros.

### La rejilla tipo Keep (*masonry*)

Se hace con **columnas CSS** (`columns-1 sm:columns-2 lg:columns-3 xl:columns-4`), sin librería. Las tarjetas se reparten **de arriba abajo por columnas**, no por filas. Para un panel de notas es aceptable, y se cambiará si hace falta un orden estricto por filas.

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

El logo provisional (`components/logo.tsx` y `app/icon.svg`) es el icono del boceto 4: un nodo con satélites.

## Decisiones técnicas

- **Una regla de ESLint desactivada:** `@next/next/no-img-element`. Las imágenes de vista previa de los enlaces vienen de cualquier web, y `next/image` exigiría declarar todos los dominios.
- **`AGENTS.md`:** lo crea y lo mantiene Next.js. Avisa a los asistentes de IA de que consulten la documentación de la versión instalada.
