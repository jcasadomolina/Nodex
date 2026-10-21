# Sistema de backend

API de Nodex: recibe las peticiones del frontend, aplica la lógica y habla con la base de datos ([Base de datos](08-base-de-datos.md)).

## Stack (aprobado)

| Necesidad | Elección | Por qué |
|-----------|----------|---------|
| Servidor | **Express 5** | Framework acordado. La versión 5 captura sola los errores de las funciones `async` |
| Lenguaje | **TypeScript** | Los errores aparecen al escribir el código, no al ejecutarlo |
| Ejecución en desarrollo | **tsx** | Ejecuta el `.ts` directamente y recarga al guardar |
| Acceso a datos | **Prisma 7** + **@prisma/adapter-pg** | Adaptador con el driver estándar de PostgreSQL, adecuado para un servidor siempre encendido |
| Sesiones (`RNF-9.2`) | **express-session** + **connect-pg-simple** | La sesión se guarda en la tabla `sessions`; la cookie solo lleva un ID firmado |
| Contraseñas (`RF-01.4`) | **argon2** | Algoritmo recomendado por OWASP |
| Google y GitHub (`RF-01.2`) | **Passport.js** | Estándar en Express; un plugin por proveedor |
| Validación | **Zod** | Comprueba cada petición y genera los tipos de TypeScript |
| Seguridad | **helmet** y límite de intentos en el login | Cabeceras HTTP seguras y freno a ataques de fuerza bruta |

## Estructura

```
backend/src/
├── app.ts              ← crea Express y conecta middlewares y rutas
├── server.ts           ← arranca el servidor
├── config/env.ts       ← lee y valida el .env (si falta una variable, no arranca)
├── lib/prisma.ts       ← una única conexión a la base
├── middleware/         ← requireAuth, gestión de errores…
└── modules/            ← una carpeta por funcionalidad: rutas, validación y lógica
    ├── auth/
    ├── groups/
    └── nodexs/
```

Una funcionalidad nueva es una carpeta nueva en `modules/`, sin tocar las demás.

## Plan por ramas

Cada rama sale de `develop` y vuelve a `develop` con un pull request.

| Rama | Contenido | Requisitos |
|------|-----------|------------|
| `feature/backend-base` | Express, TypeScript, conexión a Prisma, validación del `.env`, gestión de errores y endpoint `/health` | — |
| `feature/auth` | Registro, login, logout y sesiones | `RF-01.1`, `RF-01.3`–`RF-01.7` |
| `feature/oauth` | Login con Google y GitHub | `RF-01.2` |
| `feature/grupos-nodexs` | CRUD de grupos y Nodexs, y asignación de Nodexs a grupos | `RF-04.1`, `RF-04.4`, `RF-05.1`, `RF-05.2` |
| `feature/perfil` | Pantalla de perfil: nombre e imagen | HU-02 |
| `feature/ia` | Sugerencias de grupo y enriquecimiento | `RF-04.2`, `RF-04.3`, `RF-05.4`, `RF-05.5` |

## Pendiente de decidir

- **Proveedor de IA** (en `feature/ia`). Candidato propuesto por Jose: **Kev**, modelos de decisión open source y entrenables. Hay que resolver dónde se ejecuta, porque necesita una GPU o un Mac.
- **Alojamiento del backend** (antes de publicar). La idea es que el navegador solo vea un dominio: Next.js reenvía las llamadas `/api/*` al backend, y así las cookies de sesión funcionan sin configuración entre dominios.
- **Almacenamiento de imágenes** (en `feature/perfil`).
