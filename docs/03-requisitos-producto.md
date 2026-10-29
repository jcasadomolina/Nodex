# Documento de Requisitos de Producto

## 1. Requisitos funcionales

### HU-01: Gestión de usuarios

- **RF-01.1**: El sistema debe proporcionar un formulario de registro que solicite nombre, email y contraseña.
- **RF-01.2**: El sistema debe permitir registrarse mediante servicios de terceros, como Google OAuth o GitHub.
- **RF-01.3**: El sistema debe validar el formato del email introducido y verificar que no exista previamente en la base de datos.
- **RF-01.4**: El sistema debe cifrar y guardar de forma segura en la base de datos los datos personales sensibles, como la contraseña del usuario.
- **RF-01.5**: El sistema debe permitir al usuario iniciar sesión comparando las credenciales introducidas con las almacenadas.
- **RF-01.6**: El sistema debe permitir al usuario cerrar sesión, guardando sus datos en la base de datos.
- **RF-01.7**: El sistema debe permitir volver a iniciar sesión y mostrar todos los datos del usuario si la cerró previamente.

### HU-02: Gestión del perfil

- **RF-02.1**: El sistema debe mostrar una pantalla de perfil solo a los usuarios autenticados.
- **RF-02.2**: El sistema debe permitir modificar el nombre de usuario.
- **RF-02.3**: El sistema debe permitir modificar la imagen de perfil del usuario.
- **RF-02.4**: El sistema debe mostrar el correo electrónico del usuario en la pantalla de perfil.
- **RF-02.5** *(ampliación futura)*: El sistema debe permitir modificar la sesión al número de WhatsApp asociado.
- **RF-02.6**: El sistema debe permitir vincular una cuenta de Google o GitHub al usuario autenticado, para poder iniciar sesión con cualquiera de ellas.
- **RF-02.7**: El sistema debe permitir desvincular una cuenta de Google o GitHub, siempre que el usuario conserve al menos un método de inicio de sesión.

### HU-03: Gestión de la asociación a WhatsApp *(ampliación futura)*

