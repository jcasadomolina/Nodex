# Diseño: apps para Android y Windows

Fecha: 2026-11-02 · Rama: `feature/apps-nativas` · Hoja de ruta: "Aplicación de escritorio, APK y distribución" del [plan de implementación](../02-plan-de-implementacion.md)

Nodex ya es una PWA publicada en `https://nodex-three.vercel.app`, instalable y con avisos push, Compartir e IA en el dispositivo. Este bloque la empaqueta como **APK para Android** y como **instalador para Windows**, que se descargan desde **GitHub Releases**, sin tiendas.

## Decisiones

| Pregunta | Decisión | Por qué |
|----------|----------|---------|
| Cómo se hacen las apps | **Envolver la web publicada**: TWA en Android y Tauri en Windows | No se toca el código de la app y cada despliegue en Vercel llega solo a todas. Empaquetar el frontend dentro chocaría con el reenvío `/api`, el proxy de Next y las cookies entre dominios |
| Distribución | **GitHub Releases** (APK y `.exe`), sin Google Play ni Microsoft Store | Gratis y sin cuentas de desarrollador |
| Escritorio | **Solo Windows** | Es lo que usa la mayoría. En macOS, sin una firma de Apple (de pago), el sistema bloquea la app |
| Cómo se generan las versiones | **GitHub Actions** al subir un tag `v*` | Es reproducible y no hace falta instalar en el PC el SDK de Android ni Rust. La clave de firma va en los secrets |
| Login de Google y avisos push en escritorio | **Se prueban y, si fallan, se ocultan solo en la app de Windows** | Google bloquea a veces los navegadores embebidos, y WebView2 puede no soportar push. En la web y el APK todo sigue igual |

**Ampliación futura** (cuando todo funcione): login de Google en la app de Windows abriendo el navegador del sistema y volviendo a la app con un enlace `nodex://`. Necesita un intercambio de token nuevo en el backend, porque la cookie de sesión se queda en el navegador.

Fuera de alcance: macOS y Linux, las tiendas, firmar el instalador de Windows y un actualizador automático de la app de escritorio.

## Estructura

```
apps/
  android/   proyecto TWA, generado una vez con Bubblewrap y guardado en el repo
  desktop/   proyecto Tauri v2: una ventana que carga la web
.github/workflows/release.yml
frontend/public/.well-known/assetlinks.json
frontend/src/lib/platform.ts
docs/12-apps.md
```

## APK (TWA)

- **Qué es:** una app Android mínima que abre `https://nodex-three.vercel.app/` en el Chrome del móvil, a pantalla completa y con su icono. Por dentro es la misma PWA: sesión, IA, avisos push y Compartir funcionan como en la web.
- **Cómo se genera:** [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) lee el manifest de la web (nombre, colores, iconos, `share_target`) y crea el proyecto Android. Se genera una vez y queda en `apps/android/`; la CI solo lo compila con Gradle.
- **Identificador:** `io.github.jcasadomolina.nodex`. No se puede cambiar después sin que Android lo trate como otra app.
- **Versión:** sale del tag. `v1.2.3` da `versionName` `1.2.3` y `versionCode` `10203` (mayor × 10000 + menor × 100 + parche).
- **Clave de firma:** la genera Jose una vez con `keytool` y la guarda con copia en un sitio seguro. Si se pierde, las versiones nuevas no se instalan encima de las anteriores. En GitHub va como secrets:
  - `ANDROID_KEYSTORE_BASE64`: el archivo en base64;
  - `ANDROID_KEYSTORE_PASSWORD`;
  - `ANDROID_KEY_ALIAS`;
  - `ANDROID_KEY_PASSWORD`.

  Nunca va en el repositorio ni en el chat (`RNF-9.1`).
- **Pantalla completa sin barra de Chrome:** Vercel sirve `/.well-known/assetlinks.json` con el identificador y la huella SHA-256 **pública** de la clave. Sin ese archivo, la app funciona pero muestra una barra de URL. El proxy de Next ya deja pasar las rutas con punto.
- **Instalación:** hay que permitir "instalar apps de origen desconocido" para el navegador o el gestor de archivos.

