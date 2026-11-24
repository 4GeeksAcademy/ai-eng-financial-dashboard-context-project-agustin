# Resumen del producto

## Hechos comprobables

Panel web de métricas financieras con frontend React/TypeScript y API FastAPI. El dashboard muestra cuatro KPI, gráficos mensuales, filtro opcional de fechas y fechas mínima/máxima disponibles, más una tabla de anomalías de gasto. La vista B2B vs B2C compara top cinco categorías de ingresos, participación sobre los ingresos completos de cada grupo y totales en un gráfico. [App.tsx](../frontend/src/App.tsx), [business-comparison-page.tsx](../frontend/src/components/dashboard/business-comparison-page.tsx), [alerts-table.tsx](../frontend/src/components/dashboard/alerts-table.tsx), [financial-utils.ts](../frontend/src/lib/financial-utils.ts)

El backend genera movimientos simulados; no se declara almacenamiento financiero persistente. Un movimiento contiene fecha, importe, tipo (`income`/`outcome`), categoría y tipo de negocio (`B2B`/`B2C`). El generador crea 360 movimientos y asigna sus años con base en la fecha actual. [routes.py](../backend/app/routes.py), [docker-compose.yml](../docker-compose.yml)

El filtro de fechas se comparte entre el resumen y la comparativa; las alertas usan un umbral configurable y comparan cada mes con la media de los tres meses anteriores dentro del rango. Los meses sin movimientos cuentan como gasto cero y una media previa cero no produce alerta. [routes.py](../backend/app/routes.py), [App.tsx](../frontend/src/App.tsx)

## Límites y aspectos no especificados

El encabezado muestra el año actual cuando no hay filtro; al filtrar muestra el rango seleccionado. Los datos siguen siendo simulados y su cobertura temporal depende de la fecha actual. [App.tsx](../frontend/src/App.tsx), [routes.py](../backend/app/routes.py)

El código revisado no especifica un perfil de usuario, datos reales de clientes, persistencia de transacciones ni una finalidad de producto más amplia que mostrar estas métricas. No describir esas cosas como funciones existentes.
