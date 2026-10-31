# Esqueleto funcional del frontend: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir en `frontend/` una versión funcional de Nodex (login, registro, panel tipo Keep con grupos, Nodexs, prioridad y búsqueda) conectada al backend existente, con la estructura de los bocetos y un estilo provisional.

**Architecture:** Next.js 16 (App Router) sirve la interfaz y reenvía `/api/*` al backend Express (`localhost:4000`), de modo que todo vive en un único dominio y la cookie de sesión funciona sin CORS. Las pantallas piden los datos desde el navegador con TanStack Query a través de una única función `api()`. Los estilos son Tailwind y los componentes, shadcn/ui, con los colores definidos como variables CSS.

**Tech Stack:** Next.js 16.4, React, TypeScript, Tailwind CSS 4, shadcn/ui, TanStack Query 5, next-themes, Sonner.

**Spec:** [`docs/disenos/2026-10-24-frontend-esqueleto-design.md`](../disenos/2026-10-24-frontend-esqueleto-design.md)

## Global Constraints

- Todo el texto visible está en español. Los mensajes de error del backend se muestran tal cual llegan.
- **Código sin ningún comentario**, mínimo y sin abstracciones innecesarias (memoria `codigo-sin-comentarios`; skill "simplificar-el-código-implementado").
- **Git lo hace Jose:** ningún paso hace commit, push ni PR. Al final se propone un único commit y un PR, con título y descripción para cada uno.
- No se añade ninguna dependencia fuera de las de este plan sin consultarlo.
- Las peticiones van siempre a rutas relativas `/api/...`, nunca a `localhost:4000` desde el navegador.
- Colores provisionales: principal `#FFA247`; fondo `#FFFFFF` (claro) y `#1F1F1F` (oscuro). Tipografía: Geist.
- Rejilla de 50 Nodexs por página. La búsqueda espera 300 ms tras la última tecla.
- Responsivo desde 375 px. Por debajo de `md` (768 px), la barra lateral pasa a ser una barra inferior.
- **Pruebas:** según el orden de bloques del proyecto, los tests automáticos van en el bloque de pruebas. Aquí cada tarea se verifica con `npm run lint`, `npm run typecheck` y una comprobación en el navegador integrado con el backend arrancado.
- Usuarios de prueba solo con email `@nodex.test`. Al terminar se borran junto con sus sesiones, y se paran los servidores de prueba.

## Review Focus

1. **Sesión caducada a mitad de uso:** cualquier `401` fuera de `/login` debe llevar a `/login?expired=1` sin bucles de redirección. Prueba en la tarea 4.
2. **Editar los grupos de un Nodex:** `PATCH /nodexs/:id` no acepta `groupIds`, así que hay que calcular la diferencia y llamar a `POST`/`DELETE /groups/:id/nodexs`. Si no, el cambio de grupos se pierde en silencio. Prueba en la tarea 7.
3. **Error de red o 5xx al guardar:** la ventana no se cierra y no se pierde el texto escrito. Prueba en la tarea 7.
4. **Caracteres especiales en la búsqueda** (`%`, `&`, `?`, acentos): se codifican con `encodeURIComponent` y no rompen la URL. Prueba en la tarea 8.
5. **Borrar el grupo que está seleccionado en el filtro:** el filtro vuelve a "Todos" y no se queda pidiendo un grupo que ya no existe. Prueba en la tarea 5.

---

## Estructura de archivos

