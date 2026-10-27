# Documentación de Nodex

Documentación de planificación que hay que tener presente al programar. El original vive en el vault de Obsidian del proyecto; esta copia acompaña al código para que cualquiera que abra el repositorio entienda qué se construye y por qué.

| Documento | Contenido | Estado |
|-----------|-----------|--------|
| [Objetivos de la aplicación](01-objetivos.md) | Propósito, hoja de ruta y motivación | Completo |
| [Plan de implementación](02-plan-de-implementacion.md) | Forma de trabajar, orden por bloques, flujo Git | Completo |
| [Requisitos de producto](03-requisitos-producto.md) | Historias de usuario HU-01…HU-09 con sus RF y RNF | Completo |
| [Requisitos técnicos](04-requisitos-tecnicos.md) | Stack propuesto y requisitos de la base de datos | Completo |
| [Flujo de la aplicación](05-flujo-de-la-aplicacion.md) | Pantallas y recorridos del usuario | Pendiente |
| [Sistema de backend](06-sistema-backend.md) | Stack, estructura del código y plan por ramas | En curso |
| [Brief de diseño](07-brief-de-diseno.md) | Estilo visual, color, tipografía, bocetos | Completo |
| [Base de datos](08-base-de-datos.md) | PostgreSQL en Neon, tablas, relaciones y reglas de evolución | Completo |
| [Frontend](09-frontend.md) | Stack, conexión con el backend, pantallas y estados | En curso |

## Glosario

- **Nodex**: la unidad básica de contenido (una nota o un enlace). En plural, "Nodexs".
- **Grupo**: colección de Nodexs. Se muestran en un panel central, con sus Nodexs relacionados visualmente. Un Nodex puede estar en varios grupos.
- **Huérfano**: Nodex sin grupo. La IA puede sugerir asignarlo a un grupo existente o crear uno nuevo; el usuario confirma.
- **Asociación a WhatsApp** *(ampliación futura)*: vínculo con WhatsApp para que un enlace enviado a Nodex cree un Nodex.
- **HU / RF / RNF**: Historia de Usuario / Requisito Funcional / Requisito No Funcional. Al citar requisitos se usa su código (p. ej. `RF-05.3`).
