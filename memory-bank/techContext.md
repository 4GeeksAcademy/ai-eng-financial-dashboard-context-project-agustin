# Contexto tecnico

## Stack y estructura

- **Frontend:** React, TypeScript y Vite; Recharts dibuja los graficos. Entrada: `frontend/src/main.tsx`; pantalla y carga: `frontend/src/App.tsx`; tipos, calculos y pruebas: `frontend/src/lib/`; componentes: `frontend/src/components/dashboard/`. Dependencias y scripts: [package.json](../frontend/package.json).
- **Backend:** FastAPI y Pydantic, servido por Uvicorn. Aplicacion: `backend/app/main.py`; modelos, datos simulados y rutas: [routes.py](../backend/app/routes.py); pruebas: `backend/tests/`; dependencias: [requirements.txt](../backend/requirements.txt).
- **Contenedores:** [docker-compose.yml](../docker-compose.yml) define `frontend` (puerto 5173) y `backend` (8000 y 5678). No declara una base de datos.

## Ejecucion y pruebas

Desde la raiz, el README documenta:

```bash
docker compose up --build
```

Desde `frontend/`, los scripts disponibles son `npm run dev`, `npm test`, `npm run build`, `npm run lint`, `npm run test:watch` y `npm run test:coverage`, segun [package.json](../frontend/package.json). Desde `backend/`, ejecutar `pytest` para las pruebas de `tests/`.

Direcciones locales documentadas: frontend `http://localhost:5173`, API `http://localhost:8000`, documentacion `http://localhost:8000/docs`; la API tambien expone `/health`.

## Comunicacion

La pantalla [App.tsx](../frontend/src/App.tsx) carga facetas y movimientos; deriva KPI y series mensuales en frontend. El filtro opcional `start_date`/`end_date` se envía a movimientos y alertas. [BusinessComparisonPage](../frontend/src/components/dashboard/business-comparison-page.tsx) consulta facetas por negocio, top categorías y resumen mensual para calcular participaciones respecto al ingreso total del grupo. El backend genera 360 movimientos simulados por solicitud, ordenados por fecha; usa semilla `42`, pero asigna los años respecto a `date.today()`.

[Vite](../frontend/vite.config.ts) escucha en `0.0.0.0:5173` y reenvia `/api` a `http://172.18.0.1:8000` con `changeOrigin`. El archivo contiene un comentario indicando que se cambio el destino porque el anterior no cargaba el frontend. No sustituir este destino sin probar la conectividad desde el entorno previsto. Compose usa `depends_on` para ordenar el inicio, pero no declara una comprobacion de disponibilidad del backend.

`GET /api/metrics/facets` expone `min_date`/`max_date` y acepta `business_type` opcional para las categorías disponibles de cada grupo. `GET /api/metrics/alerts` limita `threshold` a `0.01..1.0`; para alertas mensuales completa huecos del rango con outcomes cero y compara con la media de los tres meses previos. No incluye historial fuera del rango.

## Verificacion

Las pruebas frontend/backend, lint y build se ejecutan con los comandos listados arriba; para validar integración comprobar `:5173`, `/health`, `/docs` y las rutas analíticas a través del proxy Vite. El proxy actual fue probado desde el contenedor frontend.
