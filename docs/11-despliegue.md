# Despliegue

Nodex se publica gratis, sin tarjeta, con estos servicios:

```
Navegador ──► nodex-xxx.vercel.app (Vercel: frontend Next.js)
                 └─ /api/* ──► https://nodex-api.onrender.com (Render: backend Express) ──► Neon
cron-job.org ──► cada 10 min: /api/health (mantiene el backend despierto)
```

| Pieza | Dónde | Por qué |
|-------|-------|---------|
| Frontend | **Vercel**, plan Hobby | Gratis para proyectos personales y hecho por los creadores de Next.js. Despliega solo con cada push a `main` y crea una vista previa por cada PR |
| Backend | **Render**, plan Free | Gratis y sin tarjeta: un servidor de Node con 512 MB de RAM y HTTPS incluido |
| Base de datos | **Neon**, plan gratis | La que ya se usa |
| Despertador | **cron-job.org** | Gratis. Llama al backend cada 10 minutos para que no se duerma |

El navegador solo habla con Vercel, que reenvía `/api/*` al backend, igual que `localhost:3000` en desarrollo. Así la cookie de sesión es del mismo dominio y no hace falta configurar CORS.

## Por qué Render y no Oracle Cloud

La primera opción fue una máquina gratuita de Oracle Cloud, con RAM de sobra. Pero la cuenta gratuita solo permite una región, y en ella no había capacidad para máquinas ARM. Render no necesita tarjeta y se configura desde la web. A cambio tiene dos límites, y los dos se han resuelto:

- **512 MB de memoria.** Con la configuración original, el modelo de IA llevaba el proceso a unos 600 MB. Ahora `lib/embeddings.ts` usa onnxruntime con **1 hilo** y **sin su reserva de memoria** (`enableCpuMemArena: false`). Así el modelo añade unos 300 MB en lugar de 480, y el backend completo se queda en unos 440 MB. La calidad es la misma: el modelo y los vectores no cambian. Lo que se pierde es velocidad cuando se calculan muchos vectores a la vez, por ejemplo al crear una demo.
- **Se duerme a los 15 minutos sin visitas.** Mientras duerme no se ejecutan las tareas de fondo, así que los recordatorios llegarían tarde. cron-job.org llama a `/api/health` cada 10 minutos y lo mantiene despierto. Render da 750 horas gratis al mes, suficientes para un servidor encendido todo el mes.

## Conceptos

- **Variables de entorno en el panel:** en Render y en Vercel no hay archivo `.env`. Las variables se escriben en su web y nunca se suben al repositorio.
- **`trust proxy`:** Express recibe las peticiones a través de dos intermediarios: Vercel y el balanceador de Render. Con `app.set("trust proxy", 2)` se los salta y toma la IP real del visitante de la cabecera `X-Forwarded-For`. Sin esto, todos los visitantes parecerían el mismo y los límites (5 demos por hora, 10 intentos de login) serían para todo el mundo a la vez.
- **Disco efímero:** cada despliegue de Render empieza con el disco vacío. El modelo de IA (unos 120 MB) se descarga en la primera petición que lo usa, así que esa tarda más.

## Paso a paso

Las cuentas las creas tú. Los secretos se escriben solo en los paneles de Render y Vercel, nunca en el chat ni en el repositorio.

### 1. Backend en Render

