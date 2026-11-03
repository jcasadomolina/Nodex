<!-- prettier-ignore -->
<div align="center">

<img src="frontend/src/app/icon.svg" alt="" align="center" height="80" />

# Nodex

**Tus notas y enlaces, conectados.**

[![Abrir Nodex](https://img.shields.io/badge/Abrir-nodex--three.vercel.app-ff9d42?style=flat-square)](https://nodex-three.vercel.app)
[![Descargar](https://img.shields.io/github/v/release/jcasadomolina/Nodex?style=flat-square&label=Descargar&color=3c873a)](#descargar)
[![Pruebas](https://img.shields.io/github/actions/workflow/status/jcasadomolina/Nodex/tests.yml?branch=develop&style=flat-square&label=Pruebas)](https://github.com/jcasadomolina/Nodex/actions/workflows/tests.yml)
<br>
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_+_pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Licencia MIT](https://img.shields.io/badge/Licencia-MIT-yellow?style=flat-square)](LICENSE)

[Qué es](#qué-es) • [Funcionalidades](#funcionalidades) • [Descargar](#descargar) • [Arquitectura](#arquitectura) • [Puesta en marcha](#puesta-en-marcha) • [Documentación](#documentación)

<img src="docs/readme/grafo-animado.gif" alt="Un Nodex nuevo se conecta con otros y la IA lo coloca en su grupo dentro del grafo" width="560" />

</div>

Nodex es una aplicación para guardar notas y enlaces en un solo sitio y dejar que una IA los ordene. Cada nota o enlace es un **Nodex**: se agrupa, se relaciona con los demás por su significado y se puede ver como un grafo. Funciona en el navegador, se instala como PWA y tiene apps para Android y Windows.

> [!TIP]
> Puedes probarla sin registrarte: entra en [nodex-three.vercel.app](https://nodex-three.vercel.app) y pulsa **Probar sin registrarse**. Se crea una cuenta con datos de ejemplo que se borra a las 24 horas, o que puedes convertir en tu cuenta sin perder nada.

## Qué es

Guardar cosas es fácil; volver a encontrarlas, no. Nodex intenta que lo que guardas se ordene casi solo:

- La IA propone a qué **grupo** va cada Nodex suelto, y sugiere grupos nuevos cuando varios hablan de lo mismo.
- La **búsqueda** entiende el significado: "historial de cambios del código" encuentra tus apuntes de Git aunque no compartan ninguna palabra.
- El **grafo** muestra de un vistazo cómo se conecta todo, al estilo de Obsidian.

La IA funciona **en tu dispositivo**: el modelo de *embeddings* se descarga una vez (unos 120 MB, solo si lo aceptas) y tus notas no salen de tu navegador para calcularla. No usa APIs de pago.

## Funcionalidades

- **Notas y enlaces**: notas en Markdown; enlaces con vista previa, tiempo de lectura y aviso si la página deja de existir.
- **Grupos con IA**: sugerencias de grupo para los Nodexs sin grupo y propuestas de grupos nuevos. La IA nunca mueve nada sin que aceptes.
- **Búsqueda por significado**: búsqueda híbrida (significado + texto), Nodexs relacionados y aviso de duplicados.
- **Grafo interactivo** de grupos y Nodexs.
- **Tareas y recordatorios**: cualquier Nodex puede ser una tarea, con tablero y calendario, o tener un recordatorio con notificación push.
- **Organización**: prioridades, etiquetas, *Leer más tarde*, *Redescubre* (Nodexs olvidados) y papelera con 30 días para restaurar.
- **Vista de trabajo**: pestañas y dos paneles, como en un editor de código.
- **Cuentas**: registro con email, Google o GitHub, perfil con foto y tutorial de bienvenida.
- **En todas partes**: PWA instalable con página sin conexión y menú Compartir en Android, más apps para Android y Windows.

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

## Descargar

Las apps cargan la misma web, así que siempre tienen la última versión sin actualizar nada.

| Plataforma | Descarga | Requisitos |
|------------|----------|------------|
| Android | [**Nodex.apk**](https://github.com/jcasadomolina/Nodex/releases/latest/download/Nodex.apk) | Android 7.0 o superior |
| Windows | [**Nodex-setup.exe**](https://github.com/jcasadomolina/Nodex/releases/latest/download/Nodex-setup.exe) | Windows 10 u 11 |
| Navegador | [nodex-three.vercel.app](https://nodex-three.vercel.app) | Cualquier navegador moderno; desde el menú se instala como PWA |

> [!NOTE]
> Las apps no vienen de ninguna tienda. En Android, permite "instalar apps de origen desconocido" al abrir el APK. En Windows, el instalador no está firmado: si aparece "Windows protegió tu PC", pulsa **Más información → Ejecutar de todas formas**. En la app de Windows no hay notificaciones push; el resto funciona igual que en la web.

## Arquitectura

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme/stack-dark.png">
  <img src="docs/readme/stack.png" alt="Stack de Nodex: el dispositivo (navegador, Android, Windows y Transformers.js) llama a Next.js en Vercel, que reenvía /api a Express y Prisma en Render, con PostgreSQL y pgvector en Neon y fotos en Cloudinary; GitHub Actions ejecuta Vitest y Playwright y despliega">
</picture>

| Parte | Tecnologías |
|-------|-------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, TanStack Query, D3 |
| Backend | Express 5, Prisma 7, Zod, Passport (Google y GitHub), argon2, Web Push |
| Datos | PostgreSQL con pgvector en Neon; fotos en Cloudinary |
| IA | Transformers.js con `paraphrase-multilingual-MiniLM-L12-v2` (384 dimensiones), en el dispositivo |
| Apps | TWA (Bubblewrap) para Android y Tauri v2 para Windows |
| Calidad | Vitest, Supertest y Playwright, con GitHub Actions en cada pull request |

El navegador solo habla con un dominio: Next.js reenvía `/api/*` al backend, así que la cookie de sesión viaja sola y no hace falta CORS. Cada consulta filtra por el usuario de la sesión, de modo que los datos de cada usuario quedan aislados. El backend nunca carga el modelo de IA: solo guarda y compara vectores, y así cabe en los 512 MB del plan gratuito de Render. Además ejecuta tareas de fondo: recordatorios, comprobación de enlaces rotos y limpieza de la papelera y de las demos caducadas.

## Puesta en marcha

Necesitas **Node.js 22.9 o superior** y una base de datos **PostgreSQL con pgvector** (el plan gratuito de [Neon](https://neon.tech) sirve).

1. Clona el repositorio y copia `.env.example` a `.env` en la raíz. Rellena al menos `DATABASE_URL`, `DIRECT_URL` y `SESSION_SECRET`.

2. Arranca el backend:

   ```bash
   cd backend
   npm install
   npm run db:deploy
   npm run dev
   ```

3. En otra terminal, arranca el frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Abre `http://localhost:3000`.

> [!TIP]
> El resto de variables (Google, GitHub, Cloudinary y las claves VAPID de las notificaciones) son opcionales. Sin ellas, esa función se desactiva y la aplicación sigue funcionando.

Las pruebas se ejecutan con `npm test` en `backend/` y en `frontend/`. Las del backend necesitan Docker, que levanta una base de datos de prueba: `docker compose up -d db-test`. Los detalles de cada parte están en [backend/README.md](backend/README.md) y [frontend/README.md](frontend/README.md).

## Documentación

La carpeta [`docs/`](docs/README.md) explica qué se construye y por qué, escrita para que se entienda sin experiencia previa en estas tecnologías:

- [Requisitos de producto](docs/03-requisitos-producto.md): historias de usuario con sus requisitos.
- [Backend](docs/06-sistema-backend.md), [Base de datos](docs/08-base-de-datos.md) y [Frontend](docs/09-frontend.md): cómo funciona cada parte.
- [Pruebas](docs/10-pruebas.md), [Despliegue](docs/11-despliegue.md) y [Apps](docs/12-apps.md): cómo se prueba, se publica y se empaqueta.

## Cómo se ha hecho

Nodex es el primer proyecto de [José Antonio Casado Molina](https://github.com/jcasadomolina) como desarrollador junior, hecho con ayuda de IA (Claude Code). Cada funcionalidad se diseña, se aprueba y se documenta antes de programarla, y llega a `develop` por pull request desde su propia rama, siguiendo GitFlow.
