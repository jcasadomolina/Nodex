# Despliegue

Nodex se publica gratis con dos servicios:

```
Navegador ──► nodex-xxx.vercel.app (Vercel: frontend Next.js)
                 └─ /api/* ──► https://TU-SUBDOMINIO.duckdns.org (Oracle Cloud: Caddy → Express :4000) ──► Neon
```

| Pieza | Dónde | Por qué |
|-------|-------|---------|
| Frontend | **Vercel**, plan Hobby | Gratis para proyectos personales y hecho por los creadores de Next.js. Despliega solo con cada push a `main` y crea una vista previa por cada PR |
| Backend | **Oracle Cloud Always Free**: una máquina Linux ARM | Gratis para siempre y siempre encendida. Tiene RAM de sobra para el modelo de IA (unos 600 MB), que no cabe en los planes gratis de 512 MB, y mantiene las tareas que se ejecutan cada minuto (recordatorios) |
| Base de datos | **Neon**, plan gratis | La que ya se usa |
| Dominio del backend | **DuckDNS** | Un subdominio gratis (`algo.duckdns.org`) para tener HTTPS |

El navegador solo habla con Vercel, que reenvía `/api/*` al backend, igual que `localhost:3000` en desarrollo. Así la cookie de sesión es del mismo dominio y no hace falta configurar CORS.

## Conceptos

- **Máquina virtual (VM):** un ordenador Linux que alquilas en la nube. Aquí es gratis.
- **SSH:** la forma de entrar a esa máquina desde tu terminal, con una clave en lugar de una contraseña.
- **Caddy:** un servidor web que va delante de Express. Recibe las peticiones HTTPS, pide y renueva solo el certificado de **Let's Encrypt** y las pasa al puerto 4000.
- **systemd:** el gestor de servicios de Linux. Arranca el backend al encender la máquina y lo reinicia si se cae.
- **`trust proxy`:** Express ve las peticiones llegar desde Caddy, y Caddy a su vez las recibe de Vercel. Con `app.set("trust proxy", 2)`, Express se salta esos dos intermediarios y toma la IP real del visitante de la cabecera `X-Forwarded-For`. Sin esto, todos los visitantes parecerían el mismo y los límites (5 demos por hora, 10 intentos de login) serían para todo el mundo a la vez.

## Archivos del repositorio

| Archivo | Qué es |
|---------|--------|
| `deploy/Caddyfile` | Configuración de Caddy: tu dominio → `localhost:4000` |
| `deploy/nodex-backend.service` | El servicio de systemd que arranca `npm start` en `backend/` |
| `deploy/deploy.sh` | Actualiza el código a `origin/main`, instala, compila, aplica migraciones y reinicia |
| `.github/workflows/deploy-backend.yml` | Ejecuta `deploy.sh` por SSH cuando la CI de pruebas termina en verde en `main` |

## Paso a paso

Las cuentas las tienes que crear tú. Los secretos (`.env`, claves) se escriben solo en el servidor, en Vercel o en GitHub, nunca en el chat ni en el repositorio.

### 1. Publicar en `main`

`deploy.sh` y Vercel usan la rama `main`. Primero integra en `develop` todos los PR pendientes y abre un PR de `develop` a `main`. Desde entonces, publicar una versión es hacer merge de `develop` en `main`.

### 2. Máquina en Oracle Cloud

