# Brief de diseño

Cómo se ve y cómo se siente Nodex. Las decisiones de color, tipografía y ubicación de elementos se consultan antes de aplicarse (`RNF-07.3`). Detalles técnicos de cada pieza en [Frontend](09-frontend.md).

Requisitos relacionados: HU-07 en [Requisitos de producto](03-requisitos-producto.md).

## Bocetos

Los bocetos de Figma (`RNF-07.1`) están en [`bocetos/bocetos-v1.jpg`](bocetos/bocetos-v1.jpg). Interpretación aprobada:

| Boceto | Pantalla |
|--------|----------|
| 1 | Login y registro: fondo degradado naranja, tarjeta con el formulario y, a su lado, un carrusel o detalle de la aplicación |
| 2 | Panel principal: barra lateral con los iconos de cada vista (la activa, marcada) y barra superior en forma de píldora que indica dónde estás |
| 3 | Grafo de Nodexs, con un panel de ajustes del grafo a la derecha, al estilo del grafo de Obsidian |
| 4 | Icono del grafo; sirve también de pantalla de carga |
| 5 | Ajustes de la aplicación en una ventana con el fondo difuminado, al estilo de Claude |

## Estilo

- **Personalidad:** cercana y ordenada. Formas redondeadas (píldoras y tarjetas), mucho aire y un solo color de acento.
- **Modo claro y oscuro**, más la opción de seguir al sistema.
- **Responsivo** (`RNF-07.4`): en el móvil, la barra lateral pasa a ser una barra inferior.

## Color (aprobado)

| Token | Claro | Oscuro |
|-------|-------|--------|
| Principal (`--primary`) | `#ffa247` | `#ffa247` |
| Texto sobre el principal | `#1f1f1f` | `#1f1f1f` |
| Fondo (`--background`) | `#ffffff` | `#1f1f1f` |
| Tarjetas (`--card`) | `#ffffff` | `#2b2b2b` |
| Grises | Neutros | Neutros |

Se descartaron una variante con fondo crema y otra con grises azulados.

## Tipografía (aprobada)

**Nunito**, de Google Fonts: sus terminaciones redondeadas repiten las formas de los bocetos y se lee bien en textos largos. Se descartaron Geist y Outfit.

## Logo (aprobado)

Un nodo central grande con seis satélites de distintos tamaños, dentro de un cuadrado naranja con las esquinas redondeadas.

- **Estático:** barra lateral y favicon.
- **Animado:** pantallas de carga y pantalla de inicio. El nodo central aparece con un leve rebote; los satélites, uno a uno desde el inferior y en el sentido de las agujas del reloj; después desaparecen en el mismo orden. Se queda quieto si el sistema pide reducir el movimiento.

## Patrones de interfaz

| Patrón | Decisión |
|--------|----------|
| Nodexs en el panel | Tarjetas de distintas alturas en columnas, como Google Keep |
| Grupos | Etiquetas que filtran la rejilla (Todos, Huérfanos y los grupos) |
| Crear y editar | Botón flotante "+" y ventana con el fondo difuminado |
| Cargas | Una rueda que gira, nunca esqueletos grises |
| Errores | Mensaje del servidor junto al campo o en un aviso breve; nunca se pierde lo escrito |
