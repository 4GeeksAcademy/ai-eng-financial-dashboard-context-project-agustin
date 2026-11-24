# Verificacion de afirmaciones

| Afirmacion original | Archivos revisados | Resultado | Correccion |
|---|---|---|---|
| Los movimientos son reproducibles con la semilla `42`. | [routes.py](backend/app/routes.py), [test_routes.py](backend/tests/test_routes.py) | Parcial | La semilla fija los valores aleatorios, pero las fechas dependen de `date.today()`; la repetibilidad no se mantiene necesariamente entre años. |
| El periodo mostrado coincide con las fechas generadas. | [App.tsx](frontend/src/App.tsx), [routes.py](backend/app/routes.py) | Incorrecta | El encabezado fija `2024`; el generador calcula los años desde la fecha actual. Al 2026-10-12, asigna enero-septiembre a 2026 y octubre-diciembre a 2025. |
| El proxy puede comunicarse con el backend mediante Compose. | [vite.config.ts](frontend/vite.config.ts), [docker-compose.yml](docker-compose.yml) | Parcial | El destino `backend:8000` coincide con el servicio Compose, pero no se hizo una solicitud real. `depends_on` no espera a que la API esté lista. |
| La interfaz usa las rutas necesarias del backend. | [App.tsx](frontend/src/App.tsx), [routes.py](backend/app/routes.py) | Parcial | La pantalla principal solicita `/api/metrics`; no se observó que use las demás rutas. No se verificó si el producto requiere integrarlas. |
| Los cálculos financieros implementan las reglas esperadas. | [financial-utils.ts](frontend/src/lib/financial-utils.ts), [financial-utils.test.ts](frontend/src/lib/financial-utils.test.ts) | Parcial | El código calcula beneficio como ingresos menos gastos y margen como beneficio dividido por ingresos (0 si no hay ingresos). Las pruebas cubren esas fórmulas, pero no confirman que sean las reglas requeridas por el negocio. |

Las pruebas se revisaron en el código, pero no se ejecutaron.

---

## Verificación de especificaciones (2026-11-24)

### Fase 1 — Types: `frontend/specs/api-types.ts`

| Interfaz | Props verificadas contra OpenAPI | JSDoc agregado |
|---|---|---|
| `FacetsResponse` | ✅ `operation_types`, `business_types`, `categories`, `min_date`, `max_date` | ✅ |
| `AlertEntry` | ✅ `period`, `outcome_total`, `baseline_average`, `increase_ratio` | ✅ |
| `AlertsResponse` | ✅ `AlertEntry[]` | ✅ |
| `CategoryEntry` | ✅ `category`, `operation_type`, `total_amount` | ✅ |
| `TopCategoriesResponse` | ✅ `CategoryEntry[]` | ✅ |
| `MetricsSummaryEntry` | ✅ `period`, `income`, `outcome`, `net` | ✅ |
| `MetricsSummaryResponse` | ✅ `MetricsSummaryEntry[]` | ✅ |

### Fase 2 — Params: `frontend/specs/param-types.ts`

| Interfaz | Props verificadas contra OpenAPI | JSDoc agregado |
|---|---|---|
| `DateRangeFilter` | ✅ `start_date?`, `end_date?` como `string` con formato `YYYY-MM-DD` | ✅ |
| `AlertsParams` | ✅ Extiende `DateRangeFilter`. `threshold?`, `group_by?`, `business_type?` | ✅ |
| `TopCategoriesParams` | ✅ Extiende `DateRangeFilter`. `operation_type?`, `limit?`, `business_type?` | ✅ |
| `FacetsParams` | ✅ `business_type?` | ✅ |
| `MetricsSummaryParams` | ✅ Extiende `DateRangeFilter`. `group_by?`, `operation_type?`, `business_type?` | ✅ |

### Fase 3 — Component specs: `frontend/specs/components.md`

- ✅ `DateRangeFilterBar` — props, tipos, condicionales (rango inválido, loading, error, clear button)
- ✅ `AlertsTable` — props, empty state, threshold validation, error states, 4 columnas
- ✅ `BusinessComparisonPage` — props, loading state, empty top 5, chart empty state, date validation
- ✅ `KPIRow` — props con loading skeleton
- ✅ `IncomeOutcomeChart` — props, loading, empty data
- ✅ `ProfitPercentChart` — props, loading, empty data
- ✅ `DashboardHeader` — props
- ✅ `App` — state management, navigation

### Fase 4 — Data contract: `frontend/specs/README.md`

| Feature | Endpoints documentados | Tipos | Parámetros | Edge cases |
|---|---|---|---|---|
| Date range filter | ✅ `GET /api/metrics/facets`, `GET /api/metrics` | ✅ | ✅ | ✅ 4 edge cases |
| Anomaly alerts | ✅ `GET /api/metrics/alerts` | ✅ | ✅ | ✅ 5 edge cases |
| B2B vs B2C | ✅ `GET /api/metrics/categories/top`, `GET /api/metrics/facets`, `GET /api/metrics/summary` | ✅ | ✅ | ✅ 5 edge cases |

### Verificaciones ejecutadas

- ✅ `npx tsc --noEmit`: pasa sin errores.
- ✅ `npm test`: 8 tests pasan.
- ✅ `npm run lint`: pasa sin errores.