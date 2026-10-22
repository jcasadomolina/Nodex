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

### HU-03: Gestión de la asociación a WhatsApp *(ampliación futura)*

> Aplazada por la incertidumbre sobre los costes de la API de WhatsApp. El diseño previsto (un número único de Nodex al que cada usuario envía sus enlaces) está en [Base de datos](08-base-de-datos.md#ampliaciones-futuras).

- **RF-03.1**: El sistema debe asociarse a un chat de contacto o de grupo a través del número indicado por el usuario.
- **RF-03.2**: El sistema debe poder cerrar la asociación al número indicado en cualquier momento.

### HU-04: Gestión de Grupos

- **RF-04.1**: El sistema permitirá crear, editar y eliminar Grupos de Nodexs.
- **RF-04.2**: El sistema debe poder asignar, mediante IA, los enlaces y/o notas huérfanos a alguno de los grupos existentes.
- **RF-04.3**: El sistema debe poder recomendar, mediante IA, la creación de nuevos grupos para los enlaces y/o notas huérfanos.
- **RF-04.4**: El sistema debe mostrar todos los grupos del usuario en un panel central, con sus Nodexs visualmente relacionados con ellos.

### HU-05: Gestión de Nodexs

- **RF-05.1**: El sistema permitirá crear, editar y eliminar un Nodex.
- **RF-05.2**: El sistema permitirá asociar un Nodex a uno o varios Grupos existentes.
- **RF-05.3** *(ampliación futura)*: El sistema debe poder crear un Nodex a partir de un enlace enviado al chat de contacto o grupo de WhatsApp asociado al usuario.
- **RF-05.4**: El sistema debe poder mostrar, mediante IA, información de Internet sobre el contenido del Nodex creado.
- **RF-05.5**: El sistema debe poder recomendar, mediante IA, secciones o apartados sobre el contenido del Nodex creado.
- **RF-05.6**: El sistema debe permitir crear un Nodex compartiendo un enlace desde el menú Compartir del dispositivo, con la PWA instalada (fase 2 de la hoja de ruta).

### HU-10: Tutorial de bienvenida

> Añadida después de HU-09; por eso su número va tras los requisitos no funcionales.

- **RF-10.1**: El sistema debe mostrar un tutorial que explique Nodex y cómo navegar por él la primera vez que el usuario inicia sesión.
- **RF-10.2**: El sistema debe permitir saltar o cerrar el tutorial en cualquier momento.
- **RF-10.3**: El sistema debe permitir volver a ver el tutorial desde la aplicación.
- **RF-10.4**: El sistema debe recordar, por usuario y en cualquier dispositivo, si ya ha visto el tutorial.
- **RF-10.5**: El sistema debe mostrar las novedades cuando el tutorial se amplíe con funcionalidades nuevas.

## 2. Requisitos no funcionales

### HU-06: Rendimiento y optimización de datos

- **RNF-06.1**: El sistema deberá ser rápido al abrir, cerrar o cargar elementos.
- **RNF-06.2**: Los datos deben almacenarse de la manera más eficiente y óptima posible.

### HU-07: Usabilidad e interfaz de usuario

- **RNF-07.1**: La interfaz deberá ajustarse a los bocetos de Figma que se adjunten.
- **RNF-07.2**: Para conseguir una web usable se utilizarán las skills que se proporcionen.
- **RNF-07.3**: Cualquier decisión notoria (color, tipografía, ubicación de elementos…) se consultará antes de aplicar el cambio.
- **RNF-07.4**: La interfaz debe ser responsiva y adaptarse a móviles, tablets y monitores de escritorio.

### HU-08: Dependencias y APIs de terceros

- **RNF-08.1**: Las llamadas a servicios externos deben ser asíncronas para no bloquear el hilo principal del servidor.
- **RNF-08.2**: El sistema debe tolerar fallos de servicios externos: la caída de una API no puede provocar la caída total de la aplicación.

### HU-09: Seguridad y privacidad

- **RNF-9.1**: Las claves de APIs externas, los secretos de sesión y las credenciales de la base de datos deben guardarse en variables de entorno (`.env`) y nunca exponerse en el código fuente del repositorio.
- **RNF-9.2**: La gestión de sesiones debe ser segura, usando un middleware de sesión con una clave secreta robusta para evitar la manipulación de las cookies.