```
frontend/
├── package.json, tsconfig.json, eslint.config.mjs, postcss.config.mjs, components.json
├── next.config.ts                     rewrite /api/:path* → BACKEND_URL/api/:path*
├── src/
│   ├── proxy.ts                       redirecciones según la cookie nodex.sid
│   ├── app/
│   │   ├── layout.tsx                 html, fuente Geist, <Providers>
│   │   ├── providers.tsx              QueryClientProvider, ThemeProvider, Toaster
│   │   ├── globals.css                tokens claro/oscuro
│   │   ├── icon.svg                   favicon (logo provisional)
│   │   ├── error.tsx                  error inesperado con "Reintentar"
│   │   ├── (auth)/layout.tsx          degradado naranja + tarjeta + hueco del carrusel
│   │   ├── (auth)/login/page.tsx
│   │   ├── (auth)/registro/page.tsx
│   │   ├── (app)/layout.tsx           guarda de sesión + Sidebar + TopBar
│   │   ├── (app)/page.tsx             panel
│   │   ├── (app)/nodexs/[id]/page.tsx panel con la ventana abierta
│   │   └── (app)/perfil/page.tsx      perfil provisional
│   ├── components/
│   │   ├── ui/                        generados por shadcn
│   │   ├── logo.tsx
│   │   ├── auth-form.tsx              campos + error + botones OAuth
│   │   ├── sidebar.tsx                lateral en md+, inferior en móvil
│   │   ├── top-bar.tsx                píldora: ubicación + búsqueda
│   │   ├── settings-dialog.tsx
│   │   ├── board.tsx                  estado del panel: filtro, orden, búsqueda, ventana
│   │   ├── group-filter.tsx
│   │   ├── sort-menu.tsx
│   │   ├── nodex-grid.tsx
│   │   ├── nodex-card.tsx
│   │   └── nodex-dialog.tsx
│   └── lib/
│       ├── api.ts
│       ├── types.ts
│       ├── format.ts                  dominio de una URL, etiquetas de prioridad
│       └── queries/
│           ├── auth.ts
│           ├── groups.ts
│           └── nodexs.ts
```

---

### Task 1: Proyecto Next.js con Tailwind, shadcn/ui y tokens provisionales

**Files:**
- Create: `frontend/` (con `create-next-app`), `frontend/src/app/globals.css`, `frontend/src/app/icon.svg`, `frontend/src/components/logo.tsx`
- Modify: `frontend/next.config.ts`, `frontend/src/app/layout.tsx`, `frontend/package.json`, `frontend/README.md`, `.gitignore` (si hace falta)

**Interfaces:**
- Produces: `<Logo className?: string />` (SVG del nodo con satélites, color `currentColor`); clases de Tailwind `bg-primary`, `bg-background`, `bg-card`, `text-muted-foreground`… definidas por los tokens.

- [ ] **Step 1: Generar el proyecto.** Guarda antes `frontend/README.md`, porque `create-next-app` necesita una carpeta vacía; muévelo fuera y restáuralo después. Desde la raíz del repositorio: `npx create-next-app@16.4.3 frontend --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack-question`. Si una opción no existe en esa versión, acepta su valor por defecto. Esperado: `frontend/package.json` con `next` 16.4.3.
- [ ] **Step 2: Scripts de instalación (npm 12).** Si `npm install` avisa de scripts bloqueados, añade a `frontend/package.json` un `allowScripts` como el de `backend/package.json`: deniega los que no sean necesarios y aprueba solo los imprescindibles para compilar (por ejemplo, `sharp` si Next lo pide). Esperado: `npm install` sin avisos.
- [ ] **Step 3: Añadir el script `"typecheck": "tsc --noEmit"`** a `frontend/package.json` y fija el puerto con `"dev": "next dev -p 3000"`.
- [ ] **Step 4: Iniciar shadcn/ui y añadir los componentes.** `npx shadcn@latest init` (estilo por defecto, color base `neutral`, variables CSS) y `npx shadcn@latest add button input label textarea dialog alert-dialog dropdown-menu badge skeleton sonner`. Instala también `npm i @tanstack/react-query next-themes`, con las versiones exactas que se resuelvan. Esperado: `src/components/ui/*.tsx` y `components.json`.
- [ ] **Step 5: Tokens en `globals.css`.** En `:root`, `--primary: #FFA247`, `--primary-foreground: #1F1F1F`, `--background: #FFFFFF` y `--radius: 1rem`. En `.dark`, `--background: #1F1F1F`, `--card: #2B2B2B`, `--foreground: #F5F5F5` y el mismo `--primary`. Mantén el resto de variables que genera shadcn.
- [ ] **Step 6: Rewrite en `next.config.ts`.** `rewrites()` devuelve `[{ source: "/api/:path*", destination: \`${process.env.BACKEND_URL ?? "http://localhost:4000"}/api/:path*\` }]`.
- [ ] **Step 7: Logo provisional.** `src/components/logo.tsx` exporta un SVG con viewBox `0 0 64 64`: un círculo central (r=12) y seis satélites (r=4–6) unidos con líneas, como el boceto 4, con `fill`/`stroke="currentColor"`. Copia el mismo SVG a `src/app/icon.svg` con `fill="#FFA247"`.
- [ ] **Step 8: `layout.tsx` raíz.** `<html lang="es" suppressHydrationWarning>`, fuente Geist (ya viene) y `metadata = { title: "Nodex", description: "Tus notas y enlaces, conectados" }`. La página de inicio de ejemplo se sustituye por `<Logo>` centrado: se reemplazará en la tarea 4.
- [ ] **Step 9: Verificar.** Arranca el backend (`npm run dev` en `backend/`) y el frontend (`npm run dev` en `frontend/`). Esperado: `curl http://localhost:3000/api/health` → `{"status":"ok","database":"ok"}` y la página `/` muestra el logo. `npm run lint` y `npm run typecheck` sin errores.

