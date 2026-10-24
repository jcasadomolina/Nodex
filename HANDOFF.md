# HANDOFF: Nodex

Resumen para retomar el trabajo en una sesión nueva. Fecha: 2026-10-24.

> **Lo primero al retomar:** la copia local está ahora en `main`. El trabajo vivo está en `develop`:
>
> ```bash
> git checkout develop
> git pull
> ```

---

## 1. Objetivo

**Nodex** es una aplicación web de notas y enlaces con IA. Su unidad es el **Nodex**, una nota o un enlace, y los Nodexs se organizan en **grupos**. Es el primer proyecto de Jose como desarrollador junior: el objetivo es el **portfolio y aprender**, no el negocio.

- **Hoja de ruta:** web alojada gratis → PWA para móviles (con "Compartir" desde el móvil, `RF-05.6`) → app nativa (`.apk` / `.exe`). WhatsApp (HU-03) queda como ampliación futura.
- **Orden por bloques:** base de datos ✅ → **backend (casi terminado)** → frontend → pruebas.
- **Roles:** Claude escribe la mayor parte del código como fullstack senior y explica todo a nivel junior; Jose supervisa, aprende y aprueba.

La documentación completa está en [`docs/`](docs/README.md). Para el backend, lo más útil es [`docs/06-sistema-backend.md`](docs/06-sistema-backend.md) (cómo funciona cada parte y por qué), [`docs/08-base-de-datos.md`](docs/08-base-de-datos.md) y [`backend/README.md`](backend/README.md) (endpoints y scripts).

---

## 2. Reglas de trabajo acordadas (obligatorias)

| Regla | Detalle |
|-------|---------|
| **Git lo hace Jose** | Claude **no** hace commits, pushes ni PR. Deja los cambios sin commitear y propone mensaje de commit, título y descripción del PR. Crear o cambiar ramas locales sí está permitido. |
| **GitFlow** | `main` (versiones) ← `develop` (integración) ← `feature/*`. Cada rama sale de `develop` y vuelve con un PR. Commits con Conventional Commits en español: `feat(ámbito): …`. |
| **Código sin comentarios** | Código mínimo y directo, **sin ningún comentario**. Las explicaciones van en el chat o en `docs/`. (Skill de Jose: "simplificar-el-código-implementado".) |
| **Consultar antes de decidir** | Stack, librerías, diseño, requisitos nuevos… se proponen y se espera aprobación. |
| **Nada de pago** | Si algo cuesta dinero, se informa y no se implementa. |
| **Secretos** | Solo en `.env`, que está en la raíz y no se sube. **Nunca** pedir ni mostrar valores en el chat; para comprobarlos, mirar solo los nombres o la longitud. |
| **Idioma** | Español en código visible, documentación y respuestas. |
| **Documentar y enseñar** | Cada rama deja explicado en `docs/` qué se hizo y por qué. |
| **Requisitos** | Continuar la numeración. La última es **HU-12**; la siguiente sería **HU-13**. |

Estas dos reglas de Git y de comentarios también están en la memoria de Claude (`git-lo-hace-jose`, `codigo-sin-comentarios`).

---

## 3. Estado actual

### Ramas y PR

