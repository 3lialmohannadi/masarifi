export const CURRENCIES = [
  { code: "QAR", symbol: "ر.ق", nameAr: "ريال قطري",     nameEn: "Qatari Riyal",   decimals: 2, flag: "🇶🇦" },
  { code: "SAR", symbol: "ر.س", nameAr: "ريال سعودي",    nameEn: "Saudi Riyal",     decimals: 2, flag: "🇸🇦" },
  { code: "AED", symbol: "د.إ", nameAr: "درهم إماراتي",  nameEn: "UAE Dirham",      decimals: 2, flag: "🇦🇪" },
  { code: "KWD", symbol: "د.ك", nameAr: "دينار كويتي",   nameEn: "Kuwaiti Dinar",   decimals: 3, flag: "🇰🇼" },
  { code: "BHD", symbol: "د.ب", nameAr: "دينار بحريني",  nameEn: "Bahraini Dinar",  decimals: 3, flag: "🇧🇭" },
  { code: "OMR", symbol: "ر.ع", nameAr: "ريال عماني",    nameEn: "Omani Riyal",     decimals: 3, flag: "🇴🇲" },
  { code: "USD", symbol: "$",   nameAr: "دولار أمريكي",  nameEn: "US Dollar",       decimals: 2, flag: "🇺🇸" },
  { code: "EUR", symbol: "€",   nameAr: "يورو",           nameEn: "Euro",            decimals: 2, flag: "🇪🇺" },
  { code: "GBP", symbol: "£",   nameAr: "جنيه إسترليني", nameEn: "British Pound",   decimals: 2, flag: "🇬🇧" },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]["code"];

export function getCurrencyInfo(code: string) {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}