### Task 2: Cliente de la API, tipos, proveedores y redirecciones de sesión

**Files:**
- Create: `frontend/src/lib/api.ts`, `frontend/src/lib/types.ts`, `frontend/src/lib/format.ts`, `frontend/src/app/providers.tsx`, `frontend/src/proxy.ts`, `frontend/src/lib/queries/auth.ts`
- Modify: `frontend/src/app/layout.tsx`, `.env.example`, `.env` (solo `APP_URL`; los secretos no se tocan ni se leen)

**Interfaces:**
- Produces (`lib/types.ts`):
  - `type Priority = "low" | "medium" | "high" | "urgent"`
  - `type User = { id: string; name: string; email: string; avatarUrl: string | null; tutorialCompletedVersion: number | null }`
  - `type Profile = User & { providers: ("google" | "github")[] }`
  - `type Group = { id: string; name: string; description: string | null; createdAt: string; updatedAt: string; nodexCount?: number }`
  - `type Nodex = { id: string; type: "note" | "link"; title: string; content: string | null; url: string | null; priority: Priority | null; groupIds: string[]; createdAt: string; updatedAt: string; linkPreview: { title: string | null; imageUrl: string | null; siteName: string | null; status: string } | null }`
  - `type NodexMatch = Nodex & { similarity: number }` y `type NodexResult = Nodex & { score: number }`
- Produces (`lib/api.ts`):
  - `class ApiError extends Error { status: number; fields: Record<string, string[]> }`: `fields` sale de `details` cuando el backend responde `400 { error, details }`.
  - `api<T>(path: string, options?: { method?: string; body?: unknown }): Promise<T>`. Antepone `/api`, envía JSON y devuelve `undefined` en `204`. Si la respuesta no es correcta, lanza `ApiError` con el `error` del backend. Si falla la red, lanza `ApiError(0, "No se ha podido conectar con el servidor")`.
- Produces (`lib/format.ts`): `PRIORITY_LABELS: Record<Priority, string>` = `{ urgent: "Urgente", high: "Alta", medium: "Media", low: "Baja" }`; `domainOf(url: string): string` devuelve el *hostname* sin `www.`; `looksLikeUrl(text: string): boolean` es verdadero si el texto empieza por `http://` o `https://` y `new URL` lo acepta.
- Produces (`lib/queries/auth.ts`): `useMe()` → `useQuery<User>` con clave `["me"]`, que llama a `/auth/me` y desenvuelve `user`; `useLogin()`, `useRegister()` y `useLogout()` → `useMutation`. Las dos primeras, al terminar bien, guardan `["me"]` y hacen `router.replace("/")`; la tercera hace `queryClient.clear()` y `router.replace("/login")`.

