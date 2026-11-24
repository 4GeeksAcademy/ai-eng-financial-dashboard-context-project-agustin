# Data Contract — Financial Dashboard

## Overview

This document specifies the frontend data contract for three features:
1. Date range filter on the home dashboard
2. Anomaly alerts table
3. B2B vs B2C comparison view

All endpoints are served by the FastAPI backend running at `http://localhost:8000` (proxied via Vite at `/api`).

---

## Feature 1 — Date Range Filter

### Endpoints consumed

| Endpoint | Purpose |
|---|---|
| `GET /api/metrics/facets` | Retrieve available date range (`min_date`, `max_date`) to display as reference. |
| `GET /api/metrics` | Retrieve filtered movements. Accepts `start_date` and `end_date` query params. |

### Types

**Request params** (`param-types.ts` — `DateRangeFilter`):

```typescript
interface DateRangeFilter {
  /** Start date inclusive. Format: YYYY-MM-DD. Optional. */
  start_date?: string
  /** End date inclusive. Format: YYYY-MM-DD. Optional. */
  end_date?: string
}
```

**Response** (`api-types.ts` — `FacetsResponse`):

```typescript
interface FacetsResponse {
  operation_types: OperationType[]  // "income" | "outcome"
  business_types: BusinessType[]    // "B2B" | "B2C"
  categories: Category[]            // "suppliers" | "sales" | "operational" | "administrative" | "others"
  min_date: string                  // YYYY-MM-DD
  max_date: string                  // YYYY-MM-DD
}
```

### Parameter constraints

| Parameter | Type | Required | Default | Valid values |
|---|---|---|---|---|
| `start_date` | `string` | No | — | `YYYY-MM-DD` format. Must be ≤ `end_date` if both provided. |
| `end_date` | `string` | No | — | `YYYY-MM-DD` format. Must be ≥ `start_date` if both provided. |

### Edge cases

| Edge case | UI behaviour |
|---|---|
| **start_date > end_date** | The `DateRangeFilterBar` shows "Start date must be on or before end date." in red. The parent `App` does not fetch data and shows "Correct the date range to see anomalies." on the alerts table. KPI/chart sections display an error. |
| **Both dates empty** | Dashboard shows all available data. The header displays the current year (e.g., "2026"). The `DateRangeFilterBar` shows the full available range as a hint. |
| **Only one date set** | `GET /api/metrics` receives only the set parameter; the API returns all movements from that bound. The header shows `"{date} — {max_date}"` or `"{min_date} — {date}"` accordingly. |
| **Facets endpoint fails** | `DateRangeFilterBar` sets an error state: "Unable to load the available date range." Inputs have no `min`/`max` constraints. |

---

## Feature 2 — Anomaly Alerts Table

### Endpoint consumed

| Endpoint | Purpose |
|---|---|
| `GET /api/metrics/alerts` | Retrieve outcome anomaly alerts. Accepts threshold, date range, group_by, and business_type. |

### Types

**Request params** (`param-types.ts` — `AlertsParams`):

```typescript
interface AlertsParams extends DateRangeFilter {
  threshold?: number    // 0.01 to 1.0. Default: 0.3
  group_by?: 'day' | 'week' | 'month'  // Default: "month"
  business_type?: BusinessType  // "B2B" | "B2C". Optional.
}
```

**Response** (`api-types.ts` — `AlertsResponse`):

```typescript
type AlertsResponse = AlertEntry[]

interface AlertEntry {
  period: string          // e.g. "2026-03" for monthly
  outcome_total: number   // Recorded outcome amount
  baseline_average: number // Rolling average of previous 3 periods
  increase_ratio: number  // (outcome_total - baseline) / baseline
}
```

### Parameter constraints

| Parameter | Type | Required | Default | Valid values |
|---|---|---|---|---|
| `threshold` | `number` | No | `0.3` | `0.01` to `1.0` (API returns 422 outside range) |
| `group_by` | `string` | No | `"month"` | `"day"` \| `"week"` \| `"month"` |
| `start_date` | `string` | No | — | `YYYY-MM-DD` |
| `end_date` | `string` | No | — | `YYYY-MM-DD` |
| `business_type` | `string` | No | — | `"B2B"` \| `"B2C"` |

### Alert detection logic (backend)

