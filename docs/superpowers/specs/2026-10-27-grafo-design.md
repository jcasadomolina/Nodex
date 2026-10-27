# Diseño: vista gráfica (`/grafo`)

Fecha: 2026-10-27 · Rama: `feature/grafo` · Requisitos: `RF-04.4`, `RF-04.5` · Referencia: grafo de Obsidian (capturas de Jose)

## Qué se ve

- **Grupos:** nodos grandes con su nombre. **Nodexs:** nodos pequeños unidos a cada grupo al que pertenecen (si están en varios, quedan entre ellos). **Huérfanos:** sueltos, si el filtro lo permite. **Etiquetas:** nodos opcionales unidos a sus Nodexs.
- **Relacionados (opcional):** líneas discontinuas entre los Nodexs que la IA considera parecidos (los 3 más cercanos de cada uno con similitud ≥ 0,45), servidos por `GET /api/board/related`.
- Física con `d3-force` (atracción de las uniones, repulsión, colisión y centro), pintada en SVG. Zoom y desplazamiento con `d3-zoom` (rueda, arrastre y pellizco); los nodos se arrastran con el puntero.

## Panel de ajustes (derecha, plegable; en el móvil se abre con un botón)

| Sección | Contenido |
|---------|-----------|
| Filtros | Buscador (título y etiquetas); interruptores Etiquetas y Huérfanos |
| Grupos | Casillas para elegir qué grupos se ven (los nuevos aparecen marcados) |
| Colores | Reglas "consulta + color" con selector nativo; gana la primera que coincide. Consultas: `grupo:nombre`, `etiqueta:nombre`, `prioridad:alta`, `tipo:enlace` o una palabra del título o contenido |
| Mostrar | Flechas (hacia el grupo o la etiqueta), relacionados, tamaño de los nodos (0,5–2) y grosor de las líneas (0,1–2) |
| Exportar | SVG, PNG y JPEG de lo que se ve, con el fondo del tema |

Botón para restablecer. Los ajustes se guardan en `localStorage` (`nodex-graph`).

## Interacción

- Ordenador: al pasar el ratón por un Nodex se ve su tarjeta (solo lectura); al hacer clic se abre la ventana de edición de siempre.
- Móvil: al tocar un Nodex se ve su tarjeta con un botón "Abrir".
- Acceso desde la barra lateral (icono de red) y un paso nuevo en el tutorial.

## Fuera de alcance

Ajustes de fuerzas (Obsidian los tiene; aquí los valores son fijos), etiquetas de texto en todos los Nodexs (solo al pasar el ratón) y sincronizar los ajustes entre dispositivos.