- [ ] **Step 1: Escribir `types.ts`, `api.ts` y `format.ts`** con las firmas de arriba.
- [ ] **Step 2: `providers.tsx` (`"use client"`).** Crea un `QueryClient` una sola vez (`useState`), con `queries: { retry: (n, e) => !(e instanceof ApiError && e.status < 500) && n < 2, staleTime: 30_000 }`. Su `QueryCache` y su `MutationCache` tienen un `onError` que, si recibe `ApiError` con `status === 401` y la ruta actual no es `/login` ni `/registro`, hace `queryClient.clear()` y `window.location.assign("/login?expired=1")`. Envuelve todo en `ThemeProvider attribute="class" defaultTheme="system" enableSystem` y añade `<Toaster richColors position="bottom-right" />`. Úsalo en `layout.tsx`.
- [ ] **Step 3: `proxy.ts`.** `export function proxy(request: NextRequest)`: si no existe la cookie `nodex.sid` y la ruta no es `/login` ni `/registro`, redirige a `/login`. Si existe y la ruta es `/login` o `/registro`, redirige a `/`. `config.matcher` excluye `/api`, `/_next`, `icon.svg` y `favicon.ico`.
- [ ] **Step 4: `queries/auth.ts`** con las firmas de arriba.
- [ ] **Step 5: `APP_URL`.** En `.env.example`, `APP_URL="http://localhost:3000"`. En `.env`, cambia solo esa línea con un reemplazo de línea completa, sin mostrar el archivo. Esperado: `grep -c '^APP_URL="http://localhost:3000"' .env` → `1`.
- [ ] **Step 6: Verificar.** Con los dos servidores arrancados (reinicia el backend en una terminal nueva para que lea el `.env`), `curl -i http://localhost:3000/` → `307` con `location: /login`. `npm run lint` y `npm run typecheck` sin errores.

### Task 3: Login y registro

**Files:**
- Create: `frontend/src/app/(auth)/layout.tsx`, `frontend/src/app/(auth)/login/page.tsx`, `frontend/src/app/(auth)/registro/page.tsx`, `frontend/src/components/auth-form.tsx`

**Interfaces:**
- Consumes: `useLogin`, `useRegister`, `ApiError`, `Logo`.
- Produces: `<AuthForm mode: "login" | "register" />`.

- [ ] **Step 1: `(auth)/layout.tsx`.** Fondo con degradado vertical de `#FFA247` a `#FFE0BF`, ocupando toda la pantalla. En `md+`, dos columnas: a la izquierda, una tarjeta (`bg-card`, borde blanco de 6 px, `rounded-2xl`) con `children`; a la derecha, un bloque `bg-neutral-600 rounded-2xl` con el logo y el texto "Tus notas y enlaces, conectados", que reserva el sitio del carrusel. En móvil, solo la tarjeta.
- [ ] **Step 2: `AuthForm`.** Campos `name` (solo en registro), `email` (`type="email"`) y `password` (`minLength={8}` en registro), todos `required`. Con `ApiError`, muestra `fields[campo][0]` bajo cada campo y `error.message` sobre el botón, sin vaciar lo escrito. El botón se desactiva mientras se envía. Debajo, un separador "o" y dos enlaces `<a href="/api/auth/google">Continuar con Google</a>` y `<a href="/api/auth/github">Continuar con GitHub</a>`, con estilo de botón. Al pie, un enlace a la otra pantalla ("¿No tienes cuenta? Regístrate" / "¿Ya tienes cuenta? Inicia sesión").
- [ ] **Step 3: Mensajes por URL en `/login`.** `?expired=1` → "Tu sesión ha caducado. Vuelve a iniciar sesión". `?error=google` o `?error=github` → "No se ha podido iniciar sesión con Google" (o GitHub).
- [ ] **Step 4: Verificar en el navegador integrado.** Regístrate con `prueba-<marca de tiempo>@nodex.test` → llegas a `/` (aún solo el logo). Borra las cookies, entra en `/login` con una contraseña mala → "Email o contraseña incorrectos" (el mensaje del backend) y el email sigue escrito. Un registro con un email repetido muestra el `409` del backend. A 375 px, la tarjeta ocupa el ancho sin scroll horizontal.

### Task 4: Estructura de la app, ajustes, perfil y errores

**Files:**
- Create: `frontend/src/app/(app)/layout.tsx`, `frontend/src/app/(app)/page.tsx`, `frontend/src/app/(app)/perfil/page.tsx`, `frontend/src/app/error.tsx`, `frontend/src/components/sidebar.tsx`, `frontend/src/components/top-bar.tsx`, `frontend/src/components/settings-dialog.tsx`
- Modify: `frontend/src/app/page.tsx` (se elimina, porque `/` pasa a `(app)/page.tsx`)

