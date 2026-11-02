# Plan: apps para Android y Windows

> **Para agentes:** usar superpowers:executing-plans o superpowers:subagent-driven-development. Los pasos usan casillas (`- [ ]`).

**Objetivo:** publicar Nodex como APK de Android (TWA) y como instalador de Windows (Tauri), generados por GitHub Actions y descargables desde GitHub Releases.

**Arquitectura:** las dos apps son carcasas que cargan `https://nodex-three.vercel.app/`. El proyecto Android se genera una vez con `@bubblewrap/core` y se guarda en el repo; el de Windows es un Tauri v2 mínimo. Un workflow compila ambos y, con un tag `v*`, crea la Release.

**Stack:** Bubblewrap (`@bubblewrap/core`) + Gradle + apksigner · Tauri v2 (Rust, WebView2, NSIS) · GitHub Actions · Next 16 (frontend)

**Spec:** [docs/disenos/2026-11-02-apps-android-windows-design.md](../disenos/2026-11-02-apps-android-windows-design.md)

## Restricciones globales

- URL que cargan las apps: `https://nodex-three.vercel.app/`.
- Identificador Android: `io.github.jcasadomolina.nodex`.
- Versión desde el tag `vX.Y.Z`: `versionName` `X.Y.Z`, `versionCode` `X*10000 + Y*100 + Z`. Sin tag (ejecución a mano): `0.0.0` y `1`.
- Archivos de la Release, siempre con este nombre: `Nodex.apk` y `Nodex-setup.exe`.
- Secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Nunca en el repo ni en el chat.
- User agent de escritorio: el de WebView2 más ` NodexDesktop`.
- Textos literales:
  - push en escritorio: `Los avisos al escritorio no están disponibles en la app. Úsalos desde el navegador o el móvil.`
  - pie: columna `Descargar` con `Android (APK)` y `Windows`.
- Código sin comentarios. Git lo hace Jose: los "puntos de control" no son commits.
- En este PC no hay Rust ni SDK de Android: lo que necesita compilar se comprueba en la CI (`workflow_dispatch`).

## Puntos de revisión

1. **Login con GitHub o Google dentro de la app de Windows:** la navegación a `github.com` o `accounts.google.com` en la misma ventana tiene que funcionar (solo las ventanas nuevas, `target="_blank"`, van al navegador del sistema). Se comprueba a mano en la tarea 4.
2. **Ejecución a mano sin tag:** el workflow no debe crear Release ni fallar por falta de versión. Se comprueba al lanzarlo en la tarea 4.
3. **Secrets ausentes** (por ejemplo, en un fork): el trabajo Android debe fallar con un mensaje claro, no con un APK sin firmar. Comprobación en el paso de firma de la tarea 3.
4. **Tag con formato raro** (`v1.2`, `v1.2.3-beta`): el cálculo de versión debe fallar con mensaje claro en vez de dar un `versionCode` erróneo. Comprobación en la tarea 3.
5. **Abrir el enlace de un Nodex en escritorio:** debe abrirse en el navegador y la app seguir en Nodex. Se comprueba a mano en la tarea 4.

---

### Tarea 1: Clave de firma y `assetlinks.json` (Jose + Claude)

**Archivos:**
- Crear: `frontend/public/.well-known/assetlinks.json`

**Interfaces:**
- Produce: los 4 secrets en GitHub y la huella SHA-256 pública que usa `assetlinks.json`.

- [ ] **Paso 1 (Jose):** generar la clave en su PC, fuera del repo:
  `keytool -genkeypair -v -keystore nodex.keystore -alias nodex -keyalg RSA -keysize 2048 -validity 10000`.
  Guardar el archivo y las contraseñas en un gestor de contraseñas, con copia.
- [ ] **Paso 2 (Jose):** subir los secrets en GitHub → *Settings → Secrets and variables → Actions*. `ANDROID_KEYSTORE_BASE64` es la salida de `base64 -w0 nodex.keystore`.
- [ ] **Paso 3 (Jose):** pasar a Claude solo la huella pública: `keytool -list -v -keystore nodex.keystore -alias nodex | grep SHA256`.
- [ ] **Paso 4:** crear `assetlinks.json` con `relation: ["delegate_permission/common.handle_all_urls"]`, `namespace: "android_app"`, `package_name: "io.github.jcasadomolina.nodex"` y `sha256_cert_fingerprints: [<huella>]`.
- [ ] **Paso 5:** `npm run build && npx next start -p 3500` en `frontend/`, luego `curl -s localhost:3500/.well-known/assetlinks.json` → devuelve el JSON con `Content-Type: application/json`.

