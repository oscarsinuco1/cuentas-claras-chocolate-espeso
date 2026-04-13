# 🍫 Cuentas Claras Chocolate Espeso

> Divide gastos de forma rápida y sencilla - Como Kahoot pero para cuentas

## 📋 Características

- **Códigos compartibles**: Crea un plan y comparte el código único
- **Tiempo real**: Todos ven los cambios instantáneamente sin recargar
- **Ultra rápido**: UI optimizada para ingresar gastos velozmente
- **Historial completo**: Cada cambio queda registrado
- **Links de pago**: Cada integrante puede agregar su link de Nequi/Daviplata/etc.
- **Cálculo automático**: Algoritmo optimizado para minimizar transferencias

## 🚀 Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | React + Vite + Tailwind | Máxima velocidad de desarrollo y runtime |
| Backend | Fastify (Node.js) | 3x más rápido que Express |
| Base de Datos | PostgreSQL | Robusta + historial con triggers |
| Cache/Pub-Sub | Redis | WebSockets + caché en memoria |
| Tiempo Real | Socket.io | Sincronización instantánea |
| Contenedores | Docker Compose | Fácil despliegue |

## 📦 Inicio Rápido

```bash
# Clonar y arrancar con Docker
git clone <repo>
cd cuentas-claras-chocolate-espeso
docker compose up -d

# Acceder a:
# - Frontend: http://localhost:5173
# - Backend:  http://localhost:3000
# - Docs API: http://localhost:3000/docs
```

## 🛠️ Desarrollo Local

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

## 🧪 Tests

```bash
# Backend - Unit + Integration
cd backend && npm test

# Frontend - Unit + Integration
cd frontend && npm test

# E2E
cd frontend && npm run test:e2e
```

## 📱 Flujo de Uso

1. **Crear Plan**: Genera un código único (ej: `CHOCO-A1B2`)
2. **Compartir**: Los participantes entran con el código
3. **Agregar Gastos**: Interfaz rápida de un solo tap
4. **Ver en Tiempo Real**: Todos ven los cambios al instante
5. **Calcular**: Un botón para ver quién paga a quién
6. **Pagar**: Links directos de pago por persona

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│   React + Vite + Tailwind + Socket.io-client                │
└─────────────────────────┬───────────────────────────────────┘
                          │ WebSocket + REST
┌─────────────────────────▼───────────────────────────────────┐
│                         BACKEND                              │
│   Fastify + Socket.io + Prisma                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
   ┌─────────────┐                 ┌─────────────┐
   │ PostgreSQL  │                 │    Redis    │
   │  (datos +   │                 │  (pub/sub + │
   │  historial) │                 │   cache)    │
   └─────────────┘                 └─────────────┘
```

## 🚢 Despliegue

### Railway/Render/Fly.io
Cada servicio tiene su Dockerfile listo para desplegar.

### Variables de Entorno

```env
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret
CORS_ORIGIN=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## 📄 Licencia

MIT
