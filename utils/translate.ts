/**
 * Local translation lookup using pre-defined common translations.
 * Replaces the external MyMemory API to avoid network latency,
 * rate limits, and dependency on an external service.
 */

const commonTranslations: Record<string, Record<string, string>> = {
  // Arabic -> English
  "ar-en": {
    "مواصلات": "Transport",
    "قهوة": "Coffee",
    "مطاعم": "Restaurants",
    "اشتراكات": "Subscriptions",
    "وقود": "Fuel",
    "صحة": "Health",
    "تسوق": "Shopping",
    "طعام": "Food",
    "ملابس": "Clothes",
    "ترفيه": "Entertainment",
    "سكن": "Housing",
    "تعليم": "Education",
    "هدايا": "Gifts",
    "رياضة": "Sports",
    "سفر": "Travel",
    "تأمين": "Insurance",
    "إلكترونيات": "Electronics",
    "فواتير": "Bills",
    "كهرباء": "Electricity",
    "ماء": "Water",
    "إنترنت": "Internet",
    "هاتف": "Phone",
    "بقالة": "Groceries",
    "صيانة": "Maintenance",
    "حلاقة": "Barbershop",
    "غسيل": "Laundry",
    "مواقف": "Parking",
    "أدوية": "Medicine",
    "راتب": "Salary",
    "مكافأة": "Bonus",
    "استثمار": "Investment",
    "إيجار": "Rent",
    "أقساط": "Installments",
    "تبرعات": "Donations",
    "زكاة": "Zakat",
    "عمولة": "Commission",
    "توفير": "Savings",
    "التوفير العام": "General Savings",
    "حساب جاري": "Current Account",
    "نقد": "Cash",
    "محفظة": "Wallet",
    "بطاقة ائتمان": "Credit Card",
    "أخرى": "Other",
    "عام": "General",
    "دخل": "Income",
    "مصروف": "Expense",
  },
  // English -> Arabic
  "en-ar": {
    "Transport": "مواصلات",
    "Coffee": "قهوة",
    "Restaurants": "مطاعم",
    "Subscriptions": "اشتراكات",
    "Fuel": "وقود",
    "Health": "صحة",
    "Shopping": "تسوق",
    "Food": "طعام",
    "Clothes": "ملابس",
    "Entertainment": "ترفيه",
    "Housing": "سكن",
    "Education": "تعليم",
    "Gifts": "هدايا",
    "Sports": "رياضة",
    "Travel": "سفر",
    "Insurance": "تأمين",
    "Electronics": "إلكترونيات",
    "Bills": "فواتير",
    "Electricity": "كهرباء",
    "Water": "ماء",
    "Internet": "إنترنت",
    "Phone": "هاتف",
    "Groceries": "بقالة",
    "Maintenance": "صيانة",
    "Barbershop": "حلاقة",
    "Laundry": "غسيل",
    "Parking": "مواقف",
    "Medicine": "أدوية",
    "Salary": "راتب",
    "Bonus": "مكافأة",
    "Investment": "استثمار",
    "Rent": "إيجار",
    "Installments": "أقساط",
    "Donations": "تبرعات",
    "Zakat": "زكاة",
    "Commission": "عمولة",
    "Savings": "توفير",
    "General Savings": "التوفير العام",
    "Current Account": "حساب جاري",
    "Cash": "نقد",
    "Wallet": "محفظة",
    "Credit Card": "بطاقة ائتمان",
    "Other": "أخرى",
    "General": "عام",
    "Income": "دخل",
    "Expense": "مصروف",
  },
};

/**
 * Translates text using the local dictionary.
 * Falls back to empty string if no translation is found.
 */
export async function autoTranslate(text: string, targetLang: "ar" | "en"): Promise<string> {
  if (!text.trim()) return "";

  const dictKey = targetLang === "ar" ? "en-ar" : "ar-en";
  const dict = commonTranslations[dictKey];

  // Try exact match
  const normalized = text.trim();
  if (dict[normalized]) return dict[normalized];

  // Try case-insensitive match for English input
  if (targetLang === "ar") {
    const lower = normalized.toLowerCase();
    for (const [key, value] of Object.entries(dict)) {
      if (key.toLowerCase() === lower) return value;
    }
  }

  return "";
}

export function detectLanguage(text: string): "ar" | "en" {
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(text) ? "ar" : "en";
}
