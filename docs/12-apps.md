# Apps para Android y Windows

Diseño: [especificación](disenos/2026-11-02-apps-android-windows-design.md) · Plan: [plan](planes/2026-11-02-apps-android-windows.md)

Nodex se puede instalar de tres formas, y las tres muestran la **misma web** (`https://nodex-three.vercel.app`):

| Forma | Qué es | Dónde se consigue |
|-------|--------|-------------------|
| PWA | La web instalada desde el navegador ("Instalar aplicación") | En el propio navegador |
| APK de Android | Una app que abre la web en el Chrome del móvil | [`Nodex.apk`](https://github.com/jcasadomolina/Nodex/releases/latest/download/Nodex.apk) |
| App de Windows | Una ventana nativa que carga la web | [`Nodex-setup.exe`](https://github.com/jcasadomolina/Nodex/releases/latest/download/Nodex-setup.exe) |

Las apps no llevan el frontend dentro: son una "carcasa". Cada vez que se despliega la web en Vercel, todas ven la versión nueva sin actualizar nada. Solo hay que publicar una app nueva si cambia la carcasa (icono, nombre, ventana).

## Android: TWA

Una **TWA** (*Trusted Web Activity*) es la forma oficial de Google de convertir una PWA en una app Android. La app es mínima: abre la web en el Chrome del móvil, a pantalla completa y con su icono. Como por dentro es Chrome, funciona todo igual que en la web: sesión, IA, avisos push y el menú Compartir.

- **El proyecto** está en `apps/android/twa`. Lo generó una vez [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) con `apps/android/generate.mjs`, leyendo el manifest publicado (nombre, colores, iconos y `share_target`). Si algún día hay que regenerarlo: `cd apps/android && npm install && npm run generate`. Después hay que volver a aplicar los cambios a mano de `app/build.gradle` (versión y `minSdkVersion 24`).
- **Identificador:** `io.github.jcasadomolina.nodex`. Si se cambia, Android lo trata como otra app distinta.
- **Android 7.0 o superior** (`minSdkVersion 24`), porque la librería de TWA no admite versiones más antiguas.
- **Pantalla completa:** Android solo quita la barra de Chrome si comprueba que la app y la web son del mismo dueño. Para eso, la web sirve [`/.well-known/assetlinks.json`](../frontend/public/.well-known/assetlinks.json) con el identificador y la **huella SHA-256 pública** de la clave que firma el APK. La huella no es secreta. Si no coincide, la app funciona pero con una barra de URL arriba.

### La clave de firma

Android solo instala una versión nueva encima de la anterior si las dos están firmadas con la **misma clave**. La clave es un archivo `nodex.keystore` con contraseña:

- Se guarda fuera del repositorio, en un gestor de contraseñas y con copia. `.gitignore` ignora `*.keystore` por si acaso.
- GitHub Actions la recibe por **secrets**: `ANDROID_KEYSTORE_BASE64` (el archivo en base64), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` y `ANDROID_KEY_PASSWORD`.
- **Si se pierde:** hay que crear otra, cambiar la huella de `assetlinks.json` y avisar de que hay que desinstalar la app antigua antes de instalar la nueva.

### Instalarla

Descargar `Nodex.apk` en el móvil y abrirlo. Android pide permitir "instalar apps de origen desconocido" para el navegador o el gestor de archivos: es normal en las apps que no vienen de Google Play.

## Windows: Tauri

[Tauri](https://tauri.app) crea apps de escritorio pequeñas usando el navegador que ya trae el sistema. En Windows es **WebView2**, el motor de Edge. Por eso el instalador ocupa unos 2 MB, frente a los más de 100 MB de Electron, que lleva su propio Chromium.

- **El proyecto** está en `apps/desktop`. El único código es `src-tauri/src/main.rs`, que:
  - abre una ventana de 1200 × 800 con `https://nodex-three.vercel.app`;
  - marca la página con `window.nodexDesktop = true` (un script de inicio), para que el frontend sepa que está dentro de la app (`isDesktopApp()` en `lib/platform.ts`). No se usa el *user agent* porque Tauri solo deja sustituirlo entero, y uno fijo se queda viejo;
  - manda al navegador del sistema los enlaces que abrirían una ventana nueva (`target="_blank"`), con `tauri-plugin-opener`. La navegación normal se queda dentro, porque el login con GitHub o Google la necesita.
- **Instalador:** NSIS, sin firmar. Firmarlo cuesta dinero, así que Windows muestra "Windows protegió tu PC": hay que pulsar **Más información → Ejecutar de todas formas**. Se instala en `%LOCALAPPDATA%\Nodex`, sin permisos de administrador.

### Límites de la app de Windows

Se comprobaron con la app instalada, conectando con la depuración remota de WebView2:

| Función | Estado |
|---------|--------|
| Cargar Nodex, sesión, demo | Funciona |
| IA en el dispositivo | Funciona: descarga el modelo (unos 40 s) y busca por significado |
| Enlaces externos | Se abren en el navegador del sistema y la app sigue en Nodex |
| Login con Google | La página de Google carga dentro de la app. Falta comprobar el paso de la contraseña, donde Google a veces dice "navegador no seguro" |
| Avisos push | **No funcionan**: WebView2 deniega el permiso sin preguntar. En la app, Ajustes explica que se usen desde el navegador o el móvil |

**Ampliación futura:** login con Google abriendo el navegador del sistema y volviendo a la app con un enlace `nodex://`. Necesita que el backend entregue a la app una sesión nueva, porque la cookie se queda en el navegador.

## Publicar una versión

Todo lo hace [`.github/workflows/release.yml`](../.github/workflows/release.yml):

1. Fusionar los cambios en `main` y **esperar a que Vercel termine de desplegar**. La primera vez importa: hasta que la web sirve `assetlinks.json`, el APK se abre con barra de URL.
2. Crear y subir un tag con la versión:

   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. GitHub Actions compila las dos apps:
   - **android** (Linux): Gradle compila el APK, que se firma con `apksigner` usando la clave de los secrets;
   - **windows**: Rust y `tauri build` generan el instalador.
4. El trabajo **release** crea la Release `v1.0.0` con `Nodex.apk`, `Nodex-setup.exe` y las instrucciones de instalación.

La versión sale del tag: `v1.2.3` da la versión `1.2.3` y, en Android, el `versionCode` `10203`, que Android usa para saber qué versión es más nueva. Un tag con otro formato (`v1.2`, `v1.2.3-beta`) hace fallar el workflow con "Tag no válido".

Los archivos se llaman siempre igual, así que estos enlaces dan siempre la última versión (los usa el pie de la portada):

- `https://github.com/jcasadomolina/Nodex/releases/latest/download/Nodex.apk`
- `https://github.com/jcasadomolina/Nodex/releases/latest/download/Nodex-setup.exe`

**Probar sin publicar:** el workflow también se ejecuta en los pull requests que tocan `apps/` o el propio workflow, y a mano desde *Actions*. En esos casos no crea Release: deja el APK y el instalador como artefactos descargables de la ejecución.
