# Produccion Vendly

Este proyecto ya puede compilar frontend y cargar backend en modo produccion, pero no debe desplegarse reutilizando `backendv2/.env` local. Ese archivo contiene credenciales reales y hay que rotarlas antes de exponer el sistema.

## Arquitectura minima

- Frontend estatico desde `frontend/dist`
- Backend ASGI Django/Channels con `daphne`
- PostgreSQL
- Redis
- Celery worker
- Celery beat
- Proxy TLS delante de `/`, `/api/`, `/media/` y `/ws/`

## Variables

Usa estos archivos como base:

- `backendv2/.env.production.example`
- `frontend/.env.production.example`

Checklist obligatoria:

- Generar un `SECRET_KEY` nuevo y largo
- Usar un `DB_PASSWORD` real
- Definir `ALLOWED_HOSTS`, `FRONTEND_URL` y `CORS_ALLOWED_ORIGINS` con dominio final
- Rotar `OPENAI_API_KEY` si la clave local fue usada fuera de entorno seguro
- Definir `WHATSAPP_VERIFY_TOKEN` nuevo si vas a conectar Meta
- Desactivar SQLite, cache local y channel layer en memoria

## Build y validacion

Frontend:

```powershell
cd frontend
npm.cmd ci
npm.cmd run build
```

Backend:

```powershell
cd backendv2
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe manage.py check --deploy --settings=config.settings.production
.venv\Scripts\python.exe manage.py migrate --settings=config.settings.production
.venv\Scripts\python.exe manage.py collectstatic --noinput --settings=config.settings.production
```

## Procesos de produccion

Backend ASGI:

```powershell
.venv\Scripts\daphne.exe -b 0.0.0.0 -p 8000 config.asgi:application
```

Celery worker:

```powershell
.venv\Scripts\celery.exe -A tasks.celery_app worker -l info -Q ai,channels,campaigns
```

Celery beat:

```powershell
.venv\Scripts\celery.exe -A tasks.celery_app beat -l info
```

## Reverse proxy

El proxy debe hacer esto:

- `https://app.tudominio.com` sirve `frontend/dist`
- `https://api.tudominio.com/api/` proxya a Daphne
- `https://api.tudominio.com/ws/` proxya a Daphne con upgrade websocket
- `https://api.tudominio.com/health` expone healthcheck

## Estado actual del repo

Validado en esta sesion:

- `frontend`: `npm.cmd run build` pasa
- `backendv2`: `manage.py check --deploy --settings=config.settings.production` carga, pero mantiene advertencias de schema/documentacion y una advertencia de calidad sobre `SECRET_KEY`

## Antes de abrir trafico real

- Corregir o aceptar conscientemente las advertencias de `drf-spectacular`
- Configurar backups de Postgres
- Configurar monitoreo de logs/Sentry
- Verificar webhooks Meta desde dominio publico
- Probar takeover humano, realtime inbox y flows en entorno staging
