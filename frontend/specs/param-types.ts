import type { BusinessType, OperationType } from '../src/lib/financial-types'

/**
 * Optional date range filter sent to multiple API endpoints.
 * When both fields are empty/undefined, the API returns all available data.
 */
export interface DateRangeFilter {
  /** Start date inclusive. Format: `YYYY-MM-DD`. Optional — when omitted the range is unbounded from the past. */
  start_date?: string
  /** End date inclusive. Format: `YYYY-MM-DD`. Optional — when omitted the range is unbounded into the future. */
  end_date?: string
}

/**
 * Query parameters for `GET /api/metrics/alerts`.
 * Extends `DateRangeFilter` so anomalies can be scoped to a specific period.
 */
export interface AlertsParams extends DateRangeFilter {
  /** Spike threshold ratio. Valid range: `0.01` to `1.0`. Default: `0.3`. Values outside this range are rejected by the API. */
  threshold?: number
  /** Grouping granularity for the anomaly detection. Values: `"day"` | `"week"` | `"month"`. Default: `"month"`. */
  group_by?: 'day' | 'week' | 'month'
  /** Optional business type filter. Values: `"B2B"` | `"B2C"`. When omitted, includes both. */
  business_type?: BusinessType
}

/**
 * Query parameters for `GET /api/metrics/categories/top`.
 * Extends `DateRangeFilter` so top categories can be scoped to a specific period.
 */
export interface TopCategoriesParams extends DateRangeFilter {
  /** Operation type to aggregate. Values: `"income"` | `"outcome"`. Default: `"outcome"`. */
  operation_type?: OperationType
  /** Maximum number of top categories to return. Valid range: `1` to `20`. Default: `5`. */
  limit?: number
  /** Optional business type filter. Values: `"B2B"` | `"B2C"`. When omitted, includes both. */
  business_type?: BusinessType
}

/**
 * Query parameters for `GET /api/metrics/facets`.
 */
export interface FacetsParams {
  /** Optional business type filter. Values: `"B2B"` | `"B2C"`. When provided, categories are scoped to movements of that business type. */
  business_type?: BusinessType
}

/**
 * Query parameters for `GET /api/metrics/summary`.
 * Extends `DateRangeFilter` to scope the summary to a specific period.
 */
export interface MetricsSummaryParams extends DateRangeFilter {
  /** Grouping granularity. Values: `"day"` | `"week"` | `"month"`. Default: `"month"`. */
  group_by?: 'day' | 'week' | 'month'
  /** Optional operation type filter. Values: `"income"` | `"outcome"`. When omitted, includes both. */
  operation_type?: OperationType
  /** Optional business type filter. Values: `"B2B"` | `"B2C"`. When omitted, includes both. */
  business_type?: BusinessType
}