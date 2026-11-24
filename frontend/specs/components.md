# Component Specifications

## 1. `DateRangeFilterBar`

**File:** `src/components/dashboard/date-range-filter.tsx`

### Props

| Prop | Type | Description |
|---|---|---|
| `value` | `DateRangeFilter` | Current filter state (`start_date?`, `end_date?`). |
| `availableRange` | `FacetsResponse \| null` | Facets response providing `min_date` and `max_date`. `null` while loading. |
| `onChange` | `(value: DateRangeFilter) => void` | Called when the user picks a date. |

### Conditional rendering

| Condition | Behaviour |
|---|---|
| `start_date > end_date` | An error message "Start date must be on or before end date." is rendered in red below the inputs. The parent (`App`) still respects the range and shows an error on KPI/chart sections. |
| `availableRange === null` | The hint text shows "Loading available dates..." and inputs have no `min`/`max` constraints. |
| `availableRange !== null` | Hint text shows `"Available: {min_date} to {max_date}"`. Inputs get `min` and `max` attributes from the range. |
| Both dates empty | Dashboard shows all data. Clear-range button is disabled. |
| One date set | The missing bound is unbounded (API returns all data from that bound). |

### Behaviour

- Inputs are native `<input type="date">` elements.
- Clearing a date sets the value to `undefined` (via empty string → `undefined`).
- A reset button clears both dates when clicked (disabled when both are already empty).

---

## 2. `AlertsTable`

**File:** `src/components/dashboard/alerts-table.tsx`

### Props

| Prop | Type | Description |
|---|---|---|
| `alerts` | `AlertsResponse` | Array of anomaly entries from the API. Empty array when none found. |
| `loading` | `boolean` | Whether data is currently fetching. |
| `error` | `string \| null` | Error message to display. Takes precedence over `loading` and data. |
| `threshold` | `string` | Current threshold input value (as string to allow intermediate typing). |
| `onThresholdChange` | `(value: string) => void` | Called when the user changes the numeric threshold input. |

### Conditional rendering

| Priority | Condition | Renders |
|---|---|---|
| 1 (highest) | `error !== null` | Error message in red, centered. |
| 2 | `loading === true` | "Loading anomaly data..." centered. |
| 3 | `alerts.length === 0` | "No spending anomalies found for this date range and threshold." centered. |
| 4 | `alerts.length > 0` | Table with columns: Period, Recorded outcome, Previous 3-period average, Increase. |

### Columns

| Column | Data field | Format |
|---|---|---|
| Period | `alert.period` | Plain text (`YYYY-MM`). |
| Recorded outcome | `alert.outcome_total` | Currency (USD, no decimals). |
| Previous 3-period average | `alert.baseline_average` | Currency (USD, no decimals). |
| Increase | `alert.increase_ratio * 100` | Percentage with one decimal, rendered in red. |

### Threshold input

- Native `<input type="number">` with `min="0.01"`, `max="1"`, `step="0.01"`.
- The parent (`App`) validates the parsed value: must be a finite number between `0.01` and `1.0`.
- If validation fails, the parent passes a contextual error message: "Enter a threshold between 0.01 and 1.00."
- If the date range is invalid, the parent passes: "Correct the date range to see anomalies."

---

## 3. `BusinessComparisonPage`

**File:** `src/components/dashboard/business-comparison-page.tsx`

### Props

| Prop | Type | Description |
|---|---|---|
| `dateRange` | `DateRangeFilter` | Current date range filter to scope the comparison data. |
| `rangeValid` | `boolean` | Whether `start_date <= end_date` (or at least one is empty). |

### Data fetching (internal)

On mount and when `dateRange` changes (if `rangeValid` is true), the component fetches in parallel:

1. `GET /api/metrics/facets?business_type={B2B|B2C}` — to get available categories per business type.
2. `GET /api/metrics/categories/top?operation_type=income&limit=5&business_type={B2B|B2C}` — top 5 income categories.
3. `GET /api/metrics/summary?group_by=month&operation_type=income&business_type={B2B|B2C}` — total income per group.

This is done once for `B2B` and once for `B2C` using `Promise.all`.

### Conditional rendering

