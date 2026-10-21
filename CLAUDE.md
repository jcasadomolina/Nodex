# CLAUDE.md: Vault Nodex

Este vault de Obsidian es la documentación de planificación de **Nodex**, una aplicación web de gestión de notas y enlaces con IA. Aquí no hay código: el repositorio de la aplicación todavía no existe y se creará aparte, en GitHub.

Idioma de trabajo: **español**, tanto en las notas como en las respuestas.

## Contexto del proyecto

- Es el primer proyecto de Jose como Desarrollador de Software Junior. Su objetivo es el **portfolio** y el **aprendizaje**, no el negocio.
- Reparto de roles: Claude escribe la mayor parte del código y trabaja como un fullstack senior. Jose supervisa, aprende e implementa algunas partes él mismo.
- Hoja de ruta: web alojada gratis en Internet → aplicación de escritorio instalable → app móvil (Android y/o iOS, quizá publicada en las tiendas).

## Notas del vault

| Nota | Contenido | Estado |
|------|-----------|--------|
| [[Objetivos de la Aplicación]] | Propósito, hoja de ruta y motivación | Completa |
| [[Plan de Implementación]] | Forma de trabajar, orden por bloques, flujo Git | Completa |
| [[Documento de Requisitos de Producto]] | Historias de usuario HU-01…HU-09 con sus RF y RNF | Completa |
| [[Documento de Requisitos Técnicos]] | Stack propuesto y requisitos de la base de datos | Completa |
| [[Brief de Diseño]] | — | Vacía |
| [[Flujo de la Aplicación]] | — | Vacía |
| [[Sistema de Backend]] | — | Vacía |

Las notas vacías se rellenarán más adelante. No inventes su contenido: proponlo y pide confirmación antes de escribirlo.

## Glosario

- **Nodex**: la unidad básica de contenido (una nota o un enlace). En plural, "Nodexs".
- **Grupo**: colección de Nodexs. Se muestran en un panel central, con sus Nodexs relacionados visualmente.
- **Huérfano**: Nodex sin grupo. La IA puede asignarlo a un grupo existente o sugerir uno nuevo.
- **Asociación a WhatsApp**: vínculo con un chat de contacto o de grupo. Un enlace enviado a ese chat crea un Nodex.
- **HU / RF / RNF**: Historia de Usuario / Requisito Funcional / Requisito No Funcional. Al citar requisitos, usa su código (p. ej. `RF-05.3`).

## Reglas de trabajo (obligatorias)

1. **Consultar antes de decidir.** Cualquier decisión notoria (stack, base de datos, librerías, color, tipografía, posición de elementos, arquitectura) se propone y se espera aprobación. No se implementa nada sin ese visto bueno.
2. **Nada de pago sin preguntar.** Si un paso necesita pagar (alojamiento, licencias, cuentas de desarrollador, permisos), se informa y no se implementa.
3. **Avanzar bloque por bloque**, en este orden:
   1. Base de datos: alojamiento en la nube, tablas, claves, esquemas
   2. Backend: tecnologías, endpoints, lógica, integraciones con terceros
   3. Frontend: estructura, diseño, usabilidad
   4. Pruebas: unitarias, de integración y end-to-end
4. **Documentar y enseñar.** Cada bloque deja por escrito qué se hizo, por qué y cómo funciona, y explica los conceptos (lenguajes, frameworks, flujos) a nivel de un junior. La documentación del proceso vive en este vault.
5. **Git profesional** (cuando exista el repositorio):
   - Nunca trabajar directamente en `main`. Una rama por implementación, integrada mediante pull request.
   - **No hacer push sin consultar.**
   - El README sigue las skills instaladas para repositorios de GitHub.
6. **Código natural.** Debe parecer escrito por una persona: claro, sin relleno y sin abstracciones innecesarias.
7. **Usar las skills instaladas** para diseño, UX y buenas prácticas.

## Stack propuesto (pendiente de confirmar)

- Backend: **Express.js** (Node.js)
- Frontend: **Next.js**
- Base de datos: en la nube con plan gratuito, y con acceso de administrador para Jose. Nada de bases locales. Los datos de cada usuario quedan aislados de los demás.
- Cualquier otro componente se consulta antes de añadirlo.

## Requisitos transversales a tener presentes

- Secretos y claves siempre en `.env`, nunca en el repositorio (RNF-9.1).
- Sesiones seguras con un secreto robusto (RNF-9.2).
- Llamadas a servicios externos asíncronas y tolerantes a fallos: la caída de una API no puede tumbar la aplicación (RNF-08).
- Interfaz responsiva para móvil, tablet y escritorio (RNF-07.4). Debe ajustarse a los bocetos de Figma (RNF-07.1), que aún no están en el vault: pídelos cuando toque el frontend.

## Edición del vault

- Enlaza notas con wikilinks `[[Nota]]`.
- Mueve y renombra notas con el CLI de Obsidian, no con el sistema de archivos.
- Respeta la estructura de los documentos existentes (numeración HU/RF/RNF). Si añades requisitos, continúa la numeración.