# Nodex

Nodex es una aplicación web para guardar notas y enlaces y ordenarlos en grupos. Cada nota o enlace es un **Nodex**. Los que no tienen grupo se llaman **huérfanos**, y la IA te sugiere en qué grupo ponerlos. Tú decides si aceptas, porque la IA nunca mueve nada por su cuenta.

Además, un Nodex puede ser una tarea con su tablero, un recordatorio que llega como notificación push o un enlace con vista previa que la app revisa de vez en cuando para avisarte si está roto. La búsqueda encuentra los Nodexs por su significado y no solo por las palabras exactas.

El repositorio incluye un backend en Express y un frontend en Next.js. La documentación de diseño y las decisiones técnicas están en [docs/](docs/).

## Tecnologías utilizadas

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=flat&logo=shadcnui&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=flat&logo=radixui&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=flat&logo=reactquery&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![pgvector](https://img.shields.io/badge/pgvector-336791?style=flat&logo=postgresql&logoColor=white)
![Neon](https://img.shields.io/badge/Neon-00E599?style=flat&logo=neon&logoColor=black)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Hugging Face](https://img.shields.io/badge/Transformers.js-FFD21E?style=flat&logo=huggingface&logoColor=black)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat&logo=zod&logoColor=white)
![Passport](https://img.shields.io/badge/Passport-34E27A?style=flat&logo=passport&logoColor=black)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat&logo=cloudinary&logoColor=white)
![Web Push](https://img.shields.io/badge/Web_Push-5A0FC8?style=flat&logo=pwa&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat&logo=eslint&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=flat&logo=npm&logoColor=white)
![Google Fonts](https://img.shields.io/badge/Google_Fonts-4285F4?style=flat&logo=googlefonts&logoColor=white)

## Técnicas interesantes

### Frontend

- **Carrusel sin librerías.** La [bienvenida](frontend/src/app/bienvenida/) usa [CSS scroll snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap). Los botones y las flechas del teclado lo mueven con [`Element.scrollTo()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTo), y la barra de desplazamiento se oculta con [`scrollbar-width`](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-width).
- **Respeto a la reducción de movimiento.** Todas las animaciones se detienen con [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion). En JavaScript se consulta con [`matchMedia()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) para cambiar el desplazamiento suave por uno instantáneo.
- **Logo animado solo con CSS.** Usa [`@keyframes`](https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes) sobre un SVG, con un retraso por satélite que se calcula con [`calc()`](https://developer.mozilla.org/en-US/docs/Web/CSS/calc) y una [propiedad personalizada](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) `--i`. La propiedad [`transform-box`](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-box) fija el punto de escala dentro del SVG.
- **Rejilla tipo Keep sin JavaScript.** Se construye con [columnas CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_multicol_layout).
- **Colores en OKLCH.** Los temas claro y oscuro son variables CSS escritas con [`oklch()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch).
- **Abrir un Nodex sin navegar.** La URL cambia con [`history.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState), así que el panel no se desmonta y conserva los filtros.
- **Tutorial anclado a la interfaz.** Los pasos se enganchan a los elementos que llevan [atributos `data-*`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*), y el progreso de la pestaña se guarda en [`sessionStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage).
- **Un solo dominio para el navegador.** Next.js reenvía `/api/*` al backend con `rewrites`. La [cookie de sesión](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) (`HttpOnly`, `SameSite=Lax`) viaja sola y no hace falta CORS.

### Backend

- **Protección contra SSRF.** [backend/src/lib/safe-fetch.ts](backend/src/lib/safe-fetch.ts) comprueba la IP que devuelve el DNS justo al conectar, con [`net.BlockList`](https://nodejs.org/api/net.html#class-netblocklist), y vuelve a comprobar cada redirección.
- **Tiempos límite.** Las llamadas externas usan [`AbortSignal.timeout()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static). La detección de duplicados se corta a los 3 s con [`Promise.race()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race).
- **Notificaciones con la [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API).** Usan claves VAPID y cifrado de extremo a extremo, sin servicios de pago.
- **Procesos en segundo plano sin colas externas.** Se usa `setInterval(...).unref()` junto con [`FOR UPDATE SKIP LOCKED`](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE), de modo que cada recordatorio lo procese un solo servidor.
- **Orden fraccionario en el tablero.** Mover una tarea le asigna el punto medio entre sus dos vecinas, así que cada movimiento es una sola escritura.
- **Búsqueda híbrida.** Suma la similitud coseno de los embeddings y un extra cuando el texto coincide literalmente.
- **Paginación por cursor**, borrado lógico con índices únicos parciales y claves foráneas compuestas que impiden mezclar datos de usuarios distintos.
- **Vista previa de enlaces** a partir de las etiquetas [Open Graph](https://ogp.me/), con [Wayback Machine](https://archive.org/help/wayback_api.php) como respaldo cuando un enlace está roto.

## Tecnologías menos evidentes

- [Transformers.js](https://huggingface.co/docs/transformers.js) (`@huggingface/transformers`): ejecuta el modelo [paraphrase-multilingual-MiniLM-L12-v2](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2) en la CPU, dentro de Node.
- [pgvector](https://github.com/pgvector/pgvector): guarda los vectores en PostgreSQL y los compara con el operador `<=>`.
- [Prisma 7](https://www.prisma.io/) con [`@prisma/adapter-pg`](https://www.prisma.io/docs/orm/overview/databases/postgresql), sobre [Neon](https://neon.tech/).
- [connect-pg-simple](https://github.com/voxpelli/node-connect-pg-simple): guarda las sesiones en una tabla de PostgreSQL.
- [argon2](https://github.com/ranisalt/node-argon2): hash de contraseñas con argon2id.
- [Zod 4](https://zod.dev/): validación de las peticiones y del `.env`, con mensajes en español.
- [web-push](https://github.com/web-push-libs/web-push), [helmet](https://helmetjs.github.io/), [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit), [multer](https://github.com/expressjs/multer), [Cloudinary](https://cloudinary.com/) y [Passport](https://www.passportjs.org/) (Google y GitHub).
- [TanStack Query 5](https://tanstack.com/query): caché, scroll infinito e invalidación tras cada cambio.
- [shadcn/ui](https://ui.shadcn.com/) sobre [Radix](https://www.radix-ui.com/), [class-variance-authority](https://cva.style/), [next-themes](https://github.com/pacocoursey/next-themes), [Sonner](https://sonner.emilkowal.ski/), [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) y [Lucide](https://lucide.dev/).
- [Tailwind CSS 4](https://tailwindcss.com/) con Turbopack, y [tsx](https://tsx.is/) para el desarrollo del backend.

**Tipografías:** [Nunito](https://fonts.google.com/specimen/Nunito) para el texto y [Geist Mono](https://vercel.com/font) para el código. Se cargan con `next/font`.

## Estructura del proyecto

```text
.
├── backend/
│   ├── .cache/
│   │   └── models/
│   ├── prisma/
│   │   └── migrations/
│   └── src/
│       ├── config/
│       ├── lib/
│       ├── middleware/
│       ├── modules/
│       │   ├── ai/
│       │   ├── auth/
│       │   ├── board/
│       │   ├── groups/
│       │   ├── health/
│       │   ├── links/
│       │   ├── me/
│       │   ├── nodexs/
│       │   ├── push/
│       │   ├── reminders/
│       │   └── tasks/
│       ├── scripts/
│       └── types/
├── docs/
│   ├── bocetos/
│   └── superpowers/
│       ├── plans/
│       └── specs/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── (app)/
│       │   │   ├── nodexs/[id]/
│       │   │   └── perfil/
│       │   ├── (auth)/
│       │   │   ├── login/
│       │   │   └── registro/
│       │   └── bienvenida/
│       ├── components/
│       │   └── ui/
│       └── lib/
│           └── queries/
├── .env.example
├── .gitattributes
├── .gitignore
├── CLAUDE.md
├── LICENSE
└── README.md
```

- [backend/src/modules/](backend/src/modules/): una carpeta por funcionalidad (rutas, validación y lógica), por ejemplo `ai`, `auth`, `links`, `reminders` y `tasks`.
- [backend/src/lib/](backend/src/lib/): piezas compartidas como Prisma, sesiones, embeddings, peticiones seguras y almacenamiento.
- [backend/prisma/](backend/prisma/): el esquema y las migraciones de la base de datos.
- `backend/.cache/models/`: el modelo de IA, que se descarga solo la primera vez y Git ignora.
- [frontend/src/app/](frontend/src/app/): las rutas de Next.js. `(auth)` agrupa el login y el registro, y `(app)` todo lo que exige sesión.
- [frontend/src/components/ui/](frontend/src/components/ui/): los componentes de shadcn/ui, copiados al proyecto como código propio.
- [frontend/src/lib/queries/](frontend/src/lib/queries/): los hooks de TanStack Query, uno por recurso.
- [docs/](docs/): requisitos, decisiones de diseño y bocetos. Conviene empezar por [docs/README.md](docs/README.md).
