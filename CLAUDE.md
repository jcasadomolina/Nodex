# CLAUDE.md: Nodex

**Nodex** es una aplicación web de notas y enlaces con IA. Este repositorio es un **monorepo**: `backend/` (hecho casi entero), `frontend/` (vacío, siguiente bloque) y `docs/` (planificación y documentación del proceso).

Idioma de trabajo: **español**, en el código visible, la documentación y las respuestas.

## Contexto del proyecto

- Es el primer proyecto de Jose como Desarrollador de Software Junior. Su objetivo es el **portfolio** y el **aprendizaje**, no el negocio.
- Reparto de roles: Claude escribe la mayor parte del código y trabaja como un fullstack senior. Jose supervisa, aprende, aprueba e implementa algunas partes él mismo.
- Hoja de ruta: web alojada gratis en Internet → PWA para móviles (con compartir enlaces, `RF-05.6`) → app nativa (`.apk` y `.exe`). WhatsApp (HU-03) queda como ampliación futura.

## Documentación

| Archivo | Contenido |
|---------|-----------|
| `docs/README.md` | Índice |
| `docs/01-objetivos.md`, `docs/02-plan-de-implementacion.md` | Propósito, hoja de ruta, forma de trabajar |
| `docs/03-requisitos-producto.md` | HU-01…HU-12 con sus RF y RNF |
| `docs/04-requisitos-tecnicos.md` | Stack y requisitos de la base de datos |
| `docs/05-flujo-de-la-aplicacion.md`, `docs/07-brief-de-diseno.md` | **Vacíos.** No inventes su contenido: proponlo y pide confirmación |
| `docs/06-sistema-backend.md` | Cómo funciona cada parte del backend y por qué |
| `docs/08-base-de-datos.md` | Tablas, índices y reglas para evolucionar el esquema |
| `backend/README.md` | Puesta en marcha, scripts y todos los endpoints |

Al añadir requisitos, continúa la numeración (la última historia es **HU-12**). Cita los requisitos por su código (p. ej. `RF-05.3`).

## Stack (aprobado)

- **Base de datos:** PostgreSQL en Neon (plan gratuito) con Prisma 7 y pgvector. Los datos de cada usuario están aislados: un recurso ajeno responde `404`.
- **Backend:** Express 5 + TypeScript, sesiones con `express-session` en PostgreSQL, OAuth con Passport (Google y GitHub), Zod para validar.
- **IA:** embeddings locales con `@huggingface/transformers` (`paraphrase-multilingual-MiniLM-L12-v2`), gratis y en CPU. La IA sugiere y el usuario confirma; nunca mueve nada sola.
- **Otros servicios:** Cloudinary (fotos de perfil), Web Push con VAPID.
- **Frontend:** Next.js, con un *rewrite* de `/api/*` al backend para servir todo desde un único dominio.
- Cualquier otra pieza se consulta antes de añadirla.

## Glosario

- **Nodex**: la unidad básica de contenido (una nota o un enlace). En plural, "Nodexs".
- **Grupo**: colección de Nodexs. Un Nodex puede estar en varios grupos.
- **Huérfano**: Nodex sin grupos activos. La IA puede sugerir a qué grupo moverlo.
- **Personalidades** (HU-12): apunte, enlace, tarea y recordatorio. Son combinables.
- **HU / RF / RNF**: Historia de Usuario / Requisito Funcional / Requisito No Funcional.

## Reglas de trabajo (obligatorias)

1. **Consultar antes de decidir.** Cualquier decisión notoria (stack, librerías, color, tipografía, posición de elementos, arquitectura, requisitos nuevos) se propone y se espera aprobación.
2. **Nada de pago sin preguntar.** Si algo cuesta dinero, se informa y no se implementa.
3. **Avanzar bloque por bloque:** base de datos ✅ → backend (casi terminado) → frontend → pruebas.
4. **Documentar y enseñar.** Cada rama deja explicado en `docs/` qué se hizo y por qué, a nivel de un junior.
5. **Git lo hace Jose.** Claude no hace commits, push ni pull requests: deja los cambios sin commitear y propone el mensaje de commit, el título y la descripción del PR. Crear o cambiar ramas locales sí está permitido.
6. **GitFlow:** `main` (versiones) ← `develop` (integración) ← `feature/*`. Cada rama sale de `develop` y vuelve con un PR. Commits con Conventional Commits en español: `feat(ámbito): …`.
7. **Código natural y sin comentarios.** Mínimo y directo, sin abstracciones innecesarias y sin ningún comentario. Las explicaciones van en el chat o en `docs/`. Usar la skill "simplificar-el-código-implementado".
8. **Usar las skills instaladas** para diseño, UX y buenas prácticas.

## Requisitos transversales

- Secretos solo en `.env` (en la raíz, fuera de Git; plantilla en `.env.example`). Nunca pedir ni mostrar sus valores: para comprobarlos, mirar solo los nombres o la longitud (`RNF-9.1`).
- Llamadas a servicios externos asíncronas y tolerantes a fallos: la caída de una API no puede tumbar la aplicación (`RNF-08`).
- Interfaz responsiva para móvil, tablet y escritorio (`RNF-07.4`), ajustada a los bocetos de Figma (`RNF-07.1`): pídelos al empezar el frontend.

## Cómo probar el backend

- `npm run dev` en `backend/` (puerto 4000). Abre una terminal nueva si cambias el `.env`.
- Para probar una rama: servidor en un puerto libre (4120–4140), usuarios de prueba con emails `@nodex.test`, y al terminar **borrarlos con sus sesiones y parar el servidor**.
- Las migraciones se generan con `prisma migrate diff` y se aplican con `npm run db:deploy` (detalles en `docs/08-base-de-datos.md`).
- Muchos archivos usan saltos de línea CRLF: respétalos al editar.
