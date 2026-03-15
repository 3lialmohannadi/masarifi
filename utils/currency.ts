import type { Language } from "@/types";

export const CURRENCIES = [
  { code: "QAR", symbol: "ر.ق", symbolEn: "QAR", nameAr: "ريال قطري", nameEn: "Qatari Riyal", decimals: 2 },
  { code: "USD", symbol: "$", symbolEn: "$", nameAr: "دولار أمريكي", nameEn: "US Dollar", decimals: 2 },
  { code: "EUR", symbol: "€", symbolEn: "€", nameAr: "يورو", nameEn: "Euro", decimals: 2 },
  { code: "SAR", symbol: "ر.س", symbolEn: "SAR", nameAr: "ريال سعودي", nameEn: "Saudi Riyal", decimals: 2 },
  { code: "AED", symbol: "د.إ", symbolEn: "AED", nameAr: "درهم إماراتي", nameEn: "UAE Dirham", decimals: 2 },
  { code: "GBP", symbol: "£", symbolEn: "£", nameAr: "جنيه إسترليني", nameEn: "British Pound", decimals: 2 },
  { code: "KWD", symbol: "د.ك", symbolEn: "KWD", nameAr: "دينار كويتي", nameEn: "Kuwaiti Dinar", decimals: 3 },
  { code: "BHD", symbol: "د.ب", symbolEn: "BHD", nameAr: "دينار بحريني", nameEn: "Bahraini Dinar", decimals: 3 },
  { code: "OMR", symbol: "ر.ع", symbolEn: "OMR", nameAr: "ريال عماني", nameEn: "Omani Riyal", decimals: 3 },
];

export function getCurrencySymbol(code: string, language: Language = "ar"): string {
  const currency = CURRENCIES.find((c) => c.code === code);
  if (!currency) return code;
  return language === "ar" ? currency.symbol : currency.symbolEn;
}

export function getCurrencyDecimals(code: string): number {
  return CURRENCIES.find((c) => c.code === code)?.decimals ?? 2;
}

export function formatCurrency(amount: number, currencyCode: string, language: Language = "en"): string {
  const decimals = getCurrencyDecimals(currencyCode);
  const symbol = getCurrencySymbol(currencyCode, language);
  const isNegative = amount < 0;
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  if (language === "ar") {
    return isNegative ? `- ${formatted} ${symbol}` : `${formatted} ${symbol}`;
  }
  return isNegative ? `-${symbol} ${formatted}` : `${symbol} ${formatted}`;
}
