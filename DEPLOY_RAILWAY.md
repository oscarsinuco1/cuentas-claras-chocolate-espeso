# Deploy en Railway

## Paso 1: Sube a GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/cuentas-claras.git
git push -u origin main
```

## Paso 2: Crea proyecto en Railway
1. Ve a [railway.app](https://railway.app) y haz login con GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Selecciona tu repositorio

## Paso 3: Configura los servicios

### 3.1 Base de datos PostgreSQL
1. En el proyecto, click "New" → "Database" → "PostgreSQL"
2. Espera a que se cree

### 3.2 Redis
1. Click "New" → "Database" → "Redis"
2. Espera a que se cree

### 3.3 Backend
1. Click "New" → "GitHub Repo" → selecciona el mismo repo
2. En Settings:
   - **Root Directory**: `backend`
   - **Builder**: Dockerfile
3. En Variables, agrega (usa los valores de Reference de PostgreSQL y Redis):
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   PORT=3000
   NODE_ENV=production
   ```

### 3.4 Frontend
1. Click "New" → "GitHub Repo" → selecciona el mismo repo
2. En Settings:
   - **Root Directory**: `frontend`
   - **Builder**: Dockerfile
3. En Variables:
   ```
   VITE_API_URL=https://TU-BACKEND.up.railway.app
   VITE_WS_URL=https://TU-BACKEND.up.railway.app
   ```
   (Reemplaza con la URL real del backend después de desplegarlo)

## Paso 4: Genera dominios públicos
1. Click en cada servicio (backend y frontend)
2. Settings → Networking → "Generate Domain"

## Paso 5: Actualiza las variables del frontend
Una vez tengas la URL del backend, actualiza `VITE_API_URL` y `VITE_WS_URL` en las variables del frontend.

---

## Variables de entorno necesarias

### Backend
| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de PostgreSQL (automática con `${{Postgres.DATABASE_URL}}`) |
| `REDIS_URL` | URL de Redis (automática con `${{Redis.REDIS_URL}}`) |
| `PORT` | Puerto del servidor (3000) |
| `NODE_ENV` | `production` |

### Frontend
| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL pública del backend |
| `VITE_WS_URL` | URL pública del backend (para WebSocket) |

---

## Notas
- Railway free tier: $5 de créditos mensuales
- Los servicios se despliegan automáticamente con cada push a GitHub
- Las migraciones de Prisma se ejecutan automáticamente al iniciar el backend
