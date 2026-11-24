import { RotateCcw } from "lucide-react";
import type { FacetsResponse } from "../../../specs/api-types";
import type { DateRangeFilter } from "../../../specs/param-types";

interface DateRangeFilterProps {
  value: DateRangeFilter;
  availableRange: FacetsResponse | null;
  onChange: (value: DateRangeFilter) => void;
}

const inputClassName =
  "mt-1 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function DateRangeFilterBar({
  value,
  availableRange,
  onChange,
}: DateRangeFilterProps) {
  const invalidRange =
    value.start_date && value.end_date && value.start_date > value.end_date;

  return (
    <section
      aria-label="Date range filter"
      className="flex flex-col gap-4 border-y border-border/70 py-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="grid flex-1 grid-cols-1 gap-4 sm:max-w-2xl sm:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          Start date
          <input
            className={inputClassName}
            type="date"
            value={value.start_date ?? ""}
            min={availableRange?.min_date}
            max={value.end_date ?? availableRange?.max_date}
            onChange={(event) =>
              onChange({ ...value, start_date: event.target.value || undefined })
            }
          />
        </label>
        <label className="text-sm font-medium text-foreground">
          End date
          <input
            className={inputClassName}
            type="date"
            value={value.end_date ?? ""}
            min={value.start_date ?? availableRange?.min_date}
            max={availableRange?.max_date}
            onChange={(event) =>
              onChange({ ...value, end_date: event.target.value || undefined })
            }
          />
        </label>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <p className="text-xs text-muted-foreground">
          {availableRange
            ? `Available: ${availableRange.min_date} to ${availableRange.max_date}`
            : "Loading available dates..."}
        </p>
        <button
          aria-label="Clear date range"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
          disabled={!value.start_date && !value.end_date}
          title="Clear date range"
          type="button"
          onClick={() => onChange({})}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      {invalidRange ? (
        <p className="text-sm text-destructive" role="alert">
          Start date must be on or before end date.
        </p>
      ) : null}
    </section>
  );
}