**Interfaces:**
- Consumes: `useMe`, `useLogout`, `Logo`, `api`, `Profile`.
- Produces:
  - `<TopBar location: string; search?: string; onSearchChange?: (q: string) => void />`. Píldora centrada, `bg-primary`, `rounded-full`; muestra `location` y, si recibe `onSearchChange`, un campo de búsqueda.
  - `<Sidebar onOpenSettings: () => void />`. En `md+`, columna fija a la izquierda (`bg-primary rounded-2xl`, como el boceto 2) con el logo arriba, el icono "Panel" (enlace a `/`, marcado si la ruta es `/` o `/nodexs/*`) y el icono "Ajustes" abajo. Por debajo de `md`, barra fija inferior con los mismos iconos. Iconos de `lucide-react` (ya viene con shadcn): `LayoutGrid` y `Settings`.
  - `<SettingsDialog open: boolean; onOpenChange: (open: boolean) => void />`. Su `DialogOverlay` lleva `backdrop-blur-sm bg-black/30`. Contiene el tema (tres botones: Claro, Oscuro, Sistema, con `useTheme` de next-themes), un enlace "Perfil" a `/perfil` y el botón "Cerrar sesión" (`useLogout`).

- [ ] **Step 1: `(app)/layout.tsx` (`"use client"`).** Llama a `useMe()`. Mientras carga, muestra `<Logo>` centrado con `animate-pulse` (pantalla de carga, boceto 4). Si hay datos, coloca `Sidebar` y `<main>` con `children` y un margen inferior en móvil para no quedar tapado por la barra. Gestiona el estado `settingsOpen`.
- [ ] **Step 2: `TopBar`, `Sidebar` y `SettingsDialog`** con las interfaces de arriba.
- [ ] **Step 3: `(app)/page.tsx` provisional.** `<TopBar location="Panel" />` y un texto "Hola, {nombre}". La tarea 6 lo sustituye por `<Board />`.
- [ ] **Step 4: `perfil/page.tsx`.** Llama a `GET /me` con una `useQuery` local (clave `["profile"]`). Muestra el nombre y el email, y por cada proveedor (`google`, `github`) "Vinculada" o un enlace `<a href="/api/auth/{p}/link">Vincular</a>`. Con `?linked=google` muestra el toast "Cuenta de Google vinculada"; con `?error=google`, "No se ha podido vincular la cuenta de Google".
- [ ] **Step 5: `error.tsx` (`"use client"`).** Muestra "Algo ha salido mal" y un botón "Reintentar" que llama a `reset()`.
- [ ] **Step 6: Verificar.** Con sesión, `/` muestra la barra lateral y la superior. Los ajustes se abren con el fondo difuminado y el tema cambia y se mantiene al recargar. "Cerrar sesión" lleva a `/login`. **Review Focus 1:** con la sesión iniciada, borra la fila de la sesión en la base de datos (o espera a que caduque) y recarga → acabas en `/login?expired=1` con el aviso, sin bucle. A 375 px aparece la barra inferior. `npm run lint` y `npm run typecheck` sin errores.

### Task 5: Grupos y filtro

**Files:**
- Create: `frontend/src/lib/queries/groups.ts`, `frontend/src/components/group-filter.tsx`

**Interfaces:**
- Produces (`queries/groups.ts`): `useGroups()` → `useQuery<Group[]>` con clave `["groups"]`; `useCreateGroup()` (`{ name }` → `Group`), `useRenameGroup()` (`{ id, name }` → `Group`) y `useDeleteGroup()` (`id` → `void`). Las tres invalidan `["groups"]`; la de borrar invalida también `["nodexs"]`.
- Produces: `type BoardFilter = { kind: "all" } | { kind: "orphans" } | { kind: "group"; groupId: string }`, exportado desde `group-filter.tsx`, y `<GroupFilter value: BoardFilter; onChange: (f: BoardFilter) => void />`.

- [ ] **Step 1: `queries/groups.ts`** con las firmas de arriba (rutas: `GET /groups`, `POST /groups`, `PATCH /groups/:id` y `DELETE /groups/:id`).
- [ ] **Step 2: `GroupFilter`.** Una fila con scroll horizontal de etiquetas en forma de píldora: "Todos", "Huérfanos", un grupo por etiqueta (con `nodexCount`) y un botón "+ Grupo". El botón muestra un campo en línea que crea el grupo con `Enter` y se cancela con `Esc`. Cada grupo tiene un menú (`DropdownMenu`) con "Renombrar" (el mismo campo en línea) y "Borrar". "Borrar" pide confirmación con `AlertDialog`: "Los Nodexs del grupo no se borran". Los errores del backend (`409` "Ya tienes un grupo con ese nombre") salen en un toast.
- [ ] **Step 3: Review Focus 5.** Si se borra el grupo seleccionado, `GroupFilter` llama a `onChange({ kind: "all" })`.
- [ ] **Step 4: Verificar.** Se integra en la tarea 6 (que pinta el filtro). Por ahora, `npm run lint` y `npm run typecheck` sin errores.