1. Crea la cuenta en [cloud.oracle.com](https://cloud.oracle.com). Pide tarjeta para verificar tu identidad, pero no cobra mientras uses recursos *Always Free*.
2. *Compute → Instances → Create instance*:
   - **Imagen:** Ubuntu 24.04.
   - **Forma:** `VM.Standard.A1.Flex` (Ampere, ARM), con 1 OCPU y 6 GB de RAM. Entra de sobra en el límite gratis.
   - **Clave SSH:** descarga la que te genera o sube la tuya.
   - Si dice *Out of capacity*, prueba otra zona (*availability domain*) o vuelve a intentarlo más tarde.
3. En la red de la instancia (*Virtual cloud network → Security list*), añade reglas de entrada (*Ingress*) para los puertos **80** y **443** desde `0.0.0.0/0`.
4. Apunta la **IP pública** de la máquina.

### 3. Subdominio en DuckDNS

En [duckdns.org](https://www.duckdns.org) entra con GitHub o Google, crea un subdominio (por ejemplo `nodex-api`) y pon la IP pública de la máquina. Cambia `TU-SUBDOMINIO` en `deploy/Caddyfile` por el tuyo.

### 4. Preparar el servidor

Entra por SSH (`ssh -i tu-clave ubuntu@IP`) y ejecuta:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

Las imágenes de Ubuntu de Oracle traen un cortafuegos propio, además de la *security list*. Estas líneas abren los puertos web.

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs git
```

Instala Caddy siguiendo su guía oficial para Ubuntu: [caddyserver.com/docs/install](https://caddyserver.com/docs/install#debian-ubuntu-raspbian).

```bash
git clone https://github.com/jcasadomolina/Nodex.git ~/nodex
nano ~/nodex/.env
```

Si el repositorio todavía es privado, añade antes una *deploy key* de solo lectura en GitHub (*Settings → Deploy keys*) y clona con SSH.

El `.env` del servidor lleva estas variables. Los valores son los tuyos y no se comparten:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `DATABASE_URL`, `DIRECT_URL` | Las de Neon |
| `SESSION_SECRET` | Uno nuevo, de 32 caracteres o más: `openssl rand -base64 48` |
| `APP_URL` | La URL de Vercel, por ejemplo `https://nodex-xxx.vercel.app` |
| `GOOGLE_*`, `GITHUB_*`, `CLOUDINARY_URL`, `VAPID_*` | Opcionales, igual que en local |

Luego, el servicio y el primer despliegue:

```bash
sudo cp ~/nodex/deploy/nodex-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable nodex-backend
bash ~/nodex/deploy/deploy.sh
```

Y Caddy:

```bash
sudo cp ~/nodex/deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Comprueba que responde: `curl https://TU-SUBDOMINIO.duckdns.org/api/health` debe dar `{"status":"ok","database":"ok"}`.

Para ver qué hace el backend: `journalctl -u nodex-backend -f`.

### 5. Frontend en Vercel

1. Entra en [vercel.com](https://vercel.com) con tu cuenta de GitHub e importa el repositorio.
2. *Root Directory:* `frontend`. Vercel detecta Next.js solo.
3. *Environment Variables:* `BACKEND_URL = https://TU-SUBDOMINIO.duckdns.org`.
4. En *Settings → Git*, comprueba que la rama de producción es `main`.
5. Apunta la URL que te da (`https://nodex-xxx.vercel.app`) y ponla en `APP_URL` del `.env` del servidor. Después reinicia el backend: `sudo systemctl restart nodex-backend`.

### 6. Login con Google y GitHub

En las consolas de Google y GitHub (ver [Sistema de backend](06-sistema-backend.md#registrar-nodex-en-google-y-github)), añade las URLs de callback de producción:

- `https://nodex-xxx.vercel.app/api/auth/google/callback`
- `https://nodex-xxx.vercel.app/api/auth/github/callback`

### 7. Despliegue automático del backend

1. En tu PC, crea una clave solo para esto: `ssh-keygen -t ed25519 -f nodex-deploy -N ""`.
2. En el servidor, añade el contenido de `nodex-deploy.pub` al final de `~/.ssh/authorized_keys`.
3. En GitHub, en *Settings → Secrets and variables → Actions*, crea dos secretos:
   - `DEPLOY_SSH_KEY`, con el contenido de `nodex-deploy` (la clave privada);
   - `DEPLOY_HOST`, con la IP o el subdominio.
4. Borra la clave privada de tu PC si no la vas a necesitar más.

Desde ahora, cada push a `main` lanza la CI. Si pasa, `deploy-backend.yml` entra por SSH y ejecuta `deploy.sh`. Vercel despliega el frontend por su cuenta.

## Comprobaciones tras publicar

- Abrir la URL de Vercel, registrarse, crear un Nodex y buscarlo.
- "Probar sin registrarse" crea la demo. La primera tras arrancar el servidor tarda más, porque carga el modelo de IA.
- **`trust proxy`:** falla 11 veces el login desde el PC. El intento 11 da "Demasiados intentos". Después, desde el móvil con datos (otra IP), el login debe funcionar. Si también se bloquea, el número de intermediarios no es 2: hay que ajustar `trust proxy` en `backend/src/app.ts`.
- **PWA:** en el móvil, "Instalar aplicación" o "Añadir a pantalla de inicio", y probar el menú Compartir en Android.
- **Avisos:** con las claves VAPID puestas, activarlos en Ajustes y crear un recordatorio a 2 minutos.

## Límites que conviene saber

- Oracle puede reclamar máquinas *Always Free* que pasen una semana casi sin uso. Las tareas de cada minuto mantienen algo de actividad. Si un día la máquina desaparece, se repite el paso 2 y siguientes.
- Vercel Hobby es para uso personal y no comercial. Un portfolio cumple.
- Neon gratis da 0,5 GB y 100 horas de cómputo al mes. Sobra para unos cuantos usuarios.
- La foto de perfil pasa por el reenvío de Vercel, que limita el tamaño de las peticiones a unos 4,5 MB. Una foto de casi 5 MB podría fallar.
