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
| `feature/ia` | Vectores de IA y sugerencias de grupo | `RF-04.2` |
| `feature/prioridad` | Prioridad subjetiva de cada Nodex | HU-11 |
| `feature/tareas` | Personalidad tarea: estado, fecha límite, calendario y tablero | `RF-12.4`–`RF-12.6` |
| `feature/recordatorios` | Personalidad recordatorio y notificaciones push | `RF-12.7` |
| `feature/enlaces` | Vista previa de enlaces y comprobación de enlaces rotos | `RF-12.3` |
| `feature/ia-busqueda` | Búsqueda por significado, relacionados y duplicados | `RF-05.7`–`RF-05.9` |
| `feature/ia-grupos-nuevos` | Proponer grupos nuevos a partir de huérfanos parecidos (hecho: [especificación](disenos/2026-10-28-ia-grupos-nuevos-design.md)) | `RF-04.3` |

Todas las ramas de la tabla están hechas. Después llegaron `feature/papelera` (HU-15), `feature/redescubre` (HU-20), `feature/leer-mas-tarde` (HU-21) y `feature/compartir` (`RF-05.6`). El estado general está en el [plan de implementación](02-plan-de-implementacion.md#estado-de-los-requisitos).

## Personalidades (HU-12): diseño

Cada personalidad es **una tabla propia** enlazada a `nodexs` (una fila por Nodex como máximo), siguiendo la regla de "una tabla por funcionalidad". Un Nodex tiene una personalidad si tiene fila en esa tabla, así que se pueden combinar libremente: añadir o quitar una es crear o borrar su fila, sin tocar las demás.

| Personalidad | Dónde vive | Campos principales |
|--------------|------------|--------------------|
| Apunte | Es el Nodex sin más: `title` y `content` | — |
| Enlace | `nodexs.url` y una tabla `link_previews` | Título, descripción e imagen de la página; fecha de la última comprobación y si el enlace sigue vivo |
| Tarea | Tabla `tasks` | `status` (`todo`, `doing`, `done`), `due_at` opcional, `position` para el orden dentro de cada columna del tablero, `completed_at` |
| Recordatorio | Tabla `reminders` | `remind_at`, `sent_at` (para no avisar dos veces) |

Las notificaciones de los recordatorios serán **push de la PWA** (Web Push): gratis y sin servicios de terceros de pago. El backend necesitará una tabla con las suscripciones de cada dispositivo y un proceso que, cada minuto, busque los recordatorios vencidos y los envíe. Llegarán de verdad cuando el frontend registre la PWA.

La **prioridad** no es una personalidad: cualquier Nodex puede tenerla, sea apunte, enlace o tarea.

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

Ambos son gratuitos. Con las URLs de abajo funciona en local, a través del frontend (`localhost:3000`, que reenvía `/api` al backend); para producción se añadirán las del dominio final.

**Google**
1. Entra en [console.cloud.google.com](https://console.cloud.google.com) y crea un proyecto llamado `Nodex`.
2. Abre **Google Auth Platform** y configura la pantalla de consentimiento: nombre `Nodex`, tu email de soporte y tipo de usuario **Externo**.
3. Mientras la app esté en modo **prueba**, solo pueden entrar los usuarios que añadas en **Audiencia → Usuarios de prueba**. Añade tu cuenta.
4. En **Clientes**, crea un cliente de tipo **Aplicación web** con este URI de redirección autorizado:
   `http://localhost:3000/api/auth/google/callback`
5. Copia el ID y el secreto del cliente en `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.

**GitHub**
1. Ve a **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Rellena: nombre `Nodex`, Homepage URL `http://localhost:3000`, Authorization callback URL:
   `http://localhost:3000/api/auth/github/callback`
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

Para probar: arranca el backend y el frontend (`npm run dev` en cada carpeta), abre `http://localhost:3000/login` y pulsa "Continuar con Google" o "Continuar con GitHub". Tras aceptar, acabarás en el panel con la sesión iniciada.

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

## Tareas (`feature/tareas`)

Un Nodex se convierte en tarea con `PUT /api/tasks/:nodexId` y deja de serlo con `DELETE`. El Nodex no cambia: solo se añade o se borra su fila en `tasks`. Así la matrícula puede ser a la vez enlace, tarea y (más adelante) recordatorio.

### Cómo se ordena el tablero

Cada tarea tiene un número `position`, y cada columna se muestra ordenada por él. Al mover una tarea, en lugar de renumerar toda la columna, se le da **un número entre el de sus dos vecinas**:

```
Columna "En curso":  A (1)   B (2)   C (3)
Mover X entre A y B  →  X recibe (1 + 2) / 2 = 1,5
Resultado:           A (1)   X (1,5)   B (2)   C (3)
```

Solo se actualiza la tarea que se mueve, así que cada movimiento es una sola escritura en la base. A esta técnica se le llama **orden fraccionario**. Tras miles de movimientos en el mismo hueco los números se quedarían sin decimales; si llegara a pasar, bastaría con renumerar esa columna.

### Otros detalles

- **Fechas con zona horaria:** `dueAt`, `from` y `to` se envían en formato ISO con zona horaria (`2026-10-23T17:00:00+02:00`). El calendario no calcula "este mes": es el frontend quien envía el rango en la hora del usuario.
- **`completed_at`:** se rellena al pasar a `done` y se vacía si la tarea vuelve atrás. Servirá para estadísticas como "tareas completadas esta semana".
- **Prioridad en el tablero y el calendario:** cada tarjeta incluye la prioridad del Nodex, para poder resaltarla.
- **Aislamiento:** `tasks` tiene la misma clave foránea compuesta que `group_nodexs`; además, cada consulta filtra por usuario. Un Nodex borrado desaparece del tablero y del calendario.

## Recordatorios y notificaciones push (`feature/recordatorios`)

### Qué es Web Push

Es el estándar que permite a una web enviar notificaciones al móvil o al ordenador aunque esté cerrada, igual que una app nativa. Intervienen tres actores:

```
1. El navegador del usuario acepta las notificaciones
   → le da a Nodex una "suscripción": una dirección del servicio push de su navegador
     (Google para Chrome, Mozilla para Firefox, Apple para Safari) y unas claves
   → el frontend la envía a POST /api/push/subscriptions

2. Llega la hora de un recordatorio
   → el backend cifra el mensaje con las claves del navegador, lo firma con su clave VAPID
     y lo envía a esa dirección

3. El servicio push lo entrega al dispositivo, que muestra la notificación
```

- **Claves VAPID:** son la "firma" de Nodex. El servicio push comprueba que el aviso lo envía de verdad nuestro servidor. Se generan una vez con `npm run push:keys`; la privada va al `.env` y nunca se comparte (`RNF-9.1`).
- **Cifrado de extremo a extremo:** Google, Mozilla o Apple transportan el aviso, pero no pueden leer su contenido. Solo el dispositivo del usuario puede descifrarlo.
- **Coste:** gratis. No hace falta ningún servicio de pago.

### El proceso de envío

`reminders.worker.ts` se arranca junto al servidor y, **cada minuto**, busca los recordatorios que ya han llegado y no se han enviado, los marca como enviados y manda la notificación a todos los dispositivos del usuario.

- **Sin duplicados:** se marcan como enviados con `FOR UPDATE SKIP LOCKED`, de modo que si algún día hay dos servidores, cada recordatorio lo coge solo uno.
- **Dispositivos que ya no existen:** si el servicio push responde `404` o `410` (por ejemplo, el usuario desinstaló la PWA), se borra esa suscripción.
- **Solo las últimas 24 horas:** si el servidor estuvo parado, al volver no envía una avalancha de avisos antiguos.
- **Aviso dentro de la app:** `GET /api/reminders?status=due` lista los que ya han llegado y no se han descartado. Sirve de respaldo cuando no hay push (por ejemplo, en un iPhone sin la PWA instalada).
- **Sin claves VAPID**, el servidor arranca igual: no envía push, y los recordatorios se ven dentro de la app.

### Limitaciones a tener en cuenta

- **El servidor tiene que estar despierto.** Algunos alojamientos gratuitos "duermen" el servidor si nadie lo usa durante un rato; mientras duerme, el proceso no se ejecuta y los avisos llegarían tarde. Lo tendremos en cuenta al elegir el alojamiento. Una solución gratuita habitual es un servicio externo que llame al servidor cada pocos minutos.
- **Un error del servicio push no se reintenta:** el recordatorio se marca como enviado antes de mandarlo. Así nunca llega dos veces, a cambio de que, si el servicio push falla justo en ese momento, ese aviso se pierda. Aun así seguiría apareciendo dentro de la app.
- **El frontend** pide permiso, registra la suscripción y muestra el aviso desde el *service worker* (ver [frontend](09-frontend.md#notificaciones-push-rf-127)).

## Enlaces: vista previa y enlaces rotos (`feature/enlaces`)

Al crear un Nodex con URL, o al cambiarla, el backend visita la página en segundo plano y guarda su **título, descripción, imagen y nombre del sitio**. Son las etiquetas `og:*` (Open Graph) que las webs ponen para que WhatsApp, X o Telegram muestren la "tarjeta" de un enlace. Cada 10 minutos, un proceso vuelve a revisar los enlaces que llevan más de 7 días sin comprobarse, en lotes de 20.

| Estado | Cuándo | Qué se puede mostrar |
|--------|--------|----------------------|
| `ok` | La página responde 2xx | La tarjeta con título, descripción e imagen |
| `broken` | Responde 404 o 410 | "Enlace roto" + la copia en archive.org si existe |
| `unreachable` | Error de red, de DNS, 5xx, 403… | "No se puede acceder ahora" + la copia en archive.org |
| `blocked` | Apunta a una dirección interna | Nada: se rechaza por seguridad |

**Por qué un error de DNS no es "roto":** al probar, el DNS del router de casa rechazó `example.com`, que funciona perfectamente. Un fallo de red o de DNS puede ser del servidor de Nodex o temporal, así que solo se considera roto lo que la propia web confirma con un 404 o un 410.

**archive.org:** su API pública (`/wayback/available`) dice si existe una copia guardada de una URL. Es gratuita, pero lenta (más de 8 segundos a veces) y limita las peticiones (responde `429` si se le pregunta mucho). Por eso tiene 15 segundos de margen, y una vez encontrada la copia no se vuelve a consultar.

### Seguridad: SSRF

**SSRF** (*Server-Side Request Forgery*) es un ataque en el que alguien hace que el servidor visite por él una dirección que el atacante no puede alcanzar: `http://localhost`, la red interna del alojamiento o `169.254.169.254`, donde muchos proveedores de nube exponen credenciales. Como Nodex visita URLs que escriben los usuarios, hay que impedirlo. `lib/safe-fetch.ts` lo hace así:

- **La IP se comprueba al conectar, no al leer la URL.** Se valida la dirección que devuelve el DNS justo antes de abrir la conexión. Así se bloquean también los dominios que apuntan a una IP interna (`localtest.me` → 127.0.0.1) y los trucos como escribir 127.0.0.1 en decimal (`http://2130706433`).
- **Cada redirección se vuelve a comprobar**, como máximo 3. Una web pública no puede redirigir a `127.0.0.1`.
- **Solo `http` y `https`**: nada de `file://` ni otros protocolos.
- **Límites:** 8 segundos por petición, 1 MB por página y solo se procesa HTML.

Probado contra: `localhost`, `127.0.0.1`, la IP en decimal, `[::1]`, `169.254.169.254`, `192.168.1.1`, `localtest.me`, una redirección pública hacia 127.0.0.1 y `file://`. Todo bloqueado.

## Inteligencia artificial (`feature/ia`)

### Qué es un embedding

Un **embedding** es una lista de números (aquí, 384) que representa el **significado** de un texto. Dos textos que hablan de lo mismo tienen vectores parecidos, aunque no compartan palabras: "receta de lentejas" y "guiso de garbanzos" quedan cerca; "tutorial de React", lejos. El parecido se mide con la **similitud coseno**: 1 es idéntico y 0 es que no tienen nada que ver.

### Piezas

| Pieza | Qué es |
|-------|--------|
| `@huggingface/transformers` | Ejecuta el modelo dentro de Node, en la CPU, sin Python ni GPU |
| Modelo `paraphrase-multilingual-MiniLM-L12-v2` (cuantizado) | Convierte texto en un vector de 384 números. Entiende español. 118 MB, licencia Apache-2.0. Se descarga solo la primera vez en `backend/.cache/models` (ignorada por Git) |
| pgvector | Extensión de PostgreSQL para guardar vectores (`nodexs.embedding`) y compararlos con el operador `<=>` |
| `lib/embeddings.ts` | Carga el modelo una sola vez y expone `embed(texto)` |
| `modules/ai/ai.service.ts` | Calcula vectores y genera sugerencias |

**Por qué este modelo y no `multilingual-e5-small`**, el que se propuso primero: en una prueba con textos en español, e5 daba a todo una similitud de alrededor de 0,85–0,90, hasta el punto de que "lentejas" se parecía más a "Introducción a TypeScript" que a "guiso de garbanzos". Este modelo separa bien los temas (0,56 frente a 0,10–0,23). Tienen el mismo tamaño y las mismas dimensiones.

### Cómo funciona una sugerencia (`RF-04.2`)

```
Crear o editar un Nodex
  → la respuesta sale al momento
  → en segundo plano: título + contenido + palabras de la URL → vector → nodexs.embedding
  → si es huérfano:
      perfil de cada grupo = media de los vectores de sus Nodexs
      se compara el Nodex con cada perfil
      si el mejor grupo supera los umbrales → sugerencia "¿Mover a Cocina?"
```

- **Umbrales** (`MIN_SIMILARITY = 0.35`, `MIN_MARGIN = 0.1`): el mejor grupo debe parecerse al menos 0,35, y 0,10 más que el segundo. Se calibraron con 3 grupos de 4 Nodexs y 10 huérfanos: los temas sin grupo (vuelos, la renta, jazz) no pasaban de 0,26, y los que sí encajaban estaban entre 0,39 y 0,66. Resultado: 6 sugerencias, todas correctas, ninguna equivocada. Se escapó una ("Buenas prácticas con PostgreSQL", 0,23): es preferible no sugerir a sugerir mal.
- **Aprendizaje personal:** el perfil de cada grupo sale de los Nodexs **de ese usuario**. Cada vez que acepta una sugerencia o coloca un Nodex a mano, el perfil cambia y las siguientes sugerencias se ajustan a su forma de organizar. Los rechazos se recuerdan: no se vuelve a proponer el mismo grupo para el mismo Nodex.
- **El usuario decide:** la IA nunca mueve nada sola. Aceptar mete el Nodex en el grupo con `added_by = 'ai'`.
- **Tolerancia a fallos (`RNF-08`):** el cálculo va en segundo plano. Si falla, se registra el error y el Nodex queda sin vector; `POST /api/suggestions/refresh` o `npm run ai:backfill` lo recalculan después.

### Coste y rendimiento

- **Dinero:** cero. El modelo corre en el propio servidor.
- **Velocidad:** la primera vez que se usa, el modelo tarda unos segundos en cargarse. Después, unos **8 ms por Nodex**.
- **Memoria:** con el modelo cargado, el proceso usa unos **570 MB de RAM**. Hay que tenerlo en cuenta al elegir el alojamiento: algunos planes gratuitos solo dan 512 MB.

## Búsqueda, relacionados y duplicados (`feature/ia-busqueda`)

Las tres funciones reutilizan el vector que ya se guarda en `nodexs.embedding`. No hay tablas nuevas: todo son consultas SQL con el operador `<=>` de pgvector, siempre filtradas por el usuario de la sesión.

### Búsqueda híbrida (`RF-05.7`)

`GET /api/nodexs/search?q=…` convierte la búsqueda en un vector y lo compara con todos los Nodexs del usuario. Pero los embeddings fallan con palabras sueltas, siglas o nombres propios ("react", "Alfama"), así que la búsqueda es **híbrida**: a la similitud se le suma un extra si el texto aparece tal cual.

```
puntuación = similitud de significado (0–1)
           + 1    si el texto está en el título
           + 0,5  si está en el contenido o en la URL
se muestran los que llegan a 0,3, de mayor a menor
```

Así, lo que contiene la palabra exacta sale siempre arriba, y debajo aparece lo que habla de lo mismo con otras palabras ("comida casera de legumbres" encuentra las lentejas y los garbanzos). El texto se busca con `ILIKE`, que no distingue mayúsculas; los caracteres `%` y `_` se escapan para que se busquen literalmente.

Si el modelo falla, la búsqueda no se rompe (`RNF-08`): se registra el error y se busca solo por texto.

### Relacionados (`RF-05.8`)

`GET /api/nodexs/:id/related` devuelve los Nodexs con similitud **≥ 0,45** respecto al que se está viendo, del más al menos parecido. Si el Nodex aún no tiene vector, la lista sale vacía.

### Duplicados (`RF-05.9`)

`POST /api/nodexs` acepta `source`: `manual` (por defecto) o `share`, cuando el Nodex llega desde el menú Compartir de la PWA (`RF-05.6`).

Al crear un Nodex, `POST /api/nodexs` calcula su vector **en el momento** (no en segundo plano, como antes) y responde con `duplicates`: los Nodexs que ya tenía el usuario con la **misma URL** (sin contar la `/` final) o una similitud **≥ 0,9**. El Nodex se guarda igualmente: el frontend muestra el aviso y el usuario decide si lo borra.

Para no hacer esperar al usuario, la comprobación tiene un límite de **3 segundos** (`Promise.race`). Si el modelo tarda más (por ejemplo, la primera vez, mientras se carga) o falla, la respuesta sale sin duplicados y el resto del trabajo (vector y sugerencia de grupo) sigue en segundo plano.

### Calibración de los umbrales

Se probó con 12 Nodexs de temas variados (cocina, programación, viajes, impuestos, música, deporte) y 6 casi duplicados:

| Umbral | Datos que lo justifican |
|--------|-------------------------|
| Búsqueda ≥ 0,3 | Los aciertos estaban entre 0,30 y 0,65. Por debajo de 0,3 casi todo era ruido. Se cuela algún resultado dudoso al final de la lista (0,31), pero en una búsqueda es peor perder un acierto que mostrar uno de más |
| Relacionados ≥ 0,45 | Los pares del mismo tema (dos recetas, dos viajes) daban 0,45–0,61. El ruido llegaba a 0,43 ("Discos de jazz" ↔ "Guiso de garbanzos") |
| Duplicados ≥ 0,9 | La misma nota reescrita daba 0,95. Pero dos apuntes distintos de TypeScript daban 0,835, así que bajar a 0,85 avisaría de duplicados falsos. Los enlaces repetidos se detectan por la URL |

**Limitación conocida:** este modelo distingue bien temas cotidianos, pero agrupa peor los técnicos. "programación web frontend" no encuentra el tutorial de React por significado (0,26), aunque "react" o "aprender a programar" sí. Es otra razón para que la búsqueda sea híbrida.

### Por qué no hay índice HNSW

Un índice HNSW acelera la búsqueda de vectores parecidos, pero es **aproximado** y se aplica antes del filtro por usuario: con muchos usuarios podría devolver menos resultados de los esperados. Cada consulta solo mira los Nodexs de un usuario (cientos o pocos miles), y compararlos todos uno a uno es rápido y exacto. Se añadirá si el volumen lo pide (ver [la base de datos](08-base-de-datos.md)).

## Modo demo (`feature/modo-demo`)

Diseño: [especificación](disenos/2026-10-30-modo-demo-design.md). Permite probar Nodex sin registrarse (HU-14). Todo vive en `modules/demo/`.

### Cómo se crea una demo (`POST /api/auth/demo`)

1. **Usuario temporal.** Se llama "Invitado", no tiene contraseña y su email es interno: `demo-<uuid>@demo.nodex.invalid`. `.invalid` es un dominio reservado que nunca existe, así que no choca con nadie. `demo_expires_at` queda a 24 horas.
2. **Datos de ejemplo** (`demo.data.ts`). Son 26 Nodexs sobre aprender a programar, pensados para que se vea cada función:
   - grupos;
   - huérfanos para las sugerencias de la IA, y cuatro de CSS para que proponga un grupo nuevo;
   - tareas, un recordatorio, etiquetas y "leer más tarde";
   - Nodexs abiertos hace más de 30 días, para *Redescubre*.

   Las fechas se guardan como "hace N días" y se calculan al crear la cuenta, así la demo siempre parece reciente.
3. **Pocas consultas.** Los ids se generan en Node (`randomUUID`) y cada tabla se rellena con un solo `createMany`, todo dentro de una transacción. Crear los Nodexs uno a uno con sus relaciones anidadas hacía decenas de viajes a Neon y pasaba del límite de 5 s de las transacciones de Prisma.
4. **IA.** Se calcula el vector de cada Nodex y su sugerencia de grupo, primero los que tienen grupo y luego los huérfanos, porque la sugerencia compara con el "centro" de cada grupo. Después se calculan las propuestas de grupos nuevos. Cada paso va en su `try/catch`: si la IA falla, la demo se crea igual (`RNF-08`). Las vistas previas de los enlaces se cargan en segundo plano.
5. **Sesión.** Se abre como en un login normal. Con el modelo de IA ya cargado, la respuesta tarda unos 5 segundos. La primera demo tras arrancar el servidor tarda más, porque antes hay que cargar el modelo.

Un límite de **5 demos por hora y por IP** evita que alguien llene la base creando cuentas.

### Pasar a cuenta real (`POST /api/auth/demo/convert`)

La misma cuenta recibe nombre, email y contraseña (validados como en el registro) y `demo_expires_at` vuelve a `null`. Los datos no se mueven: ya son suyos. La sesión se regenera, como al entrar.

### Qué no se puede hacer en la demo

`middleware/require-real-user.ts` responde `403` en la subida de foto (usa la cuenta de Cloudinary) y en la vinculación de Google o GitHub (una cuenta que se borra no debe quedarse con cuentas externas).

### Limpieza (`demo.worker.ts`)

Cada hora borra las demos caducadas. Al borrar el usuario, la base borra en cascada sus grupos, Nodexs, tareas y demás. Las **sesiones** se borran en la misma sentencia SQL, solo las de los usuarios que de verdad se han borrado: así una demo que se convierte justo en ese momento no pierde nada. La tabla `sessions` no está enlazada con `users`: el id del usuario va dentro del JSON de la sesión. Si no se borraran, la cookie seguiría pasando `requireAuth` y daría errores en vez de un `401`.

## Decisiones tomadas

- **Almacenamiento de imágenes:** **Cloudinary**, plan gratuito sin tarjeta (25 créditos al mes compartidos entre almacenamiento, tráfico y transformaciones). Las fotos se reducen a 256×256 en WebP (unos 15 KB). Todo el acceso irá en un único archivo, `lib/storage.ts`, para poder pasar a Cloudflare R2 si el tráfico crece. Las fotos de Google y GitHub no se guardan: solo su URL.
- **IA:** embeddings propios con `@huggingface/transformers` y pgvector, gratis y en la CPU. Kev se descartó porque necesita una GPU NVIDIA o un Mac, y alojar una GPU no es gratis.

## Pendiente de decidir

- **Alojamiento del backend** (antes de publicar). La idea es que el navegador solo vea un dominio: Next.js reenvía las llamadas `/api/*` al backend, y así las cookies de sesión funcionan sin configuración entre dominios.
