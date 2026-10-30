# Diseño: Modo demo (HU-14)

Fecha: 2026-10-30 · Rama: `feature/modo-demo` · Requisitos: `RF-14.1` a `RF-14.4`

Quien visite Nodex desde el portfolio debe poder probarlo sin registrarse. Un botón crea una cuenta temporal con datos de ejemplo sobre **aprender a programar**, que se borra sola a las 24 horas. Si al usuario le gusta, puede convertirla en una cuenta de verdad sin perder lo que ha hecho.

## Decisiones

| Pregunta | Decisión | Por qué |
|----------|----------|---------|
| Tema de los datos | Aprender a programar | Encaja con el portfolio y los grupos se distinguen bien, así que la IA luce |
| Pasar a cuenta real | Se conserva todo: la misma cuenta recibe email y contraseña | Nadie pierde lo que ha probado |
| Qué se bloquea en la demo | Subir foto y vincular Google o GitHub | La foto usa la cuenta de Cloudinary; una cuenta que se borra no debe quedarse con cuentas externas |
| Cómo se crean los datos | Un archivo con los datos y la IA calcula los vectores al crear la cuenta | El archivo se lee bien y se reutiliza `processNodex`. Descartado: guardar los vectores ya calculados (ilegible) o copiar un usuario plantilla (hay que mantenerlo en cada base) |

## Base de datos

- Columna nueva `users.demo_expires_at` (`timestamptz`, nula). Si tiene fecha, el usuario es demo y caduca entonces. Migración `*_add_demo_expires_at`.
- No hace falta nada más: todas las tablas que cuelgan de `users` se borran en cascada.

## Backend (`modules/demo`)

- **`demo.data.ts`:** los datos de ejemplo, escritos a mano en español:
  - **Grupos:** "JavaScript", "Bases de datos", "Git y GitHub" y "Buscar trabajo".
  - **Unos 25 Nodexs**, mezcla de notas en Markdown y enlaces reales (MDN, documentación de PostgreSQL, Pro Git…).
  - **4 o 5 huérfanos:** unos encajan en un grupo existente, para que la IA lo sugiera, y tres hablan de lo mismo (CSS), para que proponga un grupo nuevo.
  - **Personalidades:** 3 o 4 tareas con fechas cercanas a hoy, en estados distintos; un recordatorio para mañana.
  - **Organización:** prioridades variadas, etiquetas (máximo 10 por Nodex), 2 enlaces en "Leer más tarde", y 3 Nodexs creados y abiertos por última vez hace más de 30 días para que salgan en *Redescubre*.
  - Las fechas se guardan como desplazamientos ("hace 40 días", "dentro de 2 días") y se calculan al crear la cuenta.
- **`POST /api/auth/demo`:**
  - Límite de 5 cuentas por hora y por IP con `express-rate-limit`, como el del login. Al pasarlo responde `429` "Has creado demasiadas demos. Prueba dentro de un rato".
  - En una transacción crea el usuario (`name: "Invitado"`, email interno `demo-<uuid>@demo.nodex.invalid`, sin contraseña, `demoExpiresAt` = ahora + 24 h, `tutorialCompletedVersion: null` para que vea el tutorial) y todos sus datos.
  - Después, uno a uno, `processNodex` en cada Nodex (vector y sugerencia de grupo) y `refreshPreviewInBackground` en los enlaces. Si la IA falla, se registra el error y la demo sigue sin esa sugerencia (`RNF-08`).
  - Abre la sesión con `startSession` y responde `201 { user }`.
- **`POST /api/auth/demo/convert`** (requiere sesión de demo; si no lo es, `403`):
  - Recibe `{ name, email, password }` y los valida con el mismo esquema que el registro.
  - Guarda el email, el hash de la contraseña con argon2 y el nombre, y pone `demoExpiresAt = null`. Si el email ya existe, `409` con el mismo mensaje que el registro.
  - Regenera la sesión, como al entrar.
- **Bloqueos:** `PUT /api/me/avatar` y `GET /api/auth/:provider/link` responden `403` "No disponible en la demo. Crea tu cuenta para usarlo" si el usuario es demo.
- **`GET /api/me`** añade `demoExpiresAt` (fecha o `null`).
- **`demo.worker.ts`:** cada hora (y al arrancar) borra los usuarios con `demo_expires_at < now()` y, en la misma transacción, sus filas de `sessions` (si no, su cookie seguiría pasando `requireAuth`). Se arranca en `server.ts`, como la papelera.

## Frontend

- **Portada (`/login`):** bajo el formulario, separado por "o", el botón secundario "Probar sin registrarse". Muestra la rueda mientras se crea la demo (unos segundos) y luego lleva a `/bienvenida`. Los errores salen en un aviso.
- **Franja de demo** (`components/demo-banner.tsx`) en el layout de `(app)`, encima del contenido y en todas las pantallas:
  - Texto: "Estás en la demo · se borra en 23 h" (horas que faltan, redondeadas hacia arriba; "en menos de 1 h" al final).
  - Botón "Crear cuenta", que abre el diálogo.
  - Fondo suave del color primario. En móvil, el texto se acorta a "Demo · 23 h".
- **Diálogo "Crea tu cuenta"** (`components/convert-dialog.tsx`): nombre, email y contraseña, con los mismos campos y errores que el registro. Al terminar: aviso "Cuenta creada. Tus Nodexs se quedan" y la franja desaparece.
- **Perfil:** en la demo no se muestran el email interno, la foto ni la vinculación de Google y GitHub. En su lugar sale: "Crea tu cuenta para cambiar la foto y vincular Google o GitHub".
- **`lib/queries/auth.ts`:** `useStartDemo` y `useConvertDemo`; el tipo `User` gana `demoExpiresAt`.

## Pruebas

- **Unitaria (`demo.data.test.ts`):** cada Nodex de ejemplo pasa `createNodexSchema`, los nombres de grupo son únicos y cada grupo citado existe.
- **Script temporal contra la API:**
  - Crear una demo y comprobar grupos, Nodexs, vectores y al menos una sugerencia.
  - Comprobar el `403` de foto y vinculación.
  - Convertirla, también con un email ya usado.
  - Pasar el límite por IP.
  - Ejecutar `purgeDemos()` con una fecha caducada puesta a mano y comprobar que se borran el usuario, sus datos y su sesión.
- **Navegador:** crear demo, recorrer panel, grafo, tareas y sugerencias, y convertir. En móvil y escritorio.

## Documentación

- `08-base-de-datos.md`: la columna nueva.
- `06-sistema-backend.md`: sección del modo demo (rutas, límite, limpieza).
- `09-frontend.md`: botón, franja, diálogo y perfil.
- `02-plan-de-implementacion.md`: HU-14 hecha.

## Fuera de alcance

- Convertir la demo vinculando Google o GitHub en lugar de email y contraseña.
- Borrar la demo al cerrar sesión: se borra igual a las 24 h.
- Datos de ejemplo en inglés (llegará con `RNF-07.5`).