### Task 6: Panel: rejilla, tarjetas, orden y filtro por prioridad

**Files:**
- Create: `frontend/src/lib/queries/nodexs.ts`, `frontend/src/components/board.tsx`, `frontend/src/components/nodex-grid.tsx`, `frontend/src/components/nodex-card.tsx`, `frontend/src/components/sort-menu.tsx`
- Modify: `frontend/src/app/(app)/page.tsx`

**Interfaces:**
- Consumes: `BoardFilter`, `GroupFilter`, `useGroups`, `TopBar`, `PRIORITY_LABELS`, `domainOf`.
- Produces (`queries/nodexs.ts`):
  - `type NodexQuery = { filter: BoardFilter; sort: "recent" | "priority"; priority: Priority | null }`
  - `useNodexs(q: NodexQuery)` → `useInfiniteQuery` con clave `["nodexs", q]`. Llama a `GET /nodexs` con `groupId` u `orphan=true` según el filtro, más `sort`, `priority` si no es nulo, `limit=50` y `cursor`. `getNextPageParam` devuelve `nextCursor ?? undefined`.
  - `useNodex(id)` (`["nodex", id]`), `useRelated(id)` (`["related", id]`) y `useSearch(q)` (`["search", q]`, `enabled: q.length > 0`), que devuelven `Nodex`, `NodexMatch[]` y `NodexResult[]`.
  - `useCreateNodex()` → `{ nodex: Nodex; duplicates: NodexMatch[] }`, `useUpdateNodex()` y `useDeleteNodex()`. Las tres invalidan `["nodexs"]`, `["groups"]` y `["search"]`; las de editar y borrar invalidan también `["nodex", id]`.
- Produces: `<SortMenu sort; priority; onChange: (v: { sort; priority }) => void />`; `<NodexCard nodex: Nodex; groups: Group[]; onOpen: (id: string) => void />`; `<NodexGrid nodexs: Nodex[]; groups: Group[]; onOpen; hasMore: boolean; onLoadMore: () => void; loading: boolean; empty: ReactNode />`; `<Board openId?: string />`.

- [ ] **Step 1: `queries/nodexs.ts`** con las firmas de arriba.
- [ ] **Step 2: `NodexCard`.** Un `button` a ancho completo con `bg-card rounded-2xl border p-4 text-left`. Si hay `linkPreview.imageUrl`, la imagen va arriba (`<img>` con `loading="lazy"`). Luego el título (`font-medium`), el contenido recortado a 8 líneas (`line-clamp-8`), el dominio si es un enlace y una fila de `Badge`: la prioridad (`PRIORITY_LABELS`; urgente y alta con `bg-primary`) y los nombres de sus grupos.
- [ ] **Step 3: `NodexGrid`.** *Masonry* con CSS: `columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4`, y cada tarjeta en `break-inside-avoid mb-4`. No se usa librería: se acepta que el orden vaya por columnas. Al cargar por primera vez, muestra 8 `Skeleton` de alturas variadas. Si la lista está vacía, muestra `empty`. Si `hasMore`, añade al final un botón "Cargar más" (`onLoadMore`).
- [ ] **Step 4: `SortMenu`.** Un `DropdownMenu` con el botón "Ordenar y filtrar". La sección "Ordenar" tiene "Más recientes" y "Por prioridad" (con `DropdownMenuRadioGroup`). La sección "Prioridad" tiene "Todas", "Urgente", "Alta", "Media" y "Baja".
- [ ] **Step 5: `Board`.** Guarda el estado `filter`, `sort`, `priority`, `search` y el Nodex abierto. Pinta `TopBar`, cuya `location` es "Panel", "Panel · Huérfanos" o "Panel · {nombre del grupo}"; debajo, en una fila, `GroupFilter` y `SortMenu`; y después `NodexGrid`. Mensajes de vacío: sin filtros, "Aún no tienes Nodexs" con el botón "Crear el primero"; con filtro, "No hay nada aquí" con "Ver todos" (reinicia el filtro y la prioridad). `(app)/page.tsx` pasa a ser `<Board />`.
- [ ] **Step 6: Verificar.** Crea Nodexs con `curl` o desde la consola del navegador (`fetch('/api/nodexs', …)`): 3 notas y 1 enlace, con prioridades distintas y uno en un grupo. Comprueba que salen en columnas, que el filtro por grupo y por "Huérfanos" funciona, que "Por prioridad" pone primero los urgentes y deja los que no tienen prioridad al final, y que el filtro "Alta" deja solo los de prioridad alta. Borrar el grupo seleccionado devuelve el filtro a "Todos" (Review Focus 5). Prueba también a 375 px y en modo oscuro.

