# CLAUDE.md: Nodex

Instrucciones para Claude Code en este repositorio. **Nodex** es una aplicación web de notas y enlaces con IA: `backend/` (Express), `frontend/` (Next.js) y `docs/` (requisitos, decisiones y explicaciones).

Idioma de trabajo: **español**, en el código visible, la documentación y las respuestas.

## Contexto del proyecto

- Es el primer proyecto de Jose como Desarrollador de Software Junior. Su objetivo es el **portfolio** y el **aprendizaje**, no el negocio. El repositorio será público.
- Reparto de roles: Claude escribe la mayor parte del código y trabaja como un fullstack senior. Jose supervisa, aprende e implementa algunas partes él mismo.
- Hoja de ruta: web alojada gratis en Internet → PWA para móviles → app nativa (`.apk` y `.exe`, quizá publicada en las tiendas). WhatsApp (HU-03) queda como ampliación futura.
- El estado de cada requisito y el siguiente paso están en [docs/02-plan-de-implementacion.md](docs/02-plan-de-implementacion.md).

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [01-objetivos](docs/01-objetivos.md) | Propósito, hoja de ruta y motivación |
| [02-plan-de-implementacion](docs/02-plan-de-implementacion.md) | Forma de trabajar, hoja de ruta y estado de los requisitos |
| [03-requisitos-producto](docs/03-requisitos-producto.md) | Historias de usuario HU-01…HU-22 con sus RF y RNF |
| [04-requisitos-tecnicos](docs/04-requisitos-tecnicos.md) | Stack y requisitos de la base de datos |
| [05-flujo-de-la-aplicacion](docs/05-flujo-de-la-aplicacion.md) | Vacío: no inventes su contenido, proponlo y pide confirmación |
| [06-sistema-backend](docs/06-sistema-backend.md) | Cómo funciona cada parte del backend y por qué |
| [07-brief-de-diseno](docs/07-brief-de-diseno.md) | Estilo visual, color, tipografía y bocetos |
| [08-base-de-datos](docs/08-base-de-datos.md) | Tablas, relaciones y reglas para cambiar el esquema |
| [09-frontend](docs/09-frontend.md) | Cómo funciona cada pantalla y por qué |
| `docs/disenos/` y `docs/planes/` | Diseño aprobado y plan de cada rama. Los nuevos se guardan aquí con el formato `AAAA-MM-DD-tema-design.md` y `AAAA-MM-DD-tema.md` |

## Glosario

- **Nodex**: la unidad básica de contenido (una nota o un enlace). En plural, "Nodexs".
- **Grupo**: colección de Nodexs. Un Nodex puede estar en varios grupos.
- **Huérfano**: Nodex sin grupo. La IA puede asignarlo a un grupo existente o sugerir uno nuevo.
- **Personalidad**: lo que añade funciones a un Nodex (enlace, tarea, recordatorio).
- **HU / RF / RNF**: Historia de Usuario / Requisito Funcional / Requisito No Funcional. Al citar requisitos, usa su código (p. ej. `RF-05.3`).

## Reglas de trabajo (obligatorias)

1. **Consultar antes de decidir.** Cualquier decisión notoria (stack, librerías, color, tipografía, posición de elementos, arquitectura, requisitos nuevos) se propone y se espera aprobación. No se implementa nada sin ese visto bueno.
2. **Nada de pago sin preguntar.** Si un paso necesita pagar (alojamiento, licencias, cuentas de desarrollador, permisos), se informa y no se implementa.
3. **Documentar y enseñar.** Cada rama deja en `docs/` qué se hizo, por qué y cómo funciona, explicado a nivel de un junior.
4. **Git lo hace Jose.** Claude no hace commits, push ni PR. Crea la rama, deja los cambios sin commitear y propone título y descripción del commit y del PR.
5. **GitFlow.** `main` (versiones) ← `develop` (integración) ← `feature/*` y `docs/*`. Cada rama sale de `origin/develop` con `--no-track` y vuelve por pull request. Commits con Conventional Commits en español: `feat(ámbito): …`.
6. **Código natural y sin comentarios.** Claro, mínimo y sin abstracciones innecesarias. Las explicaciones van en el chat o en `docs/`.
7. **Usar las skills instaladas** para diseño, UX y buenas prácticas.
8. **Requisitos:** respeta la numeración HU/RF/RNF. Si añades requisitos, continúala (la última historia es HU-22).

## Requisitos transversales

- Secretos y claves siempre en `.env` (en la raíz), nunca en el repositorio ni en el chat (`RNF-9.1`).
- Sesiones seguras con un secreto robusto (`RNF-9.2`).
- Llamadas a servicios externos asíncronas y tolerantes a fallos: la caída de una API no puede tumbar la aplicación (`RNF-08`).
- Interfaz responsiva para móvil, tablet y escritorio (`RNF-07.4`), según los [bocetos](docs/bocetos/bocetos-v1.jpg) (`RNF-07.1`).
- Los datos de cada usuario quedan aislados de los demás.
