# Plan de implementación

## Punto de partida

1. Entender los objetivos de la aplicación (ver [Objetivos](01-objetivos.md)): a qué usuarios afecta y en qué consiste.
2. Crear un plan personalizado que empiece por el análisis de los requisitos y de los que puedan surgir durante el proyecto.
3. Consultar cualquier decisión que afecte al proyecto de forma notoria antes de aplicarla.

## Forma de trabajar

- Cada requisito se implementa de la manera más humana y natural posible.
- El proyecto es conjunto: Claude escribe el grueso del código; Jose supervisa, aprende de lo implementado e implementa algunas partes.
- Todo el proceso se documenta: implementación, decisiones técnicas y funcionamiento de cada elemento, además de explicaciones de programación (lenguajes, frameworks, construcción de aplicaciones, flujos…).
- Se trabaja como un Desarrollador Fullstack senior, apoyándose en las skills instaladas para diseño e implementación.

## Orden por bloques

1. **Base de datos**: alojamiento en la nube, creación de tablas, claves, esquemas…
2. **Backend**: tecnologías, métodos, funciones, requisitos, conexiones con terceros…
3. **Frontend**: tecnologías, organización de elementos, diseño, color, usabilidad…
4. **Pruebas**: tests unitarios, de integración y end-to-end; comprobar que todo funciona.

## Hoja de ruta de funcionalidades

Orden acordado el 28/10/2026 para terminar la aplicación web. Cada punto se diseña y se aprueba antes de implementarlo.

1. **Pendiente de la hoja de ruta anterior**: personalidades en la interfaz (tareas, calendario, recordatorios y salud de enlaces, HU-12), perfil completo (HU-02), grupos nuevos con IA (`RF-04.3`) *Redescubre* (HU-20, hecho) y *Leer más tarde* (HU-21, hecho).
2. **Papelera** (HU-15, hecho).
3. **Resumen automático de enlaces** (`RF-05.10`).
4. **Importar y exportar** (HU-16).
5. **Guardar desde el navegador** (HU-18).
6. **Compartir grupos** (HU-19).
7. **Paleta de comandos** (HU-17).
8. **Interfaz en inglés** (`RNF-07.5`): al final, cuando ya no se añaden pantallas.
9. **Vista del Nodex** (HU-22): página con propiedades y Markdown y pestañas (`RF-22.5`) (hecho); después, dos paneles (`RF-22.6`).
10. **Modo demo** (HU-14): justo antes de alojar la aplicación, para que los datos de ejemplo enseñen todo.

Después: bloque de pruebas, alojamiento, PWA (`RF-05.6`, notificaciones push), aplicación de escritorio, APK y distribución.

## Repositorio y flujo Git

- Todo el proceso queda reflejado en este repositorio de GitHub, que será profesional y acabará siendo público.
- El README se ajusta a las skills instaladas para repositorios de GitHub.
- **No se hace push sin consultar.**
- Nunca se suben implementaciones directamente a `main`: una rama por implementación, integrada mediante pull request, como en un proyecto de empresa real.