### Task 7: Ventana del Nodex (crear, editar, duplicados, relacionados, borrar)

**Files:**
- Create: `frontend/src/components/nodex-dialog.tsx`, `frontend/src/app/(app)/nodexs/[id]/page.tsx`
- Modify: `frontend/src/components/board.tsx`

**Interfaces:**
- Consumes: `useNodex`, `useRelated`, `useCreateNodex`, `useUpdateNodex`, `useDeleteNodex`, `useGroups`, `api`, `looksLikeUrl`, `PRIORITY_LABELS`.
- Produces: `<NodexDialog mode: "create" | "edit"; id?: string; open: boolean; onOpenChange: (open: boolean) => void; onOpenNodex: (id: string) => void />`.

- [ ] **Step 1: Formulario.** Campos: título (obligatorio), URL (opcional; si se rellena, `type` es `"link"`, y si no, `"note"`), contenido (`Textarea`), prioridad (botones "Sin prioridad", "Baja", "Media", "Alta" y "Urgente") y grupos (etiquetas seleccionables con los grupos del usuario). Si se pega en el título algo que cumple `looksLikeUrl` y la URL está vacía, se pasa a la URL. El overlay lleva el mismo `backdrop-blur-sm` que los ajustes.
- [ ] **Step 2: Crear.** `POST /nodexs` con `groupIds`. Si `duplicates` está vacío, cierra la ventana y muestra el toast "Nodex creado". Si no, la ventana sigue abierta y muestra el aviso "Ya tienes algo muy parecido" con la lista de duplicados (título y dominio). Cada duplicado tiene el botón "Ver el existente" (`onOpenNodex(id)`), y debajo está el botón "Borrar el que acabo de crear" (`DELETE` y cerrar).
- [ ] **Step 3: Editar (Review Focus 2).** `PATCH /nodexs/:id` con `{ title, content, url, priority }`. Después, compara los `groupIds` iniciales con los elegidos: `POST /groups/:g/nodexs { nodexId }` por cada grupo añadido y `DELETE /groups/:g/nodexs/:id` por cada grupo quitado, con `Promise.all`. Al terminar, invalida `["nodexs"]`, `["groups"]` y `["nodex", id]`, cierra la ventana y muestra el toast "Cambios guardados".
- [ ] **Step 4: Errores (Review Focus 3).** Con `ApiError` 400, el mensaje va bajo el campo (`fields`). Con un error de red o un 5xx, muestra el toast "No se ha podido guardar. Inténtalo de nuevo" y la ventana sigue abierta con lo escrito. En edición, un 404 al cargar muestra "Este Nodex ya no existe" en lugar del formulario.
- [ ] **Step 5: Relacionados y borrar.** En edición, debajo del formulario, la lista "Relacionados" (`useRelated`): cada uno es un botón que llama a `onOpenNodex`. Si no hay ninguno, la sección no se muestra. El botón "Borrar" pide confirmación con `AlertDialog`, borra y muestra el toast "Enviado a la papelera".
- [ ] **Step 6: Integración.** `Board` pinta un botón flotante "+" (`fixed bottom-6 right-6`, y `bottom-20` en móvil para no tapar la barra; `rounded-full bg-primary size-14`, con `aria-label="Crear Nodex"`) que abre el modo crear. Al pulsar una tarjeta se abre el modo editar y se hace `router.push("/nodexs/{id}")`; al cerrar, `router.push("/")`. `nodexs/[id]/page.tsx` pinta `<Board openId={params.id} />`.
- [ ] **Step 7: Verificar.** Crear una nota → aparece en la rejilla. Crear un enlace con la URL de otro enlace existente → aviso de duplicado; "Borrar el que acabo de crear" lo quita. Editar el título, la prioridad y los grupos (quitar uno y añadir otro) → al recargar la página se mantienen. Abrir `/nodexs/<uuid inexistente>` → "Este Nodex ya no existe". Para simular un error de red, para el backend y guarda → toast de error y el texto sigue en la ventana. Los relacionados aparecen con dos notas de cocina. `Esc` cierra la ventana.

