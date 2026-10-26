# Frontend

Interfaz web de Nodex en Next.js 16, TypeScript, Tailwind CSS y shadcn/ui. Cómo funciona y por qué: [docs/09-frontend.md](../docs/09-frontend.md).

## Puesta en marcha

1. Arranca el backend (`npm run dev` en `backend/`, puerto 4000).
2. Comprueba que el `.env` de la raíz tiene `APP_URL="http://localhost:3000"`.
3. Instala y arranca el frontend:

   ```bash
   npm install
   npm run dev
   ```

4. Abre `http://localhost:3000`.

Las llamadas a `/api/*` se reenvían al backend. Si no está en `http://localhost:4000`, indica otra dirección con la variable `BACKEND_URL`.

## Scripts

| Script | Qué hace |
|--------|----------|
| `npm run dev` | Servidor de desarrollo en el puerto 3000 |
| `npm run build` | Compila para producción |
| `npm run start` | Sirve la versión compilada en el puerto 3000 |
| `npm run lint` | Revisa el código con ESLint |
| `npm run typecheck` | Genera los tipos de las rutas y comprueba TypeScript |

## Rutas

| Ruta | Pantalla |
|------|----------|
| `/login`, `/registro` | Inicio de sesión y registro |
| `/` | Panel de Nodexs |
| `/nodexs/[id]` | Panel con un Nodex abierto |
| `/perfil` | Perfil (provisional) |
