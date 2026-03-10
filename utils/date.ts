import type { Language } from "@/types";

function toLatinDigits(str: string): string {
  return str.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

const MONTHS_AR_LONG = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const MONTHS_AR_SHORT = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export function formatDate(dateStr: string, language: Language = "en"): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    if (language === "ar") {
      const day = date.getDate();
      const month = MONTHS_AR_LONG[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    }
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string, language: Language = "en"): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    if (language === "ar") {
      const day = date.getDate();
      const month = MONTHS_AR_SHORT[date.getMonth()];
      return `${day} ${month}`;
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function todayISOString(): string {
  return new Date().toISOString().split("T")[0];
}

export function getRemainingDaysInMonth(): number {
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return lastDay.getDate() - today.getDate();
}

export function isWithin29Days(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  const diff = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 29;
}

export function isPastDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function getMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getCurrentMonthYear(): { month: number; year: number } {
  const today = new Date();
  return { month: today.getMonth() + 1, year: today.getFullYear() };
}

export function getDaysRemaining(targetDateStr: string): number {
  const target = new Date(targetDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split("T")[0];
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export function addWeeks(dateStr: string, weeks: number): string {
  return addDays(dateStr, weeks * 7);
}

export function addYears(dateStr: string, years: number): string {
  const date = new Date(dateStr);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().split("T")[0];
}

export function getMonthName(monthKey: string, language: Language = "en"): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  if (language === "ar") {
    return `${MONTHS_AR_LONG[date.getMonth()]} ${date.getFullYear()}`;
  }
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function monthKeyToMonthYear(monthKey: string): { month: number; year: number } {
  const [year, month] = monthKey.split("-");
  return { month: parseInt(month), year: parseInt(year) };
}

export function monthYearToMonthKey(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}