1. Entra en [render.com](https://render.com) y pulsa **Get Started** → **GitHub**.
2. **New + → Web Service**, elige el repositorio `Nodex` (dale acceso si no sale) y rellena:

   | Campo | Valor |
   |-------|-------|
   | Name | `nodex-api` (la URL será `https://nodex-api.onrender.com`) |
   | Region | **Frankfurt** (la más cercana) |
   | Branch | `main` |
   | Root Directory | `backend` |
   | Runtime | Node |
   | Build Command | `npm ci --include=dev && npx prisma generate && npm run build && npm run db:deploy` |
   | Start Command | `npm start` |
   | Instance Type | **Free** |

   El `--include=dev` hace falta porque Render compila con `NODE_ENV=production`, y sin él `npm ci` no instalaría TypeScript.

3. **Environment Variables:**

   | Variable | Valor |
   |----------|-------|
   | `NODE_VERSION` | `24` |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL`, `DIRECT_URL` | Las de Neon |
   | `SESSION_SECRET` | Uno nuevo, de 32 caracteres o más (por ejemplo, la salida de `openssl rand -base64 48`) |
   | `APP_URL` | La URL de Vercel. Al principio pon cualquiera y la cambias en el paso 3 |
   | `GOOGLE_*`, `GITHUB_*`, `CLOUDINARY_URL`, `VAPID_*` | Opcionales, igual que en local |

   No pongas `PORT`: Render lo da él solo y el backend lo lee.

4. En **Advanced**:
   - *Health Check Path*: `/api/health`;
   - *Auto-Deploy*: **After CI Checks Pass**. Así solo despliega si la CI de GitHub está en verde.
5. Pulsa **Create Web Service** y espera al primer despliegue. Comprueba que `https://nodex-api.onrender.com/api/health` responde `{"status":"ok","database":"ok"}`.

### 2. Frontend en Vercel

1. Entra en [vercel.com/signup](https://vercel.com/signup), elige **Hobby** y regístrate con **Continue with GitHub**.
2. **Add New… → Project**, importa `Nodex` y pon *Root Directory* en `frontend`.
3. **Environment Variables:** `BACKEND_URL = https://nodex-api.onrender.com`.
4. Pulsa **Deploy**. En *Settings → Git*, comprueba que la rama de producción es `main`.

### 3. Unirlos

1. Copia la URL de Vercel (`https://nodex-xxx.vercel.app`) y ponla en `APP_URL` en Render (*Environment*). Render se redespliega solo.
2. Si usas login con Google o GitHub, añade en sus consolas (ver [Sistema de backend](06-sistema-backend.md#registrar-nodex-en-google-y-github)) las URLs de callback de producción:
   - `https://nodex-xxx.vercel.app/api/auth/google/callback`
   - `https://nodex-xxx.vercel.app/api/auth/github/callback`

### 4. Mantenerlo despierto

1. Crea una cuenta en [cron-job.org](https://cron-job.org).
2. **Create cronjob**:
   - *URL*: `https://nodex-api.onrender.com/api/health`;
   - *Execution schedule*: cada **10 minutos**.

## Publicar una versión

Haz merge de `develop` en `main` con **Create a merge commit**. GitHub ejecuta la CI. Si pasa, Render despliega el backend, y Vercel despliega el frontend por su cuenta.

## Comprobaciones tras publicar

- Abrir la URL de Vercel, registrarse, crear un Nodex y buscarlo.
- "Probar sin registrarse": la primera demo tras un despliegue tarda más, porque descarga y carga el modelo.
- **Memoria:** en Render, la pestaña *Metrics* muestra la memoria. Si roza los 512 MB o en *Events* aparecen reinicios por *out of memory*, hay que pasar al plan C: la API de embeddings de Google Gemini (ver más abajo).
- **`trust proxy`:** falla 11 veces el login desde el PC; el intento 11 da "Demasiados intentos". Después, desde el móvil con datos (otra IP), el login debe funcionar. Si también se bloquea, el número de intermediarios no es 2 y hay que ajustarlo en `backend/src/app.ts`.
- **PWA:** en el móvil, "Instalar aplicación" o "Añadir a pantalla de inicio", y probar el menú Compartir en Android.
- **Avisos:** con las claves VAPID puestas, activarlos en Ajustes y crear un recordatorio a 2 minutos.

## Límites que conviene saber

- **Render Free** no es para producción, según el propio Render, pero un portfolio cumple.
- **Vercel Hobby** es para uso personal y no comercial.
- **Neon gratis** da 0,5 GB y 100 horas de cómputo al mes. El aviso cada 10 minutos despierta también la base (el health consulta Neon), lo que gasta horas de cómputo. Si se acercan al límite, se puede espaciar el aviso.
- **Foto de perfil:** pasa por el reenvío de Vercel, que limita las peticiones a unos 4,5 MB. Una foto de casi 5 MB podría fallar.
- **Plan C, si la memoria no da:** la API de embeddings de Google Gemini, gratis y sin carga de memoria en el servidor. A cambio, necesita una clave, en el plan gratis Google puede usar los textos para mejorar sus productos, y habría que cambiar la dimensión de los vectores y recalcularlos todos.
