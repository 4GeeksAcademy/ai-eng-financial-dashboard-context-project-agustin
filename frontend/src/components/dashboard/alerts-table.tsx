import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AlertsResponse } from "../../../specs/api-types";
import { formatCurrency, formatPercent } from "@/lib/financial-utils";

interface AlertsTableProps {
  alerts: AlertsResponse;
  loading: boolean;
  error: string | null;
  threshold: string;
  onThresholdChange: (value: string) => void;
}

export function AlertsTable({
  alerts,
  loading,
  error,
  threshold,
  onThresholdChange,
}: AlertsTableProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Spending anomalies</CardTitle>
          <CardDescription>Monthly outcomes compared with the previous three months</CardDescription>
        </div>
        <label className="text-sm font-medium text-foreground">
          Alert threshold
          <input
            aria-label="Alert threshold"
            className="mt-1 block h-10 w-32 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            max="1"
            min="0.01"
            step="0.01"
            type="number"
            value={threshold}
            onChange={(event) => onThresholdChange(event.target.value)}
          />
        </label>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="py-8 text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground" role="status">
            Loading anomaly data...
          </p>
        ) : alerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground" role="status">
            No spending anomalies found for this date range and threshold.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">Period</th>
                  <th className="px-3 py-3 text-right font-medium">Recorded outcome</th>
                  <th className="px-3 py-3 text-right font-medium">Previous 3-period average</th>
                  <th className="px-3 py-3 text-right font-medium">Increase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {alerts.map((alert) => (
                  <tr key={alert.period}>
                    <td className="px-3 py-3 font-medium text-foreground">{alert.period}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(alert.outcome_total)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(alert.baseline_average)}</td>
                    <td className="px-3 py-3 text-right font-medium text-destructive tabular-nums">
                      {formatPercent(alert.increase_ratio * 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}