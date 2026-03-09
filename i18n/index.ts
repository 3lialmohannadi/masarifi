import { ar } from "./ar";
import { en } from "./en";
import type { Language } from "@/types";

export type TranslationKeys = typeof ar;

const translations = { ar, en };

export function getTranslations(language: Language): TranslationKeys {
  return translations[language] || translations.en;
}

export { ar, en };
