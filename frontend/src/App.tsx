import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AlertsTable } from "@/components/dashboard/alerts-table";
import { BusinessComparisonPage } from "@/components/dashboard/business-comparison-page";
import { DateRangeFilterBar } from "@/components/dashboard/date-range-filter";
import { KPIRow } from "@/components/dashboard/kpi-row";
import { IncomeOutcomeChart } from "@/components/dashboard/income-outcome-chart";
import { ProfitPercentChart } from "@/components/dashboard/profit-percent-chart";
import {
  type FinancialMovement,
  type KPIMetrics,
  type MonthlyDataPoint,
} from "@/lib/financial-types";
import type { AlertsResponse, FacetsResponse } from "../specs/api-types";
import type { DateRangeFilter } from "../specs/param-types";
import { fetchApi } from "@/lib/api";
import { computeKPIs, computeMonthlyData } from "@/lib/financial-utils";

function App() {
  const [page, setPage] = useState<"overview" | "comparison">("overview");
  const [dateRange, setDateRange] = useState<DateRangeFilter>({});
  const [facets, setFacets] = useState<FacetsResponse | null>(null);
  const [facetsError, setFacetsError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<KPIMetrics | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [loadedMetricsKey, setLoadedMetricsKey] = useState<string | null>(null);
  const [metricsError, setMetricsError] = useState<{ key: string; message: string } | null>(null);
  const [alerts, setAlerts] = useState<AlertsResponse>([]);
  const [loadedAlertsKey, setLoadedAlertsKey] = useState<string | null>(null);
  const [alertsErrorState, setAlertsErrorState] = useState<{ key: string; message: string } | null>(null);
  const [threshold, setThreshold] = useState("0.3");
  const startDate = dateRange.start_date;
  const endDate = dateRange.end_date;
  const rangeKey = `${startDate ?? ""}|${endDate ?? ""}`;
  const rangeValid = !startDate || !endDate || startDate <= endDate;
  const numericThreshold = Number(threshold);
  const thresholdValid =
    threshold.trim() !== "" && Number.isFinite(numericThreshold) && numericThreshold >= 0.01 && numericThreshold <= 1;
  const alertsQueryKey = `${rangeKey}|${threshold}`;
  const loading = rangeValid && loadedMetricsKey !== rangeKey;
  const error = metricsError?.key === rangeKey ? metricsError.message : null;
  const alertsLoading = rangeValid && thresholdValid && loadedAlertsKey !== alertsQueryKey;
  const alertsError = alertsErrorState?.key === alertsQueryKey
    ? alertsErrorState.message
    : null;

  useEffect(() => {
    const controller = new AbortController();
    fetchApi<FacetsResponse>("/api/metrics/facets", {}, controller.signal)
      .then((response) => setFacets(response))
      .catch(() => {
        if (!controller.signal.aborted) {
          setFacetsError("Unable to load the available date range.");
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (!rangeValid) {
      return () => controller.abort();
    }

    fetchApi<FinancialMovement[]>(
      "/api/metrics",
      { start_date: startDate, end_date: endDate },
      controller.signal,
    )
      .then((movements) => {
        setMetrics(computeKPIs(movements));
        setMonthlyData(computeMonthlyData(movements));
        setMetricsError(null);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setMetrics(null);
          setMonthlyData([]);
          setMetricsError({
            key: rangeKey,
            message: "Unable to load financial metrics. Check the backend API.",
          });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadedMetricsKey(rangeKey);
      });
    return () => controller.abort();
  }, [startDate, endDate, rangeKey, rangeValid]);

  useEffect(() => {
    const controller = new AbortController();
    if (!rangeValid || !thresholdValid) {
      return () => controller.abort();
    }

    fetchApi<AlertsResponse>(
      "/api/metrics/alerts",
      { start_date: startDate, end_date: endDate, threshold: numericThreshold },
      controller.signal,
    )
      .then((response) => {
        setAlerts(response);
        setAlertsErrorState(null);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAlertsErrorState({
            key: alertsQueryKey,
            message: "Unable to load anomaly data.",
          });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadedAlertsKey(alertsQueryKey);
      });
    return () => controller.abort();
  }, [startDate, endDate, rangeKey, alertsQueryKey, numericThreshold, rangeValid, thresholdValid]);

  const period = dateRange.start_date || dateRange.end_date
    ? `${dateRange.start_date ?? facets?.min_date ?? "..."} — ${dateRange.end_date ?? facets?.max_date ?? "..."}`
    : String(new Date().getFullYear());

  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <DashboardHeader period={period} />

          <div className="flex flex-col gap-5">
            <nav aria-label="Dashboard views" className="flex gap-2">
              <button
                aria-current={page === "overview" ? "page" : undefined}
                className={`rounded-md px-4 py-2 text-sm font-medium ${page === "overview" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}
                type="button"
                onClick={() => setPage("overview")}
              >
                Overview
              </button>
              <button
                aria-current={page === "comparison" ? "page" : undefined}
                className={`rounded-md px-4 py-2 text-sm font-medium ${page === "comparison" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}
                type="button"
                onClick={() => setPage("comparison")}
              >
                B2B vs B2C
              </button>
            </nav>
            <DateRangeFilterBar
              availableRange={facets}
              onChange={setDateRange}
              value={dateRange}
            />
          </div>

          {facetsError ? <p className="text-sm text-destructive" role="alert">{facetsError}</p> : null}

          {page === "overview" ? (
            <>
              {rangeValid && error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
              <section aria-label="Key performance indicators">
                <KPIRow metrics={rangeValid ? metrics : null} loading={rangeValid && loading} />
              </section>
              <section aria-label="Financial charts" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <IncomeOutcomeChart data={rangeValid ? monthlyData : []} loading={rangeValid && loading} />
                <ProfitPercentChart data={rangeValid ? monthlyData : []} loading={rangeValid && loading} />
              </section>
              <AlertsTable
                alerts={rangeValid && thresholdValid ? alerts : []}
                error={!rangeValid ? "Correct the date range to see anomalies." : thresholdValid ? alertsError : "Enter a threshold between 0.01 and 1.00."}
                loading={rangeValid && thresholdValid && alertsLoading}
                onThresholdChange={setThreshold}
                threshold={threshold}
              />
            </>
          ) : (
            <BusinessComparisonPage dateRange={dateRange} rangeValid={rangeValid} />
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
