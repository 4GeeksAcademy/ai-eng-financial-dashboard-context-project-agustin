import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  FacetsResponse,
  MetricsSummaryResponse,
  TopCategoriesResponse,
} from "../../../specs/api-types";
import type { DateRangeFilter } from "../../../specs/param-types";
import type { BusinessType, CategoryShare } from "@/lib/financial-types";
import { fetchApi } from "@/lib/api";
import {
  computeCategoryShares,
  computeGroupIncome,
  formatCurrency,
} from "@/lib/financial-utils";

interface BusinessComparisonPageProps {
  dateRange: DateRangeFilter;
  rangeValid: boolean;
}

interface BusinessGroupData {
  businessType: BusinessType;
  categories: CategoryShare[];
  totalIncome: number;
}

const businessTypes: BusinessType[] = ["B2B", "B2C"];

async function fetchBusinessGroup(
  businessType: BusinessType,
  dateRange: DateRangeFilter,
  signal: AbortSignal,
): Promise<BusinessGroupData> {
  const sharedParams = { ...dateRange, business_type: businessType };
  const [facets, topCategories, summary] = await Promise.all([
    fetchApi<FacetsResponse>("/api/metrics/facets", { business_type: businessType }, signal),
    fetchApi<TopCategoriesResponse>(
      "/api/metrics/categories/top",
      { ...sharedParams, operation_type: "income", limit: 5 },
      signal,
    ),
    fetchApi<MetricsSummaryResponse>(
      "/api/metrics/summary",
      { ...sharedParams, group_by: "month", operation_type: "income" },
      signal,
    ),
  ]);
  const totalIncome = computeGroupIncome(summary);

  return {
    businessType,
    totalIncome,
    categories: computeCategoryShares(
      topCategories,
      facets.categories,
      totalIncome,
    ),
  };
}

function CategoryTable({ group }: { group: BusinessGroupData }) {
  return (
    <section aria-labelledby={`${group.businessType}-categories-heading`}>
      <h2
        className="mb-3 text-base font-semibold text-foreground"
        id={`${group.businessType}-categories-heading`}
      >
        {group.businessType}
      </h2>
      <div className="overflow-x-auto border-y border-border/70">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-3 font-medium">Income category</th>
              <th className="px-3 py-3 text-right font-medium">Income</th>
              <th className="px-3 py-3 text-right font-medium">Share of group</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {group.categories.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-center text-muted-foreground" colSpan={3}>
                  No income categories for this date range.
                </td>
              </tr>
            ) : (
              group.categories.map((category) => (
                <tr key={category.category}>
                  <td className="px-3 py-3 font-medium capitalize text-foreground">
                    {category.category}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {formatCurrency(category.totalAmount)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {category.sharePercent.toFixed(1)}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Total income: <span className="font-medium text-foreground">{formatCurrency(group.totalIncome)}</span>
      </p>
    </section>
  );
}

export function BusinessComparisonPage({
  dateRange,
  rangeValid,
}: BusinessComparisonPageProps) {
  const [groups, setGroups] = useState<BusinessGroupData[]>([]);
  const startDate = dateRange.start_date;
  const endDate = dateRange.end_date;
  const queryKey = `${startDate ?? ""}|${endDate ?? ""}`;
  const [loadedQueryKey, setLoadedQueryKey] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<{ key: string; message: string } | null>(null);
  const loading = rangeValid && loadedQueryKey !== queryKey;
  const error = errorState?.key === queryKey ? errorState.message : null;

  useEffect(() => {
    const controller = new AbortController();
    if (!rangeValid) {
      return () => controller.abort();
    }

    const currentDateRange = { start_date: startDate, end_date: endDate };
    Promise.all(
      businessTypes.map((businessType) =>
        fetchBusinessGroup(businessType, currentDateRange, controller.signal),
      ),
    )
      .then((result) => {
        setGroups(result);
        setErrorState(null);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setErrorState({
            key: queryKey,
            message: "Unable to load the B2B and B2C comparison.",
          });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadedQueryKey(queryKey);
      });

    return () => controller.abort();
  }, [startDate, endDate, queryKey, rangeValid]);

  if (!rangeValid) {
    return <p className="text-sm text-destructive" role="alert">Start date must be on or before end date.</p>;
  }
  if (error) {
    return <p className="py-8 text-sm text-destructive" role="alert">{error}</p>;
  }
  if (loading) {
    return <p className="py-8 text-sm text-muted-foreground" role="status">Loading comparison...</p>;
  }

  const chartData = groups.map((group) => ({
    businessType: group.businessType,
    income: group.totalIncome,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {groups.map((group) => (
          <CategoryTable group={group} key={group.businessType} />
        ))}
      </div>
      <section aria-labelledby="business-income-comparison-heading">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-foreground" id="business-income-comparison-heading">
            Income comparison
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Total income by business line</p>
        </div>
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No income data for this date range.</p>
        ) : (
          <ResponsiveContainer height={300} width="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.6} />
              <XAxis dataKey="businessType" axisLine={false} tickLine={false} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
                width={52}
              />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="income" name="Income" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    fill={entry.businessType === "B2B" ? "var(--chart-income)" : "var(--chart-outcome)"}
                    key={entry.businessType}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  );
}