## App de Windows (Tauri)

- **Qué es:** una ventana nativa que usa WebView2 (el motor de Edge, incluido en Windows 10 y 11) y carga `https://nodex-three.vercel.app/`. No lleva el frontend dentro. El instalador ocupa pocos MB.
- **Proyecto `apps/desktop/`:** Tauri v2 con el Rust mínimo de la plantilla. Solo se toca la configuración (`tauri.conf.json`):
  - ventana de 1200 × 800, redimensionable, título "Nodex";
  - iconos generados desde `frontend/public/icon-512.png`;
  - user agent con `NodexDesktop` añadido;
  - instalador NSIS, con la versión del tag.
- **Enlaces externos:** se abren en el navegador del sistema. Si no, la ventana navegaría fuera de Nodex y no habría forma de volver.
- **SmartScreen:** el instalador no va firmado, así que Windows muestra "Windows protegió tu PC". Hay que pulsar **Más información → Ejecutar de todas formas**.
- **Actualizar la app:** solo hace falta si cambia la carcasa (icono, nombre, ventana). El contenido se actualiza solo con cada despliegue de la web.
- **Sin conexión:** muestra la página sin conexión de la PWA si el service worker ya está instalado; si no, el error de WebView2.

## Cambios en el frontend

- `lib/platform.ts`: `isDesktopApp(): boolean`, que comprueba si `navigator.userAgent` contiene `NodexDesktop`. Lleva su test.
- Solo si al probar la app el login de Google está bloqueado: `auth-form.tsx` no muestra "Continuar con Google" cuando `isDesktopApp()`.
- Solo si los avisos push no funcionan: `push-button.tsx` muestra en la app de escritorio *"Los avisos al escritorio no están disponibles en la app. Úsalos desde el navegador o el móvil."*
- `LandingFooter`: una línea discreta *"Descarga Nodex: Android · Windows"* con los enlaces de la última versión.

## Publicación (`.github/workflows/release.yml`)

- **Cuándo se ejecuta:**
  - al subir un tag `v*` (lo crea Jose en `main` tras el merge);
  - a mano (`workflow_dispatch`), para probar la compilación sin publicar: los archivos quedan como artefactos.
- **Trabajo `android`** (Ubuntu): Java 17, reconstruye la clave desde los secrets, compila y firma con Gradle y deja `Nodex.apk`.
- **Trabajo `windows`** (Windows): Node y Rust, `tauri build` con la versión del tag, y deja `Nodex-setup.exe`.
- **Trabajo `release`** (solo con tag): espera a los dos y crea la Release con los dos archivos y unas notas fijas de instalación (origen desconocido en Android, SmartScreen en Windows). Usa el `GITHUB_TOKEN` con permiso `contents: write`.
- Los archivos tienen siempre el mismo nombre, así que estos enlaces dan siempre la última versión:
  - `https://github.com/jcasadomolina/Nodex/releases/latest/download/Nodex.apk`
  - `https://github.com/jcasadomolina/Nodex/releases/latest/download/Nodex-setup.exe`

## Pruebas

- Antes del primer tag, el workflow se lanza a mano:
  - el `.exe` se instala y se prueba en el PC: carga, sesión, IA, enlaces externos, login de Google y avisos push;
  - el APK lo instala Jose en el móvil. Si no sale barra de URL, `assetlinks.json` está bien.
- Lo que falle en escritorio (Google o push) se oculta como dice "Cambios en el frontend".
- `isDesktopApp()` tiene test unitario.

## Documentación

- `docs/12-apps.md` (nuevo, nivel junior): qué son TWA y Tauri, cómo se publica una versión, la clave de firma y qué hacer si se pierde, y los límites de cada app.
- `README.md`: sección "Descargar" con los enlaces y los pasos de instalación.
- `02-plan-de-implementacion` y la tabla de documentos de `CLAUDE.md`.
