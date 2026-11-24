import { describe, expect, it } from "vitest";

import {
  computeKPIs,
  computeCategoryShares,
  computeGroupIncome,
  computeMonthlyData,
  formatCurrency,
  formatPercent,
} from "./financial-utils";
import type { FinancialMovement } from "./financial-types";
import type { CategoryEntry, MetricsSummaryEntry } from "../../specs/api-types";

const sampleMovements: FinancialMovement[] = [
  {
    create_date: "2024-01-10",
    amount: 1000,
    operation_type: "income",
    category: "sales",
    business_type: "B2B",
  },
  {
    create_date: "2024-01-15",
    amount: 250,
    operation_type: "outcome",
    category: "suppliers",
    business_type: "B2B",
  },
  {
    create_date: "2024-02-01",
    amount: 500,
    operation_type: "income",
    category: "sales",
    business_type: "B2C",
  },
];

describe("computeKPIs", () => {
  it("calculates totals and profit values", () => {
    const metrics = computeKPIs(sampleMovements);

    expect(metrics).toEqual({
      totalIncome: 1500,
      totalOutcome: 250,
      profit: 1250,
      profitPercent: (1250 / 1500) * 100,
    });
  });

  it("returns 0 profitPercent when there is no income", () => {
    const onlyOutcomes: FinancialMovement[] = [
      {
        create_date: "2024-03-05",
        amount: 350,
        operation_type: "outcome",
        category: "operational",
        business_type: "B2B",
      },
    ];

    const metrics = computeKPIs(onlyOutcomes);
    expect(metrics.profitPercent).toBe(0);
  });
});

describe("computeMonthlyData", () => {
  it("returns chronological year-month points with aggregated totals", () => {
    const unsortedCrossYearMovements: FinancialMovement[] = [
      {
        create_date: "2026-01-08",
        amount: 300,
        operation_type: "income",
        category: "sales",
        business_type: "B2C",
      },
      {
        create_date: "2025-12-05",
        amount: 200,
        operation_type: "outcome",
        category: "operational",
        business_type: "B2B",
      },
      {
        create_date: "2025-12-03",
        amount: 1000,
        operation_type: "income",
        category: "sales",
        business_type: "B2B",
      },
    ];
    const monthlyData = computeMonthlyData(unsortedCrossYearMovements);

    expect(monthlyData).toHaveLength(2);
    expect(monthlyData[0]).toEqual({
      month: "Dec 2025",
      income: 1000,
      outcome: 200,
      profitPercent: 80,
    });
    expect(monthlyData[1]).toEqual({
      month: "Jan 2026",
      income: 300,
      outcome: 0,
      profitPercent: 100,
    });
  });

  it("keeps ISO calendar dates in their stated month", () => {
    const movements: FinancialMovement[] = [
      {
        create_date: "2026-03-01",
        amount: 100,
        operation_type: "income",
        category: "sales",
        business_type: "B2B",
      },
    ];

    expect(computeMonthlyData(movements)[0].month).toBe("Mar 2026");
  });
});

describe("business comparison calculations", () => {
  it("calculates category shares against full group income", () => {
    const categories: CategoryEntry[] = [
      { category: "sales", operation_type: "income", total_amount: 60 },
      { category: "others", operation_type: "income", total_amount: 20 },
    ];
    const summary: MetricsSummaryEntry[] = [
      { period: "2026-01", income: 100, outcome: 50, net: 50 },
      { period: "2026-02", income: 60, outcome: 20, net: 40 },
    ];

    const shares = computeCategoryShares(
      categories,
      ["sales", "others"],
      computeGroupIncome(summary),
    );

    expect(shares).toEqual([
      { category: "sales", totalAmount: 60, sharePercent: 37.5 },
      { category: "others", totalAmount: 20, sharePercent: 12.5 },
    ]);
  });

  it("returns zero shares when group income is zero", () => {
    const categories: CategoryEntry[] = [
      { category: "sales", operation_type: "income", total_amount: 0 },
    ];

    expect(computeCategoryShares(categories, ["sales"], 0)[0].sharePercent).toBe(0);
  });
});

describe("formatters", () => {
  it("formats currency without decimals", () => {
    expect(formatCurrency(1234.56)).toBe("$1,235");
  });

  it("formats percent with one decimal", () => {
    expect(formatPercent(15.555)).toBe("15.6%");
  });
});