### Task 8: Búsqueda

**Files:**
- Modify: `frontend/src/components/board.tsx`, `frontend/src/components/top-bar.tsx`

**Interfaces:**
- Consumes: `useSearch`, `TopBar.onSearchChange`, `NodexGrid`.

- [ ] **Step 1: Retardo.** En `Board`, el valor `search` se copia a `debouncedSearch` 300 ms después de la última tecla (con `useEffect` y `setTimeout`, sin librería), y se recorta con `trim()`.
- [ ] **Step 2: Resultados.** Si `debouncedSearch` no está vacío, la rejilla muestra `useSearch(debouncedSearch)` en el orden del backend, sin `GroupFilter` ni `SortMenu`. La `location` pasa a ser "Buscar". Si no hay resultados: "Nada coincide con «{texto}»" y el botón "Borrar búsqueda". El campo de búsqueda tiene un botón ✕ para vaciarlo, y `Esc` también lo vacía.
- [ ] **Step 3: Review Focus 4.** `useSearch` construye la URL con `encodeURIComponent`. Verifica que `100%`, `a&b`, `¿qué?` y `canción` no rompen la petición (responden 200).
- [ ] **Step 4: Verificar.** Con las notas de la tarea 7, "legumbres" encuentra la nota de lentejas (por significado) y el nombre exacto de una nota la pone la primera. `npm run lint` y `npm run typecheck` sin errores.

### Task 9: Documentación, recorrido completo y limpieza

**Files:**
- Create: `docs/09-frontend.md`
- Modify: `frontend/README.md`, `docs/README.md`, `docs/07-brief-de-diseno.md`, `CLAUDE.md` (si cambia algo del stack)

- [ ] **Step 1: `docs/09-frontend.md`.** Con el mismo estilo que `06-sistema-backend.md`: qué es Next.js y el App Router (rutas por carpetas, *layouts*, grupos de rutas, `"use client"`), el *rewrite* y por qué un único dominio, `proxy.ts` (y por qué no es seguridad), TanStack Query (claves, invalidación, `useInfiniteQuery`), shadcn/ui y Tailwind (tokens y modo oscuro), el *masonry* con columnas CSS y su limitación, cómo se editan los grupos de un Nodex (diferencia y llamadas) y la tabla de estados y errores.
- [ ] **Step 2: `frontend/README.md`.** Cómo se pone en marcha (`npm install` y `npm run dev` con el backend arrancado), los scripts, la variable `BACKEND_URL` (opcional) y las rutas.
- [ ] **Step 3: `docs/README.md`** (añadir `09-frontend.md` al índice) y **`docs/07-brief-de-diseno.md`**. Proponer antes a Jose el texto del brief (bocetos, interpretación aprobada y tokens provisionales) y escribirlo solo con su visto bueno.
- [ ] **Step 4: Recorrido completo** en el navegador integrado, con un usuario `@nodex.test` nuevo: registro → crear grupo → crear una nota y un enlace → filtrar por grupo y por prioridad → ordenar por prioridad → buscar → editar → aviso de duplicado → borrar → cerrar sesión → login. Repetir lo esencial a 375 px y en modo oscuro.
- [ ] **Step 5: OAuth.** Pedir a Jose que añada las URLs de vuelta `http://localhost:3000/api/auth/google/callback` y `http://localhost:3000/api/auth/github/callback` en Google Cloud y GitHub, y comprobar después el login con los dos proveedores.
- [ ] **Step 6: Limpieza.** Borrar los usuarios `@nodex.test` y sus sesiones, y parar los servidores de prueba. `npm run lint`, `npm run typecheck` y `npm run build` en `frontend/` sin errores.
- [ ] **Step 7: Proponer a Jose** el título y la descripción del commit, y el título y la descripción del PR de `feature/frontend-base` → `develop`.
