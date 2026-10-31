# Diseño: la primera vez en Nodex (inicio, bienvenida y tutorial)

Fecha: 2026-10-27 · Rama: `feature/bienvenida` · Requisitos: HU-10 (`RF-10.1`–`RF-10.4`), HU-07

## 1. Pantalla de inicio (`/login` y `/registro`)

Inspirada en la portada de Calendly (referencia de Jose):

- **Izquierda:** titular grande ("Tus notas y enlaces, conectados"), una frase de valor ("Guarda lo que encuentras y deja que la IA lo ordene por ti"), botones de Google y GitHub con sus logos, separador "o con tu correo" y el formulario. Mejoras: mostrar/ocultar contraseña y aviso "Mínimo 8 caracteres" en el registro.
- **Derecha (solo en `md` o más):** una ventana de la app que alterna 3 vistas con un fundido cada 4 s: panel con tarjetas, Nodex abierto con relacionados y búsqueda por significado. Se hace con los **componentes reales** (`NodexCard`, etc.) y datos de ejemplo, a escala reducida, con `aria-hidden` y sin interacción.
- **Fondo:** una gran mancha naranja (`#ffa247`) y encima una red de nodos y líneas en SVG que se mueve despacio y con poco contraste, como el logo. En el móvil se ve el fondo y se ocultan las vistas.
- Todo es CSS y SVG, sin dependencias nuevas, y se queda quieto con `prefers-reduced-motion`.

## 2. Bienvenida (`/bienvenida`)

- **Cuándo:** el layout `(app)` redirige a `/bienvenida` si `tutorialCompletedVersion < TUTORIAL_VERSION` (= 1), salvo que el tutorial ya esté en marcha (marca `nodex-tour` en `sessionStorage`). Cubre el registro con correo y el primer login con Google o GitHub, en cualquier dispositivo.
- **Pantalla completa** sin barra lateral, con el mismo fondo que el inicio. Un carrusel de 4 diapositivas con `scroll-snap` de CSS (deslizar en el móvil gratis), puntos de posición y Anterior/Siguiente (también con las flechas del teclado):
  1. Qué es Nodex (logo animado).
  2. Notas y enlaces con vista previa automática.
  3. La IA te ayuda: grupos sugeridos, búsqueda por significado, relacionados y duplicados.
  4. Tareas y recordatorios, y permisos: "Solo te pediremos permiso para enviarte notificaciones, y únicamente cuando crees tu primer recordatorio".
- La última muestra **"Entrar a Nodex"**: pone `nodex-tour` en `sessionStorage` y lleva a `/`.

## 3. Tutorial

- Arranca en el panel si existe `nodex-tour`. **7 pasos**, cada uno anclado a un elemento con `data-tour`: búsqueda, filtro de grupos, "+ Grupo", "Ordenar y filtrar", botón "+", vista Panel y Ajustes.
- **Bocadillo** con el Popover de shadcn (Radix, ya instalado): título, texto breve, "Paso n de 7", Anterior, Siguiente/Terminar y "Saltar tutorial". `Esc` lo salta. El elemento explicado se resalta con un contorno naranja.
- **Al terminar o saltar:** `PUT /api/me/tutorial { version: 1 }`, se actualiza `["me"]` y se borra la marca. Si se cierra a medias, se repite la próxima vez (no se completó).
- **Repetir** (`RF-10.3`): en Ajustes, "Ver la bienvenida otra vez" lleva a `/bienvenida`.

## Fuera de alcance

Novedades por versión (`RF-10.5`; el número de versión lo deja preparado), pedir el permiso de notificaciones (llega con la PWA) y vídeos o imágenes externas.

## Pruebas

Lint, tipos y build. En el navegador, con un usuario `@nodex.test` nuevo: registro → bienvenida → deslizar las 4 diapositivas → Entrar → los 7 pasos → Terminar → recargar no repite nada; Saltar también guarda; "Ver la bienvenida otra vez" lo repite; 375 px y modo oscuro; movimiento reducido.
