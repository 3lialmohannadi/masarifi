import { useMemo } from "react";
import { MONTH_NAMES_AR, MONTH_NAMES_EN } from "@/hooks/useMonthPicker";
import type { Transaction, Language } from "@/types";

export interface TrendMonth {
  monthKey: string;
  label: string;
  income: number;
  expense: number;
}

export function useTrendData(
  transactions: Transaction[],
  selectedMonth: number,
  selectedYear: number,
  language: Language
): TrendMonth[] {
  return useMemo<TrendMonth[]>(() => {
    const months: TrendMonth[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = selectedMonth - i;
      let y = selectedYear;
      while (m <= 0) {
        m += 12;
        y--;
      }
      const key = `${y}-${String(m).padStart(2, "0")}`;
      const txs = transactions.filter((tx) => tx.date.startsWith(key));
      const income = txs
        .filter((tx) => tx.type === "income")
        .reduce((s, tx) => s + tx.amount, 0);
      const expense = txs
        .filter((tx) => tx.type === "expense")
        .reduce((s, tx) => s + tx.amount, 0);
      const label =
        language === "ar"
          ? MONTH_NAMES_AR[m - 1].slice(0, 3)
          : MONTH_NAMES_EN[m - 1].slice(0, 3);
      months.push({ monthKey: key, label, income, expense });
    }
    return months;
  }, [transactions, selectedMonth, selectedYear, language]);
}
