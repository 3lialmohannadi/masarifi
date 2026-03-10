import type { Language } from "@/types";

export const CURRENCIES = [
  { code: "QAR", symbol: "ر.ق", nameAr: "ريال قطري", nameEn: "Qatari Riyal", decimals: 2 },
  { code: "USD", symbol: "$", nameAr: "دولار أمريكي", nameEn: "US Dollar", decimals: 2 },
  { code: "EUR", symbol: "€", nameAr: "يورو", nameEn: "Euro", decimals: 2 },
  { code: "SAR", symbol: "ر.س", nameAr: "ريال سعودي", nameEn: "Saudi Riyal", decimals: 2 },
  { code: "AED", symbol: "د.إ", nameAr: "درهم إماراتي", nameEn: "UAE Dirham", decimals: 2 },
  { code: "GBP", symbol: "£", nameAr: "جنيه إسترليني", nameEn: "British Pound", decimals: 2 },
  { code: "KWD", symbol: "د.ك", nameAr: "دينار كويتي", nameEn: "Kuwaiti Dinar", decimals: 3 },
  { code: "BHD", symbol: "د.ب", nameAr: "دينار بحريني", nameEn: "Bahraini Dinar", decimals: 3 },
  { code: "OMR", symbol: "ر.ع", nameAr: "ريال عماني", nameEn: "Omani Riyal", decimals: 3 },
];

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol || code;
}

export function getCurrencyDecimals(code: string): number {
  return CURRENCIES.find((c) => c.code === code)?.decimals ?? 2;
}

export function formatCurrency(amount: number, currencyCode: string, language: Language = "en"): string {
  const decimals = getCurrencyDecimals(currencyCode);
  const symbol = getCurrencySymbol(currencyCode);
  const formatted = Math.abs(amount).toLocaleString(language === "ar" ? "ar-QA-u-nu-latn" : "en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  if (language === "ar") {
    return `${formatted} ${symbol}`;
  }
  return `${symbol}${formatted}`;
}

export function formatAmount(amount: number, language: Language = "en"): string {
  return Math.abs(amount).toLocaleString(language === "ar" ? "ar-QA-u-nu-latn" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
