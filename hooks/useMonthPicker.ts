import { useState, useCallback } from "react";
import { getCurrentMonthYear } from "@/utils/date";
import type { Language } from "@/types";

export const MONTH_NAMES_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
export const MONTH_NAMES_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export interface UseMonthPickerReturn {
  month: number;
  year: number;
  monthName: string;
  monthKey: string;
  goToPrev: () => void;
  goToNext: () => void;
  resetToToday: () => void;
}

export function useMonthPicker(language: Language): UseMonthPickerReturn {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const goToPrev = useCallback(() => {
    setMonth((m) => {
      if (m === 1) {
        setYear((y) => y - 1);
        return 12;
      }
      return m - 1;
    });
  }, []);

  const goToNext = useCallback(() => {
    setMonth((m) => {
      if (m === 12) {
        setYear((y) => y + 1);
        return 1;
      }
      return m + 1;
    });
  }, []);

  const resetToToday = useCallback(() => {
    setMonth(currentMonth);
    setYear(currentYear);
  }, [currentMonth, currentYear]);

  const monthName = language === "ar"
    ? MONTH_NAMES_AR[month - 1]
    : MONTH_NAMES_EN[month - 1];

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  return { month, year, monthName, monthKey, goToPrev, goToNext, resetToToday };
}
