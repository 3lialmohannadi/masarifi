import type { Language } from "@/types";

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export function formatDate(dateStr: string, language: Language = "en"): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    if (language === "ar") {
      const day = date.getDate();
      const month = MONTHS_AR[date.getMonth()];
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
      const month = MONTHS_AR[date.getMonth()];
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

export function isReservedOn28th(dueDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);

  const dueMonth = due.getMonth();
  const dueYear = due.getFullYear();

  const prevMonth = dueMonth === 0 ? 11 : dueMonth - 1;
  const prevYear = dueMonth === 0 ? dueYear - 1 : dueYear;
  const reservationStart = new Date(prevYear, prevMonth, 28);
  reservationStart.setHours(0, 0, 0, 0);

  return today >= reservationStart && today <= due;
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
