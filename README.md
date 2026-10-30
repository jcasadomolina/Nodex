<p align="center">
  <img src="frontend/src/app/icon.svg" alt="Logo de Nodex" width="96">
</p>

<h1 align="center">Nodex</h1>

<p align="center"><b>Tus notas y enlaces, conectados.</b></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/licencia-MIT-blue.svg" alt="Licencia MIT"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D22.9-brightgreen" alt="Node.js 22.9 o superior"></a>
  <img src="https://img.shields.io/badge/estado-en%20desarrollo-orange" alt="Estado: en desarrollo">
</p>

<p align="center">
  <a href="#funcionalidades">Funcionalidades</a> ·
  <a href="#capturas">Capturas</a> ·
  <a href="#tecnologías-utilizadas">Tecnologías</a> ·
  <a href="#puesta-en-marcha">Puesta en marcha</a> ·
  <a href="docs/README.md">Documentación</a>
</p>

<p align="center">
  <img src="docs/readme/grafo-animado.gif" alt="Animación de la portada: un Nodex nuevo se conecta con otros y la IA lo coloca en su grupo dentro del grafo" width="560">
</p>

Aplicación web para guardar notas y enlaces en un solo sitio y dejar que una IA los ordene. Cada nota o enlace es un **Nodex**. Los Nodexs se agrupan, se relacionan entre sí por su significado y se pueden ver como un grafo.

> **Estado:** en desarrollo. Las funcionalidades principales están hechas. Falta publicarla en Internet. Se podrá probar sin registrarse con el modo demo.

## Funcionalidades

- **Notas y enlaces.** Las notas se escriben en Markdown. Los enlaces muestran una vista previa, el tiempo de lectura y un aviso si la página deja de existir.
- **Grupos con IA.** La IA propone a qué grupo va cada Nodex sin grupo, o sugiere crear un grupo nuevo cuando varios se parecen.
- **Búsqueda por significado.** Encuentra Nodexs aunque no compartan palabras con la búsqueda. Además muestra los relacionados y avisa de duplicados.
- **Grafo.** Mapa interactivo de grupos y Nodexs, parecido al de Obsidian.
- **Tareas y recordatorios.** Cualquier Nodex puede ser una tarea, con tablero y calendario, o tener un recordatorio con notificación push.
- **Organización.** Prioridades, etiquetas, "Leer más tarde", *Redescubre* (Nodexs olvidados) y papelera con 30 días para restaurar.
- **Vista de trabajo.** Pestañas y dos paneles, como un editor de código.
- **Cuentas.** Registro con email o con Google y GitHub, perfil con foto y tutorial de bienvenida.
- **PWA.** Se instala en el móvil, guarda enlaces desde el menú Compartir de Android y muestra una página propia sin conexión.
- **Modo demo.** Un botón crea una cuenta de prueba con datos de ejemplo que se borra a las 24 horas, o se convierte en cuenta real sin perder nada.

## Capturas

<table>
  <tr>
    <td width="50%" align="center">
      <img src="docs/readme/panel.png" alt="Panel con los grupos, Redescubre y las tarjetas de los Nodexs">
      <br><b>Panel</b>: grupos, filtros y <i>Redescubre</i>
    </td>
    <td width="50%" align="center">
      <img src="docs/readme/sugerencias.png" alt="Sugerencias de la IA: a qué grupo va cada huérfano y un grupo nuevo propuesto">
      <br><b>Sugerencias de la IA</b>: grupo para cada huérfano y grupos nuevos
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <img src="docs/readme/grafo.png" alt="Vista gráfica con los grupos y sus Nodexs conectados">
      <br><b>Vista gráfica</b>: grupos y Nodexs como una red
    </td>
    <td width="50%" align="center">
      <img src="docs/readme/nodex.png" alt="Página de un Nodex con sus propiedades y el contenido en Markdown">
      <br><b>Nodex</b>: propiedades, pestañas y contenido en Markdown
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <img src="docs/readme/tareas.png" alt="Tablero de tareas con las columnas Pendiente, En curso y Hecha">
      <br><b>Tareas</b>: tablero y calendario
    </td>
    <td width="50%" align="center">
      <img src="docs/readme/movil.png" alt="Panel en un móvil con la barra de navegación abajo" width="45%">
      <br><b>Móvil</b>: interfaz adaptada e instalable como app
    </td>
  </tr>
