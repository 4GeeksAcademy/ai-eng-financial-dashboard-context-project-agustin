import type { BusinessType, Category, OperationType } from '../src/lib/financial-types'

/**
 * Response from `GET /api/metrics/facets`.
 * Provides available filter options and the overall date range of the dataset.
 */
export interface FacetsResponse {
  /** All operation types present in the dataset. Values: `"income"` | `"outcome"`. */
  operation_types: OperationType[]
  /** All business types present in the dataset. Values: `"B2B"` | `"B2C"`. */
  business_types: BusinessType[]
  /** All categories present in the dataset. Values: `"suppliers"` | `"sales"` | `"operational"` | `"administrative"` | `"others"`. */
  categories: Category[]
  /** Earliest date among all movements. Format: `YYYY-MM-DD`. */
  min_date: string
  /** Latest date among all movements. Format: `YYYY-MM-DD`. */
  max_date: string
}

/**
 * A single anomaly alert entry from `GET /api/metrics/alerts`.
 * Represents a period where the outcome spiked above the configured threshold
 * compared to the rolling average of the previous three periods.
 */
export interface AlertEntry {
  /** Period identifier. For monthly grouping: `YYYY-MM`. */
  period: string
  /** Total outcome amount recorded for this period. */
  outcome_total: number
  /** Rolling average of outcomes from the previous three periods. */
  baseline_average: number
  /** Ratio of the increase: `(outcome_total - baseline_average) / baseline_average`. */
  increase_ratio: number
}

/** Array of anomaly alert entries. Empty when no anomalies are detected. */
export type AlertsResponse = AlertEntry[]

/**
 * A single top-category entry from `GET /api/metrics/categories/top`.
 * Represents aggregated totals for one category within a given operation type.
 */
export interface CategoryEntry {
  /** Category name. Values: `"suppliers"` | `"sales"` | `"operational"` | `"administrative"` | `"others"`. */
  category: Category
  /** Operation type. Values: `"income"` | `"outcome"`. */
  operation_type: OperationType
  /** Total aggregated amount for this category and operation type. */
  total_amount: number
}

/** Array of top category entries, ordered by `total_amount` descending. */
export type TopCategoriesResponse = CategoryEntry[]

/**
 * A single summary data point from `GET /api/metrics/summary`.
 * Represents aggregated income, outcome, and net for one time period.
 */
export interface MetricsSummaryEntry {
  /** Period identifier. Format depends on `group_by`: `YYYY-MM-DD` (day), `YYYY-Www` (week), `YYYY-MM` (month). */
  period: string
  /** Total income amount for this period. */
  income: number
  /** Total outcome amount for this period. */
  outcome: number
  /** Net value: `income - outcome`. */
  net: number
}

/** Array of summary data points, sorted chronologically by period. */
export type MetricsSummaryResponse = MetricsSummaryEntry[]