- Groups movements by month (`YYYY-MM`).
- For each month from index 3 onwards, computes the rolling average of the previous 3 months' outcomes.
- If `baseline_average === 0`, the comparison is skipped (no alert generated).
- An alert is generated when `(recorded - baseline) / baseline > threshold`.

### Edge cases

| Edge case | UI behaviour |
|---|---|
| **No anomalies for current threshold** | The table area shows "No spending anomalies found for this date range and threshold." centred, in muted text. The table header and rows are not rendered. |
| **Threshold is outside 0.01-1.0 range** | The parent `App` prevents the API call. The `AlertsTable` receives an error string: "Enter a threshold between 0.01 and 1.00." shown in red. |
| **All outcomes are zero (zero baseline)** | The backend skips those comparisons. No alert is generated for those periods. The UI shows the empty state message. |
| **Date range has fewer than 4 months** | No data passes the sliding window check (needs 3 previous periods + current). The table shows the empty state. |
| **API call fails** | An error message "Unable to load anomaly data." is shown in red within the `AlertsTable` card. |

---

## Feature 3 — B2B vs B2C Comparison View

### Endpoints consumed

| Endpoint | Purpose |
|---|---|
| `GET /api/metrics/categories/top?operation_type=income&limit=5` | Top 5 income categories per business line. Accepts `business_type`, `start_date`, `end_date`. |
| `GET /api/metrics/facets` | Available categories per business type (used to validate category names). |
| `GET /api/metrics/summary?group_by=month&operation_type=income` | Total income per month for a business line, used to compute group total income. |

### Types

**Request params** (`param-types.ts` — `TopCategoriesParams`):

```typescript
interface TopCategoriesParams extends DateRangeFilter {
  operation_type?: OperationType  // "income" | "outcome". Default: "outcome"
  limit?: number                  // 1 to 20. Default: 5
  business_type?: BusinessType    // "B2B" | "B2C". Optional.
}
```

**Response** (`api-types.ts` — `TopCategoriesResponse`):

```typescript
type TopCategoriesResponse = CategoryEntry[]

interface CategoryEntry {
  category: Category       // "suppliers" | "sales" | "operational" | "administrative" | "others"
  operation_type: OperationType  // "income" | "outcome"
  total_amount: number     // Aggregated total
}
```

### Data flow

For each business type (`B2B`, `B2C`), the `BusinessComparisonPage` fetches in parallel:

1. `GET /api/metrics/facets?business_type={type}` — to get valid categories for that business type.
2. `GET /api/metrics/categories/top?operation_type=income&limit=5&business_type={type}&start_date=...&end_date=...`
3. `GET /api/metrics/summary?group_by=month&operation_type=income&business_type={type}&start_date=...&end_date=...`

The category entries are mapped to `CategoryShare[]` by filtering against the facets categories and computing `sharePercent` as `(entry.total_amount / groupIncome) * 100`.

### Parameter constraints

| Parameter | Type | Required | Default | Valid values |
|---|---|---|---|---|
| `operation_type` | `string` | No | `"outcome"` | `"income"` \| `"outcome"` |
| `limit` | `integer` | No | `5` | `1` to `20` |
| `start_date` | `string` | No | — | `YYYY-MM-DD` |
| `end_date` | `string` | No | — | `YYYY-MM-DD` |
| `business_type` | `string` | No | — | `"B2B"` \| `"B2C"` |

### Edge cases

| Edge case | UI behaviour |
|---|---|
| **No income categories for the date range** | The category table shows one row with `colSpan={3}`: "No income categories for this date range.", centered in muted text. |
| **No income data at all for the date range** | The comparison chart area shows "No income data for this date range.", centered in muted text. The chart is not rendered. |
| **Invalid date range (start > end)** | The component returns early with "Start date must be on or before end date." in red. No API calls are made. |
| **One business line has data but the other doesn't** | The panel with data renders normally. The empty panel shows the empty-table message. The chart still renders with the available data point. |
| **API call fails** | An error message "Unable to load the B2B and B2C comparison." is shown centred in red. |

---

## General API notes

- All monetary values are in USD, returned as `number` (float).
- Dates are always in `YYYY-MM-DD` format (ISO 8601).
- Period identifiers follow the convention: `YYYY-MM` for monthly, `YYYY-Www` for weekly, `YYYY-MM-DD` for daily.
- The backend uses a seeded random generator (`seed=42`) for mock data. Data is deterministic within the same calendar year but depends on `date.today()`.
- The API is served under the `/api` prefix and proxied by Vite during development.