</table>

## Tecnologías utilizadas

**Frontend**

<p>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/shadcn%2Fui-000000?style=flat&logo=shadcnui&logoColor=white" alt="shadcn/ui">
  <img src="https://img.shields.io/badge/Radix_UI-161618?style=flat&logo=radixui&logoColor=white" alt="Radix UI">
  <img src="https://img.shields.io/badge/TanStack_Query-FF4154?style=flat&logo=reactquery&logoColor=white" alt="TanStack Query">
  <img src="https://img.shields.io/badge/D3.js-F9A03C?style=flat&logo=d3&logoColor=white" alt="D3.js">
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=flat&logo=pwa&logoColor=white" alt="PWA">
</p>

**Backend**

<p>
  <img src="https://img.shields.io/badge/Node.js-5FA04E?style=flat&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Zod-3E67B1?style=flat&logo=zod&logoColor=white" alt="Zod">
  <img src="https://img.shields.io/badge/Passport-34E27A?style=flat&logo=passport&logoColor=white" alt="Passport">
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=flat&logo=cloudinary&logoColor=white" alt="Cloudinary">
</p>

**Base de datos e IA**

<p>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Neon-00E599?style=flat&logo=neon&logoColor=black" alt="Neon">
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/Hugging_Face-FFD21E?style=flat&logo=huggingface&logoColor=black" alt="Hugging Face Transformers.js">
</p>

**Herramientas**

<p>
  <img src="https://img.shields.io/badge/npm-CB3837?style=flat&logo=npm&logoColor=white" alt="npm">
  <img src="https://img.shields.io/badge/ESLint-4B32C3?style=flat&logo=eslint&logoColor=white" alt="ESLint">
</p>

La IA son *embeddings* con Transformers.js (`paraphrase-multilingual-MiniLM-L12-v2`) guardados en pgvector. Se calculan en el propio servidor, sin APIs de pago.

## Arquitectura

```
Navegador ──► Next.js (frontend, :3000)
                 ├─ páginas de React
                 └─ /api/* ──► Express (backend, :4000) ──► PostgreSQL + pgvector (Neon)
                                   ├─ embeddings con Transformers.js
                                   └─ tareas de fondo: recordatorios, enlaces rotos, papelera, demos
```

El navegador solo habla con un dominio: Next.js reenvía `/api/*` al backend, así que la cookie de sesión viaja sola y no hace falta configurar CORS. Los datos de cada usuario están aislados de los demás.

## Estructura

```
backend/    API en Express: módulos por funcionalidad, esquema de Prisma y migraciones
frontend/   Aplicación en Next.js
docs/       Requisitos, decisiones técnicas y explicación de cada parte
```

## Puesta en marcha

Necesitas Node.js 22.9 o superior y una base de datos PostgreSQL con pgvector (el plan gratuito de [Neon](https://neon.tech) sirve).

1. Copia `.env.example` a `.env` en la raíz y rellena al menos `DATABASE_URL`, `DIRECT_URL` y `SESSION_SECRET`. El resto es opcional: sin esas claves, su funcionalidad se desactiva y la aplicación sigue en marcha.
2. Backend:

   ```bash
   cd backend
   npm install
   npm run db:deploy
   npm run dev
   ```

3. Frontend, en otra terminal:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Abre `http://localhost:3000`.

Más detalles en [backend/README.md](backend/README.md) y [frontend/README.md](frontend/README.md).

## Documentación

La carpeta [`docs/`](docs/README.md) explica qué se construye y por qué: requisitos, base de datos, backend, frontend y el diseño de cada funcionalidad. Está escrita para que se entienda también sin experiencia previa en estas tecnologías.

## Cómo se ha hecho

Es el primer proyecto de [José Antonio Casado Molina](https://github.com/jcasadomolina) como desarrollador junior. Está hecho con ayuda de IA (Claude Code): cada funcionalidad se diseña, se aprueba y se documenta antes de programarla, y llega a `develop` por pull request desde su propia rama.

## Licencia

[MIT](LICENSE)