> Aplazada por la incertidumbre sobre los costes de la API de WhatsApp. El diseño previsto (un número único de Nodex al que cada usuario envía sus enlaces) está en [Base de datos](08-base-de-datos.md#ampliaciones-futuras).

- **RF-03.1**: El sistema debe asociarse a un chat de contacto o de grupo a través del número indicado por el usuario.
- **RF-03.2**: El sistema debe poder cerrar la asociación al número indicado en cualquier momento.

### HU-04: Gestión de Grupos

- **RF-04.1**: El sistema permitirá crear, editar y eliminar Grupos de Nodexs.
- **RF-04.2**: El sistema debe poder asignar, mediante IA, los enlaces y/o notas huérfanos a alguno de los grupos existentes.
- **RF-04.3**: El sistema debe poder recomendar, mediante IA, la creación de nuevos grupos para los enlaces y/o notas huérfanos.
- **RF-04.4**: El sistema debe mostrar todos los grupos del usuario en un panel central, con sus Nodexs visualmente relacionados con ellos.
- **RF-04.5**: El sistema debe poder colocar los Nodexs en un mapa visual según el parecido de su contenido, de modo que los temas cercanos aparezcan juntos.

### HU-05: Gestión de Nodexs

- **RF-05.1**: El sistema permitirá crear, editar y eliminar un Nodex.
- **RF-05.2**: El sistema permitirá asociar un Nodex a uno o varios Grupos existentes.
- **RF-05.3** *(ampliación futura)*: El sistema debe poder crear un Nodex a partir de un enlace enviado al chat de contacto o grupo de WhatsApp asociado al usuario.
- **RF-05.4**: El sistema debe poder mostrar, mediante IA, información de Internet sobre el contenido del Nodex creado.
- **RF-05.5**: El sistema debe poder recomendar, mediante IA, secciones o apartados sobre el contenido del Nodex creado.
- **RF-05.6**: El sistema debe permitir crear un Nodex compartiendo un enlace desde el menú Compartir del dispositivo, con la PWA instalada (fase 2 de la hoja de ruta).
- **RF-05.7**: El sistema debe permitir buscar Nodexs por significado, aunque no compartan palabras con la búsqueda.
- **RF-05.8**: El sistema debe mostrar, al abrir un Nodex, otros Nodexs relacionados con su contenido.
- **RF-05.9**: El sistema debe avisar cuando un Nodex nuevo sea igual o casi igual a otro ya guardado.
- **RF-05.10**: El sistema debe mostrar en los Nodexs con enlace un resumen automático de unas 3 frases del contenido de la página, elegidas con los embeddings que ya usa la aplicación (sin LLM de pago).

### HU-10: Tutorial de bienvenida

> Añadida después de HU-09; por eso su número va tras los requisitos no funcionales.

- **RF-10.1**: El sistema debe mostrar un tutorial que explique Nodex y cómo navegar por él la primera vez que el usuario inicia sesión.
- **RF-10.2**: El sistema debe permitir saltar o cerrar el tutorial en cualquier momento.
- **RF-10.3**: El sistema debe permitir volver a ver el tutorial desde la aplicación.
- **RF-10.4**: El sistema debe recordar, por usuario y en cualquier dispositivo, si ya ha visto el tutorial.
- **RF-10.5**: El sistema debe mostrar las novedades cuando el tutorial se amplíe con funcionalidades nuevas.

### HU-11: Prioridad de los Nodexs

> La prioridad es subjetiva: indica cuándo quiere el usuario ocuparse de un Nodex, no qué tipo de Nodex es.

- **RF-11.1**: El sistema debe permitir asignar a cada Nodex una prioridad: urgente (hoy, ya), alta (esta semana), media (pronto) o baja (cuando tenga tiempo). Por defecto, un Nodex no tiene prioridad.
- **RF-11.2**: El sistema debe permitir cambiar o quitar la prioridad en cualquier momento.
- **RF-11.3**: El sistema debe permitir ordenar y filtrar los Nodexs por prioridad, y mostrar primero los más prioritarios donde tenga sentido.

### HU-12: Personalidades de los Nodexs

> Una personalidad añade un comportamiento a un Nodex. Un mismo Nodex puede tener varias a la vez: por ejemplo, la matrícula de la universidad puede ser un enlace, una tarea con fecha de hoy y un recordatorio a las 17:00.

- **RF-12.1**: El sistema debe permitir añadir y quitar personalidades a un Nodex, de forma independiente y combinable.
- **RF-12.2** *(apunte)*: Un Nodex sin otras personalidades es un apunte de texto.
- **RF-12.3** *(enlace)*: Un Nodex con URL debe mostrar una vista previa del enlace (título, descripción e imagen de la página).
- **RF-12.4** *(tarea)*: El sistema debe permitir convertir un Nodex en tarea, con fecha límite opcional y un estado: pendiente, en curso o hecha.
- **RF-12.5** *(tarea)*: El sistema debe mostrar las tareas en un calendario según su fecha límite.
- **RF-12.6** *(tarea)*: El sistema debe mostrar las tareas en un tablero de tres columnas (pendiente, en curso y hecha) y permitir moverlas entre columnas.
- **RF-12.7** *(recordatorio)*: El sistema debe permitir programar un recordatorio en un Nodex y enviar una notificación push cuando llegue la hora.

### HU-13: Etiquetas de los Nodexs

> Una etiqueta es una palabra libre (`#cocina`, `#urgente-trabajo`) que el usuario pone a sus Nodexs. A diferencia de los grupos, no se gestionan aparte: existen mientras algún Nodex las use.

- **RF-13.1**: El sistema debe permitir añadir y quitar etiquetas a un Nodex al crearlo o editarlo (máximo 10 por Nodex).
- **RF-13.2**: El sistema debe normalizar las etiquetas: minúsculas, sin espacios (se sustituyen por guiones) y de 30 caracteres como máximo.
- **RF-13.3**: El sistema debe sugerir las etiquetas que el usuario ya usa mientras escribe una.
- **RF-13.4**: El sistema debe mostrar las etiquetas en las tarjetas y permitir encontrar los Nodexs por etiqueta en la búsqueda.

### HU-14: Modo demo

> Pensado para el portfolio: quien visite la aplicación debe poder probarla sin registrarse.

- **RF-14.1**: El sistema debe ofrecer en la portada un botón "Probar sin registrarse" que inicie sesión en una cuenta temporal nueva.
- **RF-14.2**: La cuenta temporal debe incluir grupos, Nodexs y etiquetas de ejemplo que muestren las funciones principales (IA, grafo, prioridades).
- **RF-14.3**: El sistema debe mostrar un aviso visible de que se está en modo demo y ofrecer crear una cuenta de verdad.
- **RF-14.4**: El sistema debe borrar las cuentas temporales y todos sus datos 24 horas después de crearlas.

### HU-15: Papelera

- **RF-15.1**: El sistema debe mostrar los Nodexs y grupos borrados en una papelera.
- **RF-15.2**: El sistema debe permitir restaurar un elemento de la papelera, con sus etiquetas y sus grupos.
- **RF-15.3**: El sistema debe permitir vaciar la papelera, previa confirmación.
- **RF-15.4**: El sistema debe borrar definitivamente los elementos que lleven más de 30 días en la papelera.

### HU-16: Importar y exportar

- **RF-16.1**: El sistema debe permitir importar los marcadores exportados desde el navegador (archivo HTML): cada carpeta se convierte en un grupo y cada marcador en un Nodex con enlace.
- **RF-16.2**: El sistema debe permitir exportar todos los datos del usuario a JSON y a Markdown (un archivo `.md` por Nodex, dentro de un `.zip`).
- **RF-16.3**: El sistema debe permitir importar un JSON exportado desde Nodex.
- **RF-16.4**: El sistema debe mostrar el progreso de una importación y avisar de los elementos que no se hayan podido importar o que ya existían.

### HU-17: Paleta de comandos

- **RF-17.1**: El sistema debe abrir con `Ctrl+K` (`Cmd+K` en Mac) un buscador global que encuentre Nodexs y grupos.
- **RF-17.2**: La paleta debe permitir lanzar acciones: crear un Nodex, ir al grafo, abrir un grupo y abrir los ajustes.
- **RF-17.3**: La paleta debe manejarse por completo con el teclado.

### HU-18: Guardar desde el navegador

- **RF-18.1**: El sistema debe ofrecer un *bookmarklet* "Guardar en Nodex" que se instale arrastrándolo a la barra de marcadores.
- **RF-18.2**: Al pulsarlo en cualquier web, debe abrir una ventana de Nodex con el título y la URL de la página ya rellenados, para guardarla como Nodex.

### HU-19: Compartir grupos

- **RF-19.1**: El sistema debe permitir generar un enlace público de solo lectura para un grupo.
- **RF-19.2**: Quien abra el enlace debe ver los Nodexs del grupo sin necesidad de cuenta y sin poder modificarlos.
- **RF-19.3**: El sistema debe permitir desactivar el enlace o generar uno nuevo, que invalida el anterior.

### HU-20: Redescubre

> Lo que se guarda y no se vuelve a mirar se pierde. Redescubre recupera cada día algunos Nodexs olvidados.

- **RF-20.1**: El sistema debe registrar cuándo abre el usuario cada Nodex.
- **RF-20.2**: El sistema debe mostrar cada día en el panel hasta 3 Nodexs que el usuario no abre desde hace 30 días o más, sin contar los de prioridad alta o urgente.
- **RF-20.3**: El sistema debe dar preferencia a los Nodexs olvidados que se parezcan a lo que el usuario ha abierto en los últimos 7 días.
- **RF-20.4**: El sistema debe permitir ocultar la sección hasta el día siguiente.

## 2. Requisitos no funcionales

### HU-06: Rendimiento y optimización de datos

- **RNF-06.1**: El sistema deberá ser rápido al abrir, cerrar o cargar elementos.
- **RNF-06.2**: Los datos deben almacenarse de la manera más eficiente y óptima posible.

### HU-07: Usabilidad e interfaz de usuario

- **RNF-07.1**: La interfaz deberá ajustarse a los bocetos de Figma que se adjunten.
- **RNF-07.2**: Para conseguir una web usable se utilizarán las skills que se proporcionen.
- **RNF-07.3**: Cualquier decisión notoria (color, tipografía, ubicación de elementos…) se consultará antes de aplicar el cambio.
- **RNF-07.4**: La interfaz debe ser responsiva y adaptarse a móviles, tablets y monitores de escritorio.
- **RNF-07.5**: La interfaz debe estar disponible en español e inglés, con el idioma elegido en los ajustes.

### HU-08: Dependencias y APIs de terceros

- **RNF-08.1**: Las llamadas a servicios externos deben ser asíncronas para no bloquear el hilo principal del servidor.
- **RNF-08.2**: El sistema debe tolerar fallos de servicios externos: la caída de una API no puede provocar la caída total de la aplicación.

### HU-09: Seguridad y privacidad

- **RNF-9.1**: Las claves de APIs externas, los secretos de sesión y las credenciales de la base de datos deben guardarse en variables de entorno (`.env`) y nunca exponerse en el código fuente del repositorio.
- **RNF-9.2**: La gestión de sesiones debe ser segura, usando un middleware de sesión con una clave secreta robusta para evitar la manipulación de las cookies.
