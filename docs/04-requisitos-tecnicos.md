# Documento de Requisitos Técnicos

El stack debe estar formado por tecnologías modernas, robustas y eficientes. No hay un stack cerrado: la elección de backend, frontend, diseño y tipo de base de datos se propone y **se consulta antes de implementarse**.

## Stack propuesto (pendiente de confirmar)

| Capa | Propuesta |
|------|-----------|
| Backend | Express.js (Node.js) |
| Frontend | Next.js |
| Base de datos | **PostgreSQL en Neon** (plan gratuito) con Prisma. Aprobado: ver [Base de datos](08-base-de-datos.md) |

Cualquier otro componente del stack se consulta antes de añadirlo.

## Requisitos de la base de datos

- **Alojada en la nube y gratuita.** La web se publicará en Internet y necesita guardar los datos de los usuarios en un servidor.
- **Nada de bases locales.** No vale que el usuario descargue la base de datos y lo guarde todo en su dispositivo, ni que el administrador o el propio usuario tengan que mantener un servidor local encendido.
- **Acceso de administrador.** Jose debe tener permisos para controlar lo que sucede en la base de datos.
- **Datos aislados por usuario.** Un usuario A no puede ver, conocer ni interactuar con los Nodexs, enlaces o datos de un usuario B.

Ver también: [Requisitos de producto](03-requisitos-producto.md), [Sistema de backend](06-sistema-backend.md) y [Base de datos](08-base-de-datos.md).