Todo el backend hecho está **fusionado en `develop`** (PR #1 a #13) y no hay cambios sin commitear.

| PR | Rama | Contenido |
|----|------|-----------|
| #1 | `docs/documentacion-inicial` | `docs/` con la planificación |
| #2 | `feature/base-de-datos` | Prisma + esquema inicial en Neon |
| #3 | `feature/backend-base` | Express 5 + TypeScript, errores, `/health` |
| #4 | `feature/auth` | Registro, login, logout, sesiones |
| #5 | `feature/oauth` | Login con Google y GitHub |
| #6 | `feature/grupos-nodexs` | CRUD de grupos y Nodexs, `/board` |
| #7 | `feature/tutorial` | Versión del tutorial vista (HU-10) |
| #8 | `feature/perfil` | Perfil, foto (Cloudinary), vincular cuentas, Zod en español |
| #9 | `feature/ia` | Embeddings + pgvector, sugerencias de grupo |
| #10 | `feature/prioridad` | Prioridad (HU-11) + diseño de personalidades (HU-12) |
| #11 | `feature/tareas` | Tareas: tablero y calendario |
| #12 | `feature/recordatorios` | Recordatorios + Web Push |
| #13 | `feature/enlaces` | Vista previa, enlaces rotos, anti-SSRF |

> ⚠️ **Anomalía en `main`:** el PR #10 (`feature/prioridad`) se fusionó en **`main`** en vez de en `develop`. Su contenido también llegó a `develop` a través de `feature/tareas`, así que `develop` está completo. Pero `main` tiene un merge que no debería tener y va por detrás de `develop`. Lo correcto en GitFlow es sincronizar `main` con una rama `release/x.y.z` desde `develop` cuando toque publicar. Conviene revisarlo con Jose.

### Base de datos (Neon)

Las 7 migraciones están **aplicadas en Neon** (`npx prisma migrate status` → al día):

```
20261021174737_init                    tablas base
20261022184515_add_tutorial_version    users.tutorial_completed_version
20261022224712_add_nodex_embeddings    pgvector + nodexs.embedding vector(384)
20261022232142_add_nodex_priority      nodexs.priority (smallint 1–4)
20261023110256_add_tasks               tasks
20261023113650_add_reminders_and_push  reminders, push_subscriptions
20261024102417_add_link_previews       link_previews
```

En la base solo queda **un usuario real** (`e3c6b4fd…`, de Jose), con las cuentas `google` y `github` vinculadas. Se fusionaron con `RF-02.6`. No hay grupos ni Nodexs.

### Cuentas externas creadas por Jose (todas gratuitas)

| Servicio | Para qué | Variables en `.env` |
|----------|----------|---------------------|
| Neon | PostgreSQL | `DATABASE_URL` (con pooling), `DIRECT_URL` (migraciones), ambas con `sslmode=verify-full` |
| Google Cloud (Google Auth Platform) | Login con Google (app en modo prueba; Jose es usuario de prueba) | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| GitHub OAuth App | Login con GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| Cloudinary | Fotos de perfil | `CLOUDINARY_URL` |
| — | Notificaciones push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (**sin confirmar** que Jose las haya generado: `npm run push:keys`) |

Otras variables: `SESSION_SECRET` (✅), `PORT` (4000 por defecto), `APP_URL` (`http://localhost:4000` por defecto). La plantilla completa está en [`.env.example`](.env.example).

---

## 4. Decisiones tomadas

### Stack

| Pieza | Elección | Motivo principal |
|-------|----------|------------------|
| Estructura | **Monorepo**: `backend/` y `frontend/` (vacío) | Un repositorio para el portfolio |
| Base de datos | **PostgreSQL en Neon** (gratis) | Relacional + pgvector; no se pausa como Supabase |
| ORM | **Prisma 7.10.1** (fijado; `latest` en npm era una versión rc) | Esquema legible y migraciones |
| Backend | **Express 5 + TypeScript 7**, `tsx` en desarrollo | Express acordado; TS para aprender y para el portfolio |
| Conexión | `@prisma/adapter-pg` | Servidor siempre encendido |
| Sesiones | `express-session` + `connect-pg-simple` (tabla `sessions`), cookie `nodex.sid` | `RNF-9.2` |
| Contraseñas | `argon2` | Recomendado por OWASP |
| OAuth | Passport (`passport-google-oauth20`, `passport-github2`) | Estándar en Express |
| Validación | Zod 4, mensajes en español | Valida y genera tipos |
| Fotos | **Cloudinary** (256×256 WebP), todo en `lib/storage.ts` | Gratis sin tarjeta; se puede migrar a Cloudflare R2 |
| IA | `@huggingface/transformers` + **`paraphrase-multilingual-MiniLM-L12-v2`** + pgvector | Gratis, en CPU. Kev se descartó (necesita GPU) |
| Push | `web-push` (VAPID) | Gratis |
| Dominio | **Único**: Next.js reenviará `/api/*` al backend | Las cookies funcionan sin CORS |

### Diseño de producto

- Un Nodex puede estar en **varios grupos** (tabla `group_nodexs`). Un **huérfano** es un Nodex sin grupos activos.
- **La IA sugiere y el usuario confirma**; nunca mueve nada sola.
- Borrado lógico (`deleted_at`) en Nodexs y grupos. Los recursos de otro usuario responden `404`.
- **Prioridad (HU-11):** subjetiva, `low` / `medium` / `high` / `urgent`, o sin prioridad. Se guarda como número para poder ordenar.
- **Personalidades (HU-12):** combinables, cada una con su propia tabla. **Apunte** (por defecto), **enlace** (`link_previews`), **tarea** (`tasks`: tablero de 3 columnas fijas y calendario) y **recordatorio** (`reminders` + push).
- **Tutorial (HU-10):** el contenido va en el frontend; el backend guarda `tutorialCompletedVersion`.
- **Vincular cuentas (`RF-02.6`, `RF-02.7`):** desde una sesión iniciada. Si la cuenta pertenece a un usuario vacío, se fusiona.
- **IA:** sugerencia si similitud ≥ 0,35 y al menos 0,10 por encima del segundo grupo. Calibrado: 6/6 aciertos y 0 falsos positivos.
- **Enlaces:** solo `404`/`410` es "roto"; un error de red o de DNS es "no accesible" (el DNS del router de Jose rechaza `example.com`). Copia en archive.org con 15 s de margen.

### Descartado o aplazado

- **WhatsApp:** ampliación futura, por la incertidumbre de costes de la API de Meta. Alternativa futura: un bot de Telegram (gratis).
- **Columnas del tablero personalizables:** quizá más adelante (ahora son 3 fijas).
- **`RF-05.4` y `RF-05.5`** (información de Internet y apartados con IA): necesitan un LLM. Sin decidir y sin nada de pago sin consultar.

---

## 5. Archivos principales

```
Nodex/
├── .env                     (NO en Git) secretos
├── .env.example             plantilla de variables
├── .gitignore / .gitattributes   (.sql de migraciones con LF: Prisma usa checksum)
├── CLAUDE.md                instrucciones (⚠️ desactualizado: ver próximos pasos)
├── docs/
│   ├── 01…07                objetivos, plan, requisitos, flujo y brief (05 y 07 vacíos)
│   ├── 03-requisitos-producto.md   HU-01…HU-12 (con ampliaciones futuras marcadas)
│   ├── 06-sistema-backend.md       guía completa del backend
│   └── 08-base-de-datos.md         tablas, índices, reglas de evolución
├── frontend/README.md       (vacío; bloque siguiente)
└── backend/
    ├── README.md            endpoints, scripts y puesta en marcha
    ├── package.json         scripts: dev, build, start, typecheck, db:*, ai:backfill, push:keys
    ├── prisma.config.ts     lee ../.env, usa DIRECT_URL para migrar
    ├── prisma/schema.prisma + migrations/
    └── src/
        ├── server.ts        arranca Express + workers (recordatorios, enlaces)
        ├── app.ts           middlewares y rutas bajo /api
        ├── config/env.ts    validación del entorno con Zod
        ├── lib/             prisma, session, storage (Cloudinary), push, embeddings,
        │                    safe-fetch (anti-SSRF), html-meta, params, db-errors, http-error
        ├── middleware/      error-handler, require-auth
        ├── types/           express-session.d.ts, passport.d.ts
        ├── scripts/         ai-backfill.ts
        └── modules/         auth, me, groups, nodexs, board, ai, tasks,
                             reminders, push, links, health
```

Endpoints: todos bajo `/api` (`auth`, `me`, `groups`, `nodexs`, `board`, `suggestions`, `tasks`, `reminders`, `push`, `links`, `health`). La tabla completa está en [`backend/README.md`](backend/README.md).

---

## 6. Cómo trabajar (lecciones aprendidas)

**Arrancar:** en `backend/`, ejecuta `npm install` y después `npm run dev`. El servidor escucha en `http://localhost:4000/api/health`. Abre **siempre una terminal nueva** si cambias el `.env`: alguna extensión de VS Code inyecta el `.env` antiguo en la terminal y `--env-file` de Node no sobrescribe variables existentes.

**Migraciones:** se generan sin conexión. Se copia el esquema anterior y se ejecuta `npx prisma migrate diff --from-schema <anterior> --to-schema prisma/schema.prisma --script` en una carpeta `prisma/migrations/<fecha>_<nombre>/`. Después, `npm run db:deploy` y `npm run db:generate`. Si el comando falla, borra la carpeta vacía que deja.

**Pruebas que se han usado en cada rama:**
1. Arrancar un servidor en un puerto libre (4120–4140): `PORT=41xx npx tsx --env-file-if-exists=../.env src/server.ts &`.
2. Ejecutar un script de pruebas en el directorio temporal de la sesión, con `fetch` y la cookie.
3. Crear siempre los usuarios de prueba con emails `@nodex.test` y **borrarlos al terminar**, junto con sus sesiones.
4. **Parar el servidor de prueba** (`Get-NetTCPConnection -LocalPort …` + `Stop-Process`). Un servidor olvidado en el puerto 4000 ya causó un problema.

**Trampas conocidas:**
- npm 12 bloquea los scripts de instalación. Están aprobados `prisma` y `@prisma/engines`, y denegados (no hacen falta) `esbuild`, `argon2`, `onnxruntime-node` y `protobufjs`. Ver `allowScripts` en `package.json`.
- Muchos archivos tienen saltos de línea CRLF. Para reemplazar texto de varias líneas con scripts, normaliza antes o usa el editor.
- El modelo de IA (118 MB) se descarga en `backend/.cache/models` (ignorado por Git) y el proceso usa unos **570 MB de RAM**.
- `web-push` siempre envía por HTTPS. Para probar sin navegador se usó un servicio push simulado con certificado propio.

---

## 7. Próximos pasos

### Backend (pendiente)

1. **`feature/ia-busqueda`**: búsqueda por significado (`RF-05.7`), Nodexs relacionados (`RF-05.8`) y duplicados (`RF-05.9`). Reutiliza `nodexs.embedding`; quizá añadir un índice HNSW.
2. **`feature/ia-grupos-nuevos`** (`RF-04.3`): agrupar huérfanos parecidos y proponer un grupo nuevo. Para el nombre, palabras clave sin LLM, salvo que se apruebe uno.
3. **Ideas con gancho aprobadas** (convertirlas antes en requisitos, **HU-13** y **HU-14**):
   - **Redescubre:** rescatar cada día 2 o 3 Nodexs olvidados (repetición espaciada). Ignorar los de prioridad alta y apoyarse en los "relacionados".
   - **Leer más tarde + salud de enlaces:** casi hecho. Es un enlace con prioridad baja más `link_previews`; añadir el tiempo estimado de lectura.
4. **Decidir un LLM** para `RF-05.4` y `RF-05.5`: investigar planes gratuitos y consultar.

### Decisiones pendientes con Jose

- **Alojamiento del backend:** necesita unos 570 MB de RAM y estar despierto, por los workers de recordatorios y enlaces. Si el plan gratuito duerme el servidor, usar un "despertador" externo gratuito.
- **Sincronizar `main`** tras el PR #10 mal dirigido (rama `release/…`).
- **`CLAUDE.md`** sigue escrito como si fuera el vault de Obsidian ("aquí no hay código", stack "pendiente de confirmar"). Proponer actualizarlo al estado real del repositorio.
- Confirmar que las **claves VAPID** están en el `.env`.

### Bloque de frontend (siguiente gran bloque)

- Pedir a Jose los **bocetos de Figma** (`RNF-07.1`) y rellenar `docs/05-flujo-de-la-aplicacion.md` y `docs/07-brief-de-diseno.md`, que están vacíos (proponer antes de escribir).
- Next.js con *rewrite* de `/api/*` al backend (dominio único). Al cambiar, actualizar `APP_URL` y las URLs de callback en Google y GitHub.
- Pantallas: login/registro/OAuth, panel central (`/api/board`), mapa visual por similitud (`RF-04.5`), sugerencias de IA, tablero y calendario de tareas, recordatorios dentro de la app, perfil, tutorial (versión 1).
- PWA: *service worker*, suscripción push (`/api/push/public-key` → `POST /api/push/subscriptions`) y *Web Share Target* (`RF-05.6`).
- Consultar color, tipografía y disposición antes de implementar (`RNF-07.3`), y usar las skills de diseño.

### Bloque de pruebas (último)

Tests unitarios, de integración y end-to-end. Los scripts de prueba manuales de cada rama (descritos en los mensajes de PR) son una buena base para los de integración.
