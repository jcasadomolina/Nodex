import type { PRIORITIES } from "../nodexs/nodexs.schemas.js";
import type { TaskStatus } from "../tasks/tasks.schemas.js";

export type DemoNodex = {
  title: string;
  content?: string;
  url?: string;
  groups: string[];
  tags?: string[];
  priority?: (typeof PRIORITIES)[number];
  readLater?: boolean;
  ageDays?: number;
  task?: { status: TaskStatus; dueInDays?: number };
  remindInHours?: number;
};

export const DEMO_GROUPS = [
  { name: "JavaScript", description: "El lenguaje de la web, de lo básico a lo asíncrono" },
  { name: "Bases de datos", description: "SQL, PostgreSQL y cómo diseñar tablas" },
  { name: "Git y GitHub", description: "Control de versiones y trabajo en equipo" },
  { name: "Buscar trabajo", description: "Portfolio, CV y entrevistas técnicas" },
];

export const DEMO_NODEXS: DemoNodex[] = [
  {
    title: "Guía de JavaScript de MDN",
    url: "https://developer.mozilla.org/es/docs/Web/JavaScript/Guide",
    groups: ["JavaScript"],
    tags: ["documentacion"],
    priority: "medium",
  },
  {
    title: "Closures: funciones que recuerdan",
    content:
      "Una **closure** es una función que recuerda las variables del sitio donde se creó, aunque ese sitio ya haya terminado.\n\n```js\nfunction contador() {\n  let n = 0;\n  return () => ++n;\n}\nconst siguiente = contador();\nsiguiente(); // 1\nsiguiente(); // 2\n```\n\nSirve para guardar estado privado sin clases.",
    groups: ["JavaScript"],
    tags: ["conceptos", "funciones"],
  },
  {
    title: "Closures en MDN",
    url: "https://developer.mozilla.org/es/docs/Web/JavaScript/Closures",
    groups: ["JavaScript"],
    tags: ["funciones"],
    ageDays: 45,
  },
  {
    title: "El tutorial moderno de JavaScript",
    url: "https://javascript.info/",
    groups: ["JavaScript"],
    tags: ["curso"],
    readLater: true,
  },
  {
    title: "let, const y var",
    content:
      "- `const`: no se puede reasignar. Úsala por defecto.\n- `let`: se puede reasignar y vive solo dentro de su bloque `{ }`.\n- `var`: vive en toda la función y se \"eleva\". Mejor no usarla.",
    groups: ["JavaScript"],
    tags: ["conceptos"],
    ageDays: 60,
  },
  {
    title: "Métodos de arrays que uso siempre",
    content:
      "| Método | Para qué |\n|--------|----------|\n| `map` | Transformar cada elemento |\n| `filter` | Quedarse con algunos |\n| `find` | El primero que cumple algo |\n| `reduce` | Juntarlos en un solo valor |\n\nNinguno cambia el array original.",
    groups: ["JavaScript"],
    tags: ["arrays", "chuleta"],
    priority: "low",
  },
  {
    title: "Promesas y async/await",
    content:
      "Una **promesa** es un valor que llegará más tarde. Con `async/await` el código asíncrono se lee como si fuera normal:\n\n```js\nasync function cargar() {\n  const res = await fetch(\"/api/nodexs\");\n  return res.json();\n}\n```\n\nLos errores se capturan con `try/catch`.",
    groups: [],
    tags: ["asincronia"],
    priority: "high",
  },
  {
    title: "Tutorial de PostgreSQL",
    url: "https://www.postgresql.org/docs/current/tutorial.html",
    groups: ["Bases de datos"],
    tags: ["documentacion", "postgresql"],
  },
  {
    title: "Los JOIN explicados",
    content:
      "- `INNER JOIN`: solo las filas que tienen pareja en las dos tablas.\n- `LEFT JOIN`: todas las de la izquierda, con o sin pareja.\n\n```sql\nSELECT u.name, g.name\nFROM users u\nLEFT JOIN groups g ON g.user_id = u.id;\n```",
    groups: ["Bases de datos"],
    tags: ["sql", "chuleta"],
    priority: "medium",
  },
  {
    title: "Practicar consultas con JOIN",
    content: "Hacer los ejercicios de JOIN con la base de ejemplo de PostgreSQL.\n\n- [x] INNER JOIN\n- [ ] LEFT JOIN\n- [ ] Consultas con GROUP BY",
    groups: ["Bases de datos"],
    tags: ["sql", "practica"],
    priority: "high",
    task: { status: "todo", dueInDays: 2 },
  },
  {
    title: "Normalizar una base de datos",
    content:
      "Normalizar es repartir los datos en tablas para no repetirlos.\n\n1. Cada columna guarda un solo valor.\n2. Cada dato depende de la clave completa.\n3. Nada depende de otra columna que no sea la clave.",
    groups: ["Bases de datos"],
    tags: ["diseno"],
    ageDays: 38,
  },
  {
    title: "Índices en SQL: Use The Index, Luke",
    url: "https://use-the-index-luke.com/es",
    groups: [],
    tags: ["sql", "rendimiento"],
    readLater: true,
  },
  {
    title: "Pro Git, el libro oficial",
    url: "https://git-scm.com/book/es/v2",
    groups: ["Git y GitHub"],
    tags: ["documentacion", "libro"],
  },
  {
    title: "Aprender ramas jugando",
    url: "https://learngitbranching.js.org/?locale=es_ES",
    groups: ["Git y GitHub"],
    tags: ["practica", "ramas"],
  },
  {
    title: "Comandos de Git del día a día",
    content:
      "```bash\ngit switch -c feature/nueva   # rama nueva\ngit add .\ngit commit -m \"feat: ...\"\ngit push -u origin feature/nueva\n```\n\nY luego un pull request hacia `develop`.",
    groups: ["Git y GitHub"],
    tags: ["chuleta", "ramas"],
    priority: "medium",
  },
  {
    title: "Conventional Commits",
    url: "https://www.conventionalcommits.org/es/v1.0.0/",
    groups: ["Git y GitHub"],
    tags: ["buenas-practicas"],
  },
  {
    title: "Terminar el curso de Git",
    groups: ["Git y GitHub"],
    tags: ["curso"],
    task: { status: "done", dueInDays: -1 },
  },
  {
    title: "Resolver conflictos de merge",
    content:
      "Un conflicto aparece cuando dos ramas cambian las mismas líneas. Git marca el trozo con `<<<<<<<`, `=======` y `>>>>>>>`.\n\nSe elige qué queda, se borran las marcas y se hace commit.",
    groups: [],
    tags: ["ramas"],
  },
  {
    title: "Preparar el portfolio en GitHub",
    content: "- [x] Subir Nodex con un buen README\n- [ ] Fijar los 3 mejores repositorios\n- [ ] Añadir una foto y una bio al perfil",
    groups: ["Buscar trabajo"],
    tags: ["portfolio"],
    priority: "urgent",
    task: { status: "doing", dueInDays: 3 },
  },
  {
    title: "Enviar 5 candidaturas esta semana",
    groups: ["Buscar trabajo"],
    tags: ["candidaturas"],
    priority: "high",
    task: { status: "todo", dueInDays: 6 },
    remindInHours: 20,
  },
  {
    title: "Roadmap de frontend",
    url: "https://roadmap.sh/frontend",
    groups: ["Buscar trabajo"],
    tags: ["aprendizaje"],
  },
  {
    title: "Preguntas típicas de entrevista junior",
    content:
      "- Diferencia entre `==` y `===`\n- Qué es una API REST\n- Qué pasa cuando escribes una URL en el navegador\n- Un proyecto del que estés orgulloso y por qué",
    groups: ["Buscar trabajo"],
    tags: ["entrevistas"],
    ageDays: 33,
  },
  {
    title: "Flexbox: conceptos básicos",
    url: "https://developer.mozilla.org/es/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox",
    groups: [],
    tags: ["css", "maquetacion"],
  },
  {
    title: "Guía completa de CSS Grid",
    url: "https://css-tricks.com/snippets/css/complete-guide-grid/",
    groups: [],
    tags: ["css", "maquetacion"],
  },
  {
    title: "Centrar un div en CSS",
    content:
      "La forma más corta con Flexbox:\n\n```css\n.padre {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n```\n\nCon Grid: `display: grid; place-items: center;`",
    groups: [],
    tags: ["css", "chuleta"],
  },
  {
    title: "Unidades en CSS: px, rem y %",
    content:
      "- `px`: tamaño fijo.\n- `rem`: relativo al tamaño de letra de la página. Respeta el zoom del usuario.\n- `%`: relativo al elemento padre.\n\nPara textos y márgenes en CSS, mejor `rem`.",
    groups: [],
    tags: ["css"],
  },
];