### Tarea 2: `isDesktopApp`, enlaces de descarga y ajustes de escritorio

**Archivos:**
- Crear: `frontend/src/lib/platform.ts`, `frontend/src/lib/platform.test.ts`
- Modificar: `frontend/src/components/landing-footer.tsx`

**Interfaces:**
- Produce: `isDesktopApp(): boolean` en `lib/platform.ts` (falso en el servidor).

- [ ] **Paso 1: test** `platform.test.ts` (`// @vitest-environment jsdom`):
  - `isDesktopApp` es `true` con `navigator.userAgent` terminado en ` NodexDesktop` (con `vi.spyOn(navigator, "userAgent", "get")`);
  - es `false` con un user agent normal de Chrome.
- [ ] **Paso 2:** `npx vitest run src/lib/platform` → FALLA.
- [ ] **Paso 3:** implementar `isDesktopApp` (`typeof navigator !== "undefined" && navigator.userAgent.includes("NodexDesktop")`).
- [ ] **Paso 4:** en `COLUMNS` de `landing-footer.tsx`, añadir la columna `Descargar` antes de `Proyecto` con:
  - `Android (APK)` → `https://github.com/jcasadomolina/Nodex/releases/latest/download/Nodex.apk`
  - `Windows` → `https://github.com/jcasadomolina/Nodex/releases/latest/download/Nodex-setup.exe`

  Ruling respecto al spec: una columna en vez de una línea suelta, porque el pie ya está organizado en columnas.
- [ ] **Paso 5:** `npm test`, `npm run lint` y `npx tsc --noEmit` en `frontend/` → verde.

Los cambios de `auth-form.tsx` y `push-button.tsx` se hacen solo en la tarea 4, si la prueba real demuestra que fallan.

### Tarea 3: Proyectos Android y Windows y workflow de publicación

**Archivos:**
- Crear: `apps/android/` (generado), `apps/android/generate.mjs`, `apps/android/package.json`
- Crear: `apps/desktop/package.json`, `apps/desktop/src-tauri/{Cargo.toml, build.rs, src/main.rs, tauri.conf.json, capabilities/default.json, icons/*}`
- Crear: `.github/workflows/release.yml`
- Modificar: `.gitignore` (`apps/desktop/src-tauri/target`, `apps/android/**/build`, `*.keystore`)

**Interfaces:**
- Consume: los secrets de la tarea 1.
- Produce: artefactos `Nodex.apk` y `Nodex-setup.exe`.

- [ ] **Paso 1: Android.** `generate.mjs` (dependencia `@bubblewrap/core`) descarga `https://nodex-three.vercel.app/manifest.webmanifest`, crea el `TwaManifest` (`packageId` `io.github.jcasadomolina.nodex`, `host` `nodex-three.vercel.app`, `launcherName` `Nodex`, `enableNotifications: true`, `shareTarget` del manifest) y genera el proyecto en `apps/android/` con `TwaGenerator`. Ejecutarlo una vez y guardar el resultado. Cambiar `app/build.gradle` para que `versionCode` y `versionName` lean `project.findProperty(...)` con los valores por defecto `1` y `"0.0.0"`.
- [ ] **Paso 2: Windows.** `apps/desktop/package.json` con `@tauri-apps/cli` 2.x (versión exacta). En `tauri.conf.json`:
  - `productName` `Nodex`, `identifier` `io.github.jcasadomolina.nodex`;
  - `build.frontendDist` `https://nodex-three.vercel.app`;
  - una ventana de 1200 × 800, `title` `Nodex`, con el `userAgent` de escritorio;
  - `bundle.targets: ["nsis"]`.

  Iconos: `npx tauri icon ../../frontend/public/icon-512.png`. En `main.rs`, las peticiones de ventana nueva (`on_new_window` del `WebviewWindowBuilder`, o el equivalente de la versión de Tauri usada) abren la URL en el navegador del sistema (`tauri-plugin-opener`) y se deniegan dentro. La navegación normal en la misma ventana se permite, porque OAuth la necesita.
