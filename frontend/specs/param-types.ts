import type { BusinessType, OperationType } from '../src/lib/financial-types'

export interface DateRangeFilter {
  start_date?: string
  end_date?: string
}

export interface AlertsParams extends DateRangeFilter {
  threshold?: number
  group_by?: 'day' | 'week' | 'month'
  business_type?: BusinessType
}

export interface TopCategoriesParams extends DateRangeFilter {
  operation_type?: OperationType
  limit?: number
  business_type?: BusinessType
}

export interface FacetsParams {
  business_type?: BusinessType
}

export interface MetricsSummaryParams extends DateRangeFilter {
  group_by?: 'day' | 'week' | 'month'
  operation_type?: OperationType
  business_type?: BusinessType
}