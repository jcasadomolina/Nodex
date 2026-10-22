# Sistema de backend

API de Nodex: recibe las peticiones del frontend, aplica la lógica y habla con la base de datos ([Base de datos](08-base-de-datos.md)).

## Stack (aprobado)

| Necesidad | Elección | Por qué |
|-----------|----------|---------|
| Servidor | **Express 5** | Framework acordado. La versión 5 captura sola los errores de las funciones `async` |
| Lenguaje | **TypeScript** | Los errores aparecen al escribir el código, no al ejecutarlo |
| Ejecución en desarrollo | **tsx** | Ejecuta el `.ts` directamente y recarga al guardar |
| Acceso a datos | **Prisma 7** + **@prisma/adapter-pg** | Adaptador con el driver estándar de PostgreSQL, adecuado para un servidor siempre encendido |
| Sesiones (`RNF-9.2`) | **express-session** + **connect-pg-simple** | La sesión se guarda en la tabla `sessions`; la cookie solo lleva un ID firmado |
| Contraseñas (`RF-01.4`) | **argon2** | Algoritmo recomendado por OWASP |
| Google y GitHub (`RF-01.2`) | **Passport.js** | Estándar en Express; un plugin por proveedor |
| Validación | **Zod** | Comprueba cada petición y genera los tipos de TypeScript |
| Seguridad | **helmet** y límite de intentos en el login | Cabeceras HTTP seguras y freno a ataques de fuerza bruta |

## Estructura

```
backend/src/
├── app.ts              ← crea Express y conecta middlewares y rutas
├── server.ts           ← arranca el servidor
├── config/env.ts       ← lee y valida el .env (si falta una variable, no arranca)
├── lib/prisma.ts       ← una única conexión a la base
├── middleware/         ← requireAuth, gestión de errores…
└── modules/            ← una carpeta por funcionalidad: rutas, validación y lógica
    ├── auth/
    ├── groups/
    └── nodexs/
```

Una funcionalidad nueva es una carpeta nueva en `modules/`, sin tocar las demás.

## Plan por ramas

Cada rama sale de `develop` y vuelve a `develop` con un pull request.

| Rama | Contenido | Requisitos |
|------|-----------|------------|
| `feature/backend-base` | Express, TypeScript, conexión a Prisma, validación del `.env`, gestión de errores y endpoint `/health` | — |
| `feature/auth` | Registro, login, logout y sesiones | `RF-01.1`, `RF-01.3`–`RF-01.7` |
| `feature/oauth` | Login con Google y GitHub | `RF-01.2` |
| `feature/grupos-nodexs` | CRUD de grupos y Nodexs, y asignación de Nodexs a grupos | `RF-04.1`, `RF-04.4`, `RF-05.1`, `RF-05.2` |
| `feature/tutorial` | Guardar qué versión del tutorial ha visto cada usuario | `RF-10.4`, `RF-10.5` |
| `feature/perfil` | Pantalla de perfil: nombre e imagen | HU-02 |
| `feature/ia` | Sugerencias de grupo y enriquecimiento | `RF-04.2`, `RF-04.3`, `RF-05.4`, `RF-05.5` |

## Cómo funciona una petición

```
Petición → helmet (cabeceras seguras) → express.json (lee el cuerpo)
         → ruta del módulo (/api/...) → respuesta
                    │
                    └─ si algo lanza un error → errorHandler → JSON { error }
```

- **Middleware:** función por la que pasa cada petición antes de llegar a la ruta, por ejemplo para añadir cabeceras o comprobar la sesión. Se ejecutan en el orden en que se registran en `app.ts`.
- **Gestión de errores centralizada:** las rutas no capturan cada error por su cuenta. Lanzan un `HttpError` (o Zod lanza un `ZodError`) y un único middleware, `errorHandler`, decide la respuesta: `400`, `404` o `500`. A un `500` nunca se le añaden detalles internos, que podrían dar pistas a un atacante.
- **Validación del entorno:** `config/env.ts` comprueba las variables al arrancar. Si falta `DATABASE_URL`, el servidor no arranca en lugar de fallar más tarde en mitad de una petición.
- **`/api/health`:** permite comprobar que el servidor y la base responden. Si la base cae, el servidor sigue en pie y responde `503` (`RNF-08.2`).

