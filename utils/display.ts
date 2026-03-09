import type { Language } from "@/types";

export function getDisplayName(
  item: { name_ar?: string; name_en?: string } | undefined,
  language: Language
): string {
  if (!item) return "";
  if (language === "ar") return item.name_ar || item.name_en || "";
  return item.name_en || item.name_ar || "";
}
