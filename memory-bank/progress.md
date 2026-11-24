# Progreso del proyecto

## Funcionalidades

- El dashboard comparte un filtro opcional de fechas, carga fechas disponibles desde facetas, actualiza KPI/gráficos y muestra el año actual cuando el filtro está vacío. [App.tsx](../frontend/src/App.tsx), [date-range-filter.tsx](../frontend/src/components/dashboard/date-range-filter.tsx)
- La tabla de alertas permite umbral `0.01..1.0` (default `0.3`); las alertas mensuales usan tres períodos previos dentro del rango, meses vacíos con outcome cero y omiten la comparación cuando la media es cero. [routes.py](../backend/app/routes.py), [alerts-table.tsx](../frontend/src/components/dashboard/alerts-table.tsx)
- La vista B2B/B2C presenta top cinco categorías de ingresos con proporción sobre el ingreso completo del grupo y un gráfico de totales. [business-comparison-page.tsx](../frontend/src/components/dashboard/business-comparison-page.tsx)
- Los movimientos continúan siendo simulados; no hay almacenamiento financiero persistente. [routes.py](../backend/app/routes.py), [docker-compose.yml](../docker-compose.yml)

## Verificaciones Ejecutadas (2026-10-13)

- `docker compose run --rm --no-deps frontend npm test`: 8 pruebas pasan.
- `docker compose run --rm --no-deps frontend npm run build`: pasa; Vite advierte que el bundle JS supera 500 kB.
- `docker compose run --rm --no-deps frontend npm run lint`: pasa.
- `docker compose run --rm --no-deps backend pytest -q`: 21 pruebas pasan; queda una advertencia de deprecación de Starlette TestClient.
- `docker compose up -d --build frontend backend`: servicios iniciados. `curl` obtuvo HTTP 200 en `:5173` y las rutas de facetas B2B, alertas y top categorías B2C respondieron mediante el proxy Vite. Se abrió `http://localhost:5173`; no se verificó visualmente el render.
