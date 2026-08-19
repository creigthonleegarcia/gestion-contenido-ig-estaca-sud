# 📱 Gestión de Contenido Instagram — Estaca La Serena

Sistema de gestión de contenido para Instagram de la Estaca La Serena, La Iglesia de Jesucristo de los Santos de los Últimos Días.

## Características

- 📊 **Dashboard** — Métricas, gráficos de alcance y motor de recomendaciones
- 📅 **Calendario Editorial** — Planificación mensual basada en 4 pilares estratégicos
- 📝 **Gestor de Contenido** — CRUD con upload de media y vista previa Instagram
- ✅ **Módulo de Aprobación** — Flujo Creador → Aprobador con comentarios
- 🏛️ **Pilares Estratégicos** — Inspiración, Información, Servicio, Historias
- 🤖 **Publicación Automática** — Scheduler + Meta Graph API
- 📋 **Checklist Normativo** — Verificación de contenido antes de publicar

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Vue 3 + Vite |
| Backend | Node.js + Express |
| Base de datos | SQLite (better-sqlite3) |
| Autenticación | JWT (2 roles) |
| Publicación | Meta Graph API v22.0 |
| Scheduler | node-cron |
| Diseño | Unity Design System (churchofjesuschrist.org) |

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Terminal 1: Servidor backend (API + DB + Scheduler)
npm run server

# Terminal 2: Frontend (Vite dev server)
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Cuentas de Demostración

| Rol | Email | Contraseña |
|---|---|---|
| 📝 Creador | `creador@estaca.cl` | `admin123` |
| ✅ Aprobador | `aprobador@estaca.cl` | `admin123` |

## Configurar Meta Graph API

1. Convertir cuenta de Instagram a Business/Creator
2. Vincular a una Facebook Page
3. Crear app en [Meta for Developers](https://developers.facebook.com/)
4. Obtener token con permisos: `instagram_basic`, `instagram_content_publish`
5. Crear archivo `.env` en la raíz:

```env
PORT=3001
JWT_SECRET=tu_secreto_jwt
META_ACCESS_TOKEN=tu_token_de_meta
IG_BUSINESS_ACCOUNT_ID=tu_ig_account_id
```

## Pilares Estratégicos

| Pilar | Día | Formato |
|---|---|---|
| 💙 Inspiración Doctrinal | Lunes | Gráfico / Carrusel |
| 📋 Información y Agenda | Viernes | Carrusel informativo |
| 🤝 SirveAhora / Servicio | Miércoles | Reel 15-30s |
| 📖 Historias y Pioneros | Sáb-Dom | Reel / Foto |

## Licencia

Proyecto interno de La Iglesia de Jesucristo de los Santos de los Últimos Días — Estaca La Serena.