- [ ] **Paso 3: workflow** `release.yml`:
  - Disparadores `push: tags: ["v*"]` y `workflow_dispatch`, con `permissions: contents: write`.
  - Paso común de versión: si `GITHUB_REF` es un tag `v<X>.<Y>.<Z>` (regex `^v[0-9]+\.[0-9]+\.[0-9]+$`), calcula `VERSION_NAME` y `VERSION_CODE`. Si es un tag con otro formato, `exit 1` con `Tag no válido: usa vX.Y.Z`. Sin tag, `0.0.0` y `1`.
  - `android` (`ubuntu-latest`):
    - `actions/setup-java` 17;
    - si falta `ANDROID_KEYSTORE_BASE64`, `exit 1` con `Faltan los secrets de firma de Android`;
    - decodifica la clave a `$RUNNER_TEMP`;
    - `./gradlew assembleRelease -PversionCode=… -PversionName=…`;
    - `zipalign` y `apksigner sign` con las build-tools del runner;
    - `apksigner verify`;
    - sube el artefacto `Nodex.apk`.
  - `windows` (`windows-latest`):
    - Node 24 y `dtolnay/rust-toolchain@stable`;
    - pone la versión en `tauri.conf.json` (`npx tauri build --config '{"version":"…"}'`);
    - renombra el instalador NSIS a `Nodex-setup.exe`;
    - lo sube como artefacto.
  - `release` (solo si `startsWith(github.ref, 'refs/tags/v')`), con `needs: [android, windows]`: descarga los artefactos y crea la Release con `gh release create` y notas fijas:
    - Android: permitir "instalar apps de origen desconocido";
    - Windows: SmartScreen → **Más información → Ejecutar de todas formas**.
- [ ] **Paso 4:** validar la sintaxis del YAML (`npx --yes @action-validator/cli .github/workflows/release.yml`, o `python -c "import yaml; yaml.safe_load(open(...))"` si no hay red) → sin errores.
- [ ] **Paso 5: punto de control.** Jose hace commit y push de la rama y lanza el workflow a mano desde *Actions* sobre `feature/apps-nativas` → los dos trabajos en verde y dos artefactos.

### Tarea 4: Prueba real y ajustes de escritorio

**Archivos (solo si hace falta):**
- Modificar: `frontend/src/components/auth-form.tsx`, `frontend/src/components/push-button.tsx`

- [ ] **Paso 1:** Jose descarga los artefactos. Claude instala `Nodex-setup.exe` en el PC y comprueba:
  - carga la web;
  - inicia sesión con correo, se cierra la app, se abre de nuevo y la sesión sigue;
  - login con GitHub;
  - login con Google (anotar si sale "disallowed_useragent" o similar);
  - IA: aceptar la descarga y buscar por significado;
  - abrir el enlace de un Nodex → navegador del sistema, y la app sigue en Nodex;
  - Ajustes → avisos push: anotar si se activan.
- [ ] **Paso 2:** si Google falla, `auth-form.tsx` no renderiza el botón de Google cuando `isDesktopApp()`. Si push falla, `push-button.tsx` devuelve el texto literal de escritorio cuando `isDesktopApp()`. En los dos casos, leer `isDesktopApp()` en un `useEffect`/`useState` para no romper la hidratación.
- [ ] **Paso 3:** Jose instala `Nodex.apk` en el móvil. Debe abrirse sin barra de URL, con la sesión, la IA, los avisos y Compartir funcionando.
- [ ] **Paso 4:** `npm test`, `npm run lint` y `npx tsc --noEmit` en `frontend/` → verde.

### Tarea 5: Documentación

- [ ] **Paso 1:** `docs/12-apps.md` (nivel junior):
  - qué es una TWA y por qué hace falta `assetlinks.json`;
  - qué es Tauri y WebView2;
  - cómo se publica una versión (tag `vX.Y.Z` en `main`);
  - los secrets y qué pasa si se pierde la clave;
  - instalar en Android y Windows;
  - los límites de escritorio (los que salgan en la tarea 4);
  - la ampliación futura del login de Google.
- [ ] **Paso 2:** `README.md`: sección "Descargar" con los dos enlaces y los pasos de instalación. `02-plan-de-implementacion.md`: estado. `CLAUDE.md`: fila de `12-apps` en la tabla de documentos.
- [ ] **Paso 3:** dar a Jose el título y la descripción del commit y del PR, y los pasos para el primer tag (`git tag v1.0.0` en `main` y `git push origin v1.0.0`).
