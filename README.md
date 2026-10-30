# Nodex

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

## Stack

| Capa | Tecnologías |
|------|-------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, TanStack Query, d3 |
| Backend | Node.js, Express 5, TypeScript, Zod, Passport (Google y GitHub), express-session |
| Base de datos | PostgreSQL en Neon con pgvector, Prisma 7 |
| IA | Embeddings con Transformers.js (`paraphrase-multilingual-MiniLM-L12-v2`), ejecutados en el propio servidor y sin APIs de pago |
| Otros | Web Push (VAPID), Cloudinary para las fotos de perfil |

## Arquitectura

```
Navegador ──► Next.js (frontend, :3000)
                 ├─ páginas de React
                 └─ /api/* ──► Express (backend, :4000) ──► PostgreSQL + pgvector (Neon)
                                   ├─ embeddings con Transformers.js
                                   └─ tareas de fondo: recordatorios, enlaces rotos, papelera
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
