export async function autoTranslate(text: string, targetLang: "ar" | "en"): Promise<string> {
  if (!text.trim()) return "";
  try {
    const langPair = targetLang === "ar" ? "en|ar" : "ar|en";
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
    const response = await fetch(url, { method: "GET" });
    const data = await response.json();
    if (data?.responseStatus === 200 && data?.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    return "";
  } catch {
    return "";
  }
}

export function detectLanguage(text: string): "ar" | "en" {
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(text) ? "ar" : "en";
}