| Priority | Condition | Renders |
|---|---|---|
| 1 (highest) | `rangeValid === false` | "Start date must be on or before end date." in red. |
| 2 | `error !== null` | Error message in red, centered. |
| 3 | `loading === true` | "Loading comparison..." centered. |
| 4 | Data loaded | Two side-by-side panels + a comparison chart. |

### Sections

#### A. Category tables (two panels, side by side on `lg+` screens)

Each panel (`CategoryTable` sub-component) shows:

| Column | Data field | Format |
|---|---|---|
| Income category | `category.category` | Capitalized text. |
| Income | `category.totalAmount` | Currency (USD, no decimals). |
| Share of group | `category.sharePercent` | Percentage with one decimal. |

**Empty state:** When `group.categories.length === 0`, a single row with `colSpan={3}` shows "No income categories for this date range."

Below each table: "Total income: {currency}" for that business group.

#### B. Income comparison bar chart

- Single `BarChart` comparing total income of B2B vs B2C.
- X-axis: business type labels.
- Y-axis: formatted as `$Xk`.
- B2B bar uses CSS variable `--chart-income`, B2C uses `--chart-outcome`.
- **Empty state (no chart data):** "No income data for this date range." centered.

---

## 4. `DashboardHeader`

**File:** `src/components/dashboard/dashboard-header.tsx`

### Props

| Prop | Type | Description |
|---|---|---|
| `period` | `string` | Display string for the current period. Shows: `"{start_date} — {end_date}"` when filter is active, or the current year when no filter. |

Renders a title "Financial Dashboard" and a subtitle with the period.

---

## 5. `KPIRow`

**File:** `src/components/dashboard/kpi-row.tsx`

### Props

| Prop | Type | Description |
|---|---|---|
| `metrics` | `KPIMetrics \| null` | Computed KPI data (`totalIncome`, `totalOutcome`, `profit`, `profitPercent`). `null` when errored. |
| `loading` | `boolean` | Whether data is fetching. |

### Conditional rendering

| Condition | Renders |
|---|---|
| `loading === true` | Skeleton placeholders for all four KPI cards. |
| `metrics === null` | Nothing rendered (error is handled by parent). |
| `metrics !== null` | Four cards: Total Income, Total Outcome, Profit, Profit %. |

---

## 6. `IncomeOutcomeChart`

**File:** `src/components/dashboard/income-outcome-chart.tsx`

### Props

| Prop | Type | Description |
|---|---|---|
| `data` | `MonthlyDataPoint[]` | Monthly income/outcome data. Empty array when no data. |
| `loading` | `boolean` | Whether data is fetching. |

### Conditional rendering

| Condition | Renders |
|---|---|
| `loading === true` | Skeleton placeholder. |
| `data.length === 0` | "No data available for this period." centered. |
| `data.length > 0` | Bar chart with income and outcome series. |

---

## 7. `ProfitPercentChart`

**File:** `src/components/dashboard/profit-percent-chart.tsx`

### Props

| Prop | Type | Description |
|---|---|---|
| `data` | `MonthlyDataPoint[]` | Monthly profit percentage data. Empty array when no data. |
| `loading` | `boolean` | Whether data is fetching. |

### Conditional rendering

| Condition | Renders |
|---|---|
| `loading === true` | Skeleton placeholder. |
| `data.length === 0` | "No data available for this period." centered. |
| `data.length > 0` | Line chart with profit percentage series. |

---

## 8. `App` (root component)

**File:** `src/App.tsx`

### State

| State | Type | Description |
|---|---|---|
| `page` | `"overview" \| "comparison"` | Active dashboard view. |
| `dateRange` | `DateRangeFilter` | Current date range from filter. |
| `facets` | `FacetsResponse \| null` | Cached facets response. |
| `threshold` | `string` | Alert threshold as string (allows intermediate typing like `0.`). |
| `[metrics, monthlyData]` | computed | KPI and chart data derived from fetched movements. |

### Navigation

Two buttons at the top:
- **Overview** — shows KPIs, charts, and alerts table.
- **B2B vs B2C** — shows the business comparison page.

Active button has `bg-primary` styling; inactive has `bg-secondary`.