## Autenticación (`feature/auth`)

Endpoints bajo `/api/auth`: `register`, `login`, `logout` y `me`. El detalle de cada uno está en el [README del backend](../backend/README.md#endpoints).

### Cómo funciona una sesión

```
1. login correcto  → el servidor crea una fila en la tabla sessions: { userId }
                   → responde con la cookie nodex.sid = ID de esa fila, firmado
2. cada petición   → el navegador envía la cookie
                   → express-session comprueba la firma, lee la fila y rellena req.session.userId
3. logout          → se borra la fila y la cookie
```

La cookie solo contiene un identificador. Los datos de la sesión se quedan en el servidor, así que no se pueden leer ni modificar desde el navegador (`RNF-9.2`).

### Decisiones de seguridad

| Medida | Qué evita |
|--------|-----------|
| Contraseña con **argon2id** (`RF-01.4`) | Si alguien roba la base, no puede recuperar las contraseñas: un hash solo se puede comprobar, no deshacer, y argon2 está diseñado para que probar millones de contraseñas sea lentísimo |
| Cookie **firmada** con `SESSION_SECRET` | Que alguien fabrique una cookie válida. Sin el secreto no se puede firmar |
| Cookie **`httpOnly`** | Que un script malicioso inyectado en la página lea la cookie |
| Cookie **`sameSite: lax`** | Que otra web haga peticiones en tu nombre (ataque CSRF) |
| Cookie **`secure`** en producción | Que viaje sin cifrar: solo se envía por HTTPS |
| **`session.regenerate`** al entrar | Que un atacante te haga usar una sesión que él ya conoce (*session fixation*). Cada login crea un ID nuevo |
| **Mismo mensaje** si el email no existe o la contraseña es incorrecta | Que se pueda averiguar qué emails tienen cuenta |
| **Hash "señuelo"** cuando el email no existe | Lo mismo, pero midiendo tiempos: sin él, la respuesta sería más rápida para un email inexistente, porque no habría hash que comprobar |
| **Límite de 10 intentos / 15 min** por IP | Que se prueben contraseñas por fuerza bruta |
| **Emails en minúsculas** (`RF-01.3`) | Que `Ana@x.com` y `ana@x.com` sean dos cuentas distintas |

Si el email ya existe, el registro responde `409`. Se detecta con el error de clave única de la base (código `P2002` de Prisma) y no con una consulta previa, así se cubre también el caso de dos registros simultáneos.

## Login con Google y GitHub (`feature/oauth`)

### Qué es OAuth

OAuth permite entrar en Nodex con una cuenta de Google o GitHub sin crear una contraseña. Nodex nunca ve la contraseña de Google: Google confirma quién eres y le pasa a Nodex tu nombre, email y foto.

```
1. GET /api/auth/google           → Nodex redirige a Google con un "state" aleatorio
2. El usuario acepta en Google    → Google redirige a /api/auth/google/callback?code=...&state=...
3. Passport comprueba el state    → evita que otra web inyecte un login falso (CSRF)
   y cambia el code por el perfil del usuario, hablando directamente con Google
4. Nodex busca o crea el usuario  → inicia sesión (igual que el login normal) y redirige a APP_URL
```

### Cómo se decide qué usuario es

1. Si ya existe una fila en `oauth_accounts` con ese proveedor e ID, es ese usuario.
2. Si no, y el proveedor da un **email verificado** que ya tiene cuenta en Nodex, se vincula a esa cuenta. Así, quien se registró con email y contraseña puede entrar después con Google.
3. Si no, se crea un usuario nuevo con nombre, email y foto del proveedor, sin contraseña.

Solo se usa el email si el proveedor confirma que está **verificado**. Si no fuese así, alguien podría crear una cuenta de GitHub con tu email sin verificarlo y entrar en tu cuenta de Nodex. Si no hay email verificado, el login falla y redirige a `/login?error=<proveedor>`.

### Detalles

- Las credenciales son **opcionales**: si faltan en el `.env`, el servidor arranca igual y esos endpoints responden `503`. Así se puede desarrollar sin haberlas creado.
- `APP_URL` es la dirección que ve el navegador. Ahora es el backend (`http://localhost:4000`). Cuando exista el frontend será la de Next.js, que reenviará `/api/*` al backend, y habrá que actualizar las URLs de callback en Google y GitHub.
- Los tipos de `passport-github2` no aceptan `state: true`, aunque la librería sí lo soporta. Por eso aparece `state: true as unknown as string`: es un ajuste solo para TypeScript, no cambia nada al ejecutar.

### Registrar Nodex en Google y GitHub

Ambos son gratuitos. Con las URLs de abajo funciona en local; para producción se añadirán las del dominio final.

**Google**
1. Entra en [console.cloud.google.com](https://console.cloud.google.com) y crea un proyecto llamado `Nodex`.
2. Abre **Google Auth Platform** y configura la pantalla de consentimiento: nombre `Nodex`, tu email de soporte y tipo de usuario **Externo**.
3. Mientras la app esté en modo **prueba**, solo pueden entrar los usuarios que añadas en **Audiencia → Usuarios de prueba**. Añade tu cuenta.
4. En **Clientes**, crea un cliente de tipo **Aplicación web** con este URI de redirección autorizado:
   `http://localhost:4000/api/auth/google/callback`
5. Copia el ID y el secreto del cliente en `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.

**GitHub**
1. Ve a **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Rellena: nombre `Nodex`, Homepage URL `http://localhost:4000`, Authorization callback URL:
   `http://localhost:4000/api/auth/github/callback`
3. Pulsa **Generate a new client secret**.
4. Copia el Client ID y el secreto en `GITHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET`.

**Problemas habituales**

| Síntoma | Causa | Solución |
|---------|-------|----------|
| `404` en la página de GitHub | GitHub no reconoce el Client ID | Cópialo con el botón de copiar de la OAuth App; suele tener 20 caracteres |
| GitHub o Google rechazan la redirección (`redirect_uri_mismatch`) | El callback registrado no coincide exactamente | Comprueba que sea `/api/auth/github/callback` en GitHub y `/api/auth/google/callback` en Google |
| El servidor sigue usando un valor antiguo aunque el `.env` esté bien | `--env-file` de Node no sustituye variables que ya existen en el entorno, y algunas extensiones de VS Code cargan el `.env` en la terminal al abrirla | Cierra la terminal y abre una nueva. Para comprobarlo: `echo %GITHUB_CLIENT_ID%` (cmd) |
| Tras cambiar el `.env` no cambia nada | Node solo lee el `.env` al arrancar; `watch` recarga con cambios de código, no del `.env` | Para el servidor (`Ctrl+C`) y vuelve a lanzar `npm run dev` |
| Google muestra "Acceso bloqueado" | La app está en modo prueba y esa cuenta no es usuario de prueba | Añádela en **Audiencia → Usuarios de prueba** |

Para probar: arranca con `npm run dev` y abre `http://localhost:4000/api/auth/google` en el navegador. Tras aceptar, acabarás en `http://localhost:4000/`, que responde `404` porque aún no hay frontend. Es normal: comprueba la sesión abriendo `http://localhost:4000/api/auth/me`.

## Grupos y Nodexs (`feature/grupos-nodexs`)

Endpoints bajo `/api/groups`, `/api/nodexs` y `/api/board`; el detalle está en el [README del backend](../backend/README.md#grupos-nodexs-y-panel-requieren-sesión). Todas las rutas usan `requireAuth`.

### Conceptos

- **Borrado lógico:** `DELETE` no elimina la fila, sino que rellena `deleted_at`. Todas las consultas filtran `deletedAt: null`, así que para el usuario ha desaparecido, pero los datos siguen ahí para una futura papelera. Por eso, al borrar un grupo, se puede crear otro con el mismo nombre: el índice único parcial solo cuenta los grupos no borrados.
- **Huérfano:** Nodex que no está en ningún grupo *activo*. Si se borra el único grupo de un Nodex, este pasa a ser huérfano automáticamente, sin tocar la tabla `group_nodexs`.
- **Paginación por cursor:** en lugar de "dame la página 3", el cliente dice "dame los 50 siguientes después de este ID" (`nextCursor`). Es más rápido que saltar filas con `OFFSET` y no repite ni salta Nodexs si se crean nuevos mientras se pagina.
- **`404` en vez de `403`:** si un usuario pide un recurso de otro, la API responde como si no existiera. Un `403` ("no tienes permiso") confirmaría que ese ID existe.
- **Asignar dos veces no falla:** `POST /api/groups/:id/nodexs` usa `skipDuplicates`, así que repetir la petición deja todo igual. A esto se le llama operación *idempotente*, y facilita el trabajo del frontend (por ejemplo, con un doble clic).
- **`/api/board`:** el panel central necesita grupos, Nodexs y sus relaciones a la vez. Una sola petición que lo devuelve todo evita que el frontend tenga que hacer varias y unirlas. Por ahora trae todos los Nodexs del usuario; si algún día son demasiados, se paginará.

### Cómo se protege el aislamiento

Cada consulta filtra por `userId` de la sesión. Además, la tabla `group_nodexs` tiene claves foráneas compuestas (ver [Base de datos](08-base-de-datos.md#aislamiento-entre-usuarios)): aunque el código tuviera un fallo, la base rechazaría meter un Nodex en el grupo de otro usuario.

## Tutorial (`feature/tutorial`)

El contenido del tutorial (textos y pasos) vive en el frontend, porque es igual para todos. El backend solo recuerda **qué versión ha visto cada usuario**, en la columna `users.tutorial_completed_version`:

| Valor guardado | Versión actual del tutorial (frontend) | Qué muestra el frontend |
|----------------|----------------------------------------|-------------------------|
| `null` | `1` | El tutorial completo (`RF-10.1`) |
| `1` | `1` | Nada |
| `1` | `2` | Solo las novedades (`RF-10.5`) |

- `GET /api/auth/me` devuelve `tutorialCompletedVersion`.
- `PUT /api/me/tutorial` con `{ version }` se llama al terminar o al saltar el tutorial (`RF-10.2`). Como se guarda en la base, vale para todos los dispositivos (`RF-10.4`).
- Volver a verlo (`RF-10.3`) es cosa del frontend: no cambia nada en el backend.

Es la primera migración que **amplía** la base: añade una columna opcional sin tocar nada de lo anterior, como marcan las [reglas de evolución](08-base-de-datos.md#reglas-para-que-la-base-acepte-cambios).

## Perfil (`feature/perfil`)

Endpoints bajo `/api/me` (HU-02). `GET /api/me` devuelve el perfil con el email (`RF-02.4`) y las cuentas vinculadas (`providers`), `PATCH /api/me` cambia el nombre (`RF-02.2`) y `/api/me/avatar` sube o borra la foto (`RF-02.3`). `RF-02.5` (WhatsApp) queda como ampliación futura.

### Cómo se sube una foto

```
Navegador ── multipart/form-data (campo "avatar") ──▶ multer
   multer: la guarda en memoria, comprueba tipo (JPG/PNG/WebP/GIF) y tamaño (≤ 5 MB)
        ──▶ lib/storage.ts ──▶ Cloudinary
   Cloudinary: recorta a 256×256 centrando en la cara, la convierte a WebP
               y devuelve la URL pública
        ──▶ se guarda la URL en users.avatar_url
```

- **multipart/form-data:** el formato que usan los formularios para enviar archivos. JSON no sirve para binarios, por eso hace falta **multer**, que lee ese formato en Express.
- **En memoria, no en disco:** la imagen pesa como mucho 5 MB y va directa a Cloudinary, así que no hace falta guardarla en el servidor. Además, los alojamientos gratuitos suelen tener un disco que se borra en cada reinicio.
- **Un archivo por usuario:** se guarda siempre como `nodex/avatars/<userId>`. Subir una foto nueva sobrescribe la anterior, así que no se acumulan fotos viejas que gasten cuota.
- **Tolerancia a fallos (`RNF-08.2`):** si Cloudinary no responde, la petición devuelve `502` con un mensaje claro, el error queda registrado en el servidor y la aplicación sigue funcionando. Sin `CLOUDINARY_URL`, la subida responde `503`.
- **Fotos de Google y GitHub:** si el usuario entró con OAuth, `avatar_url` apunta a la foto del proveedor. Subir una propia la sustituye, y borrarla deja el perfil sin foto.

### Vincular y desvincular cuentas (`RF-02.6`, `RF-02.7`)

Sirve para que una misma persona entre con Google o con GitHub aunque usen emails distintos.

```
1. Con sesión iniciada: GET /api/auth/github/link
   → se guarda en la sesión linkUserId = tu usuario y se va a GitHub como en un login normal
2. GitHub vuelve al mismo callback de siempre (no hay que registrar otra URL)
   → como hay linkUserId, en vez de buscar o crear usuario, se vincula la cuenta al tuyo
3. Redirige a /perfil?linked=github (o /perfil?error=github si no se pudo)
```

Al vincular, la cuenta de GitHub puede estar ya unida a **otro** usuario de Nodex:

| Ese otro usuario… | Resultado |
|-------------------|-----------|
| Está vacío: sin contraseña, sin otras cuentas, sin grupos ni Nodexs | La cuenta se pasa a tu usuario y el usuario vacío se borra, todo en una transacción |
| Tiene datos o más formas de entrar | No se vincula (`/perfil?error=github`). Así nunca se pierden datos de nadie |

Una **transacción** agrupa varias operaciones para que se hagan todas o ninguna: si fallase el borrado del usuario vacío, la cuenta tampoco cambiaría de dueño.

Al desvincular (`DELETE /api/me/providers/:provider`), el backend comprueba que te quede otra forma de entrar (una contraseña u otra cuenta). Si no, responde `409`, para que nadie se quede fuera de su propia cuenta.

### Mensajes de validación en español

`config/env.ts` activa `z.config(z.locales.es())`. Desde ahí, los mensajes por defecto de Zod salen en español (por ejemplo, *"Entrada inválida: se esperaba número, recibido texto"*). Los mensajes personalizados, como *"El nombre es obligatorio"*, se mantienen.

## Decisiones tomadas

- **Almacenamiento de imágenes:** **Cloudinary**, plan gratuito sin tarjeta (25 créditos al mes compartidos entre almacenamiento, tráfico y transformaciones). Las fotos se reducen a 256×256 en WebP (unos 15 KB). Todo el acceso irá en un único archivo, `lib/storage.ts`, para poder pasar a Cloudflare R2 si el tráfico crece. Las fotos de Google y GitHub no se guardan: solo su URL.

## Pendiente de decidir

- **Proveedor de IA** (en `feature/ia`). Candidato propuesto por Jose: **Kev**, modelos de decisión open source y entrenables. Hay que resolver dónde se ejecuta, porque necesita una GPU o un Mac.
- **Alojamiento del backend** (antes de publicar). La idea es que el navegador solo vea un dominio: Next.js reenvía las llamadas `/api/*` al backend, y así las cookies de sesión funcionan sin configuración entre dominios.
