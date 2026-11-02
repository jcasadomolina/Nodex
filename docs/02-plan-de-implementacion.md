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

Orden acordado el 28/10/2026 para terminar la aplicación web. Cada punto se diseña y se aprueba antes de implementarlo. Estado revisado el 30/10/2026.

| # | Funcionalidad | Estado |
|---|---------------|--------|
| 1 | Personalidades en la interfaz (tareas, calendario, recordatorios y salud de enlaces, HU-12), perfil completo (HU-02), grupos nuevos con IA (`RF-04.3`), *Redescubre* (HU-20) y *Leer más tarde* (HU-21) | Hecho |
| 2 | **Papelera** (HU-15) | Hecho |
| 3 | **Resumen automático de enlaces** (`RF-05.10`) | Aplazado |
| 4 | **Importar y exportar** (HU-16) | Aplazado |
| 5 | **Guardar desde el navegador** (HU-18) | Aplazado |
| 6 | **Compartir grupos** (HU-19) | Aplazado |
| 7 | **Paleta de comandos** (HU-17) | Aplazado |
| 8 | **Interfaz en inglés** (`RNF-07.5`): al final, cuando ya no se añaden pantallas | Aplazado |
| 9 | **Vista del Nodex** (HU-22): página con propiedades y Markdown, pestañas (`RF-22.5`) y dos paneles (`RF-22.6`) | Hecho |
| 10 | **Modo demo** (HU-14): justo antes de alojar la aplicación, para que los datos de ejemplo enseñen todo | Hecho |

Los puntos 3 a 8 se aplazaron el 30/10/2026 para publicar antes una primera versión en el portfolio. Se retomarán después del alojamiento.

Después del modo demo:

| Paso | Estado |
|------|--------|
| PWA: instalable, página sin conexión, compartir enlaces (`RF-05.6`) y notificaciones push (`RF-12.7`) | Hecho (falta probarla en un móvil, con HTTPS) |
| Bloque de pruebas ([10-pruebas.md](10-pruebas.md)) | Hecho: unitarias, integración y end-to-end, con CI en cada PR |
| Alojamiento (Vercel + Render, [11-despliegue.md](11-despliegue.md)) | Cuentas creadas el 01/11/2026. Oracle Cloud se descartó por falta de capacidad ARM en la región |
| IA en el dispositivo ([diseño](disenos/2026-11-02-ia-en-el-dispositivo-design.md)) | Hecho en `feature/ia-en-el-dispositivo`: el modelo no cabía en los 512 MB de Render. Falta comprobarlo en producción |
| Aplicación de escritorio, APK y distribución | Pendiente |

## Estado de los requisitos

| Historia | Estado |
|----------|--------|
| HU-01 Gestión de usuarios | Hecho |
| HU-02 Perfil | Hecho, salvo `RF-02.5` (WhatsApp, ampliación futura) |
| HU-03 WhatsApp | Ampliación futura |
| HU-04 Grupos | Hecho |
| HU-05 Nodexs | Hecho `RF-05.1`, `05.2`, `05.6`–`05.9`. Pendientes `RF-05.4` y `RF-05.5` (la tabla `nodex_enrichments` existe, pero sin código) y `RF-05.10`. `RF-05.3` es ampliación futura |
| HU-10 Tutorial | Hecho |
| HU-11 Prioridad | Hecho |
| HU-12 Personalidades | Hecho |
| HU-13 Etiquetas | Hecho |
| HU-14 Modo demo | Hecho |
| HU-15 Papelera | Hecho |
| HU-16 a HU-19 | Aplazadas |
| HU-20 Redescubre | Hecho |
| HU-21 Leer más tarde | Hecho |
| HU-22 Vista del Nodex | Hecho |
| `RNF-07.5` Inglés | Aplazado |

## Repositorio y flujo Git

- Todo el proceso queda reflejado en este repositorio de GitHub, que será profesional y acabará siendo público.
- El README se ajusta a las skills instaladas para repositorios de GitHub.
- **No se hace push sin consultar.**
- Nunca se suben implementaciones directamente a `main`: una rama por implementación, integrada mediante pull request, como en un proyecto de empresa real.
