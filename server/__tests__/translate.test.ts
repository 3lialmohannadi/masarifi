import { describe, it, expect } from "vitest";
import { autoTranslate, detectLanguage } from "../../utils/translate";

describe("translate", () => {
  describe("autoTranslate", () => {
    it("should translate Arabic to English", async () => {
      const result = await autoTranslate("مواصلات", "en");
      expect(result).toBe("Transport");
    });

    it("should translate English to Arabic", async () => {
      const result = await autoTranslate("Transport", "ar");
      expect(result).toBe("مواصلات");
    });

    it("should handle case-insensitive English input", async () => {
      const result = await autoTranslate("transport", "ar");
      expect(result).toBe("مواصلات");
    });

    it("should return empty string for unknown text", async () => {
      const result = await autoTranslate("xyzunknown", "ar");
      expect(result).toBe("");
    });

    it("should return empty string for empty input", async () => {
      const result = await autoTranslate("", "en");
      expect(result).toBe("");
    });

    it("should return empty string for whitespace input", async () => {
      const result = await autoTranslate("   ", "en");
      expect(result).toBe("");
    });

    it("should translate common financial terms", async () => {
      expect(await autoTranslate("Salary", "ar")).toBe("راتب");
      expect(await autoTranslate("Rent", "ar")).toBe("إيجار");
      expect(await autoTranslate("راتب", "en")).toBe("Salary");
      expect(await autoTranslate("إيجار", "en")).toBe("Rent");
    });
  });

  describe("detectLanguage", () => {
    it("should detect Arabic text", () => {
      expect(detectLanguage("مرحبا")).toBe("ar");
      expect(detectLanguage("حساب جاري")).toBe("ar");
    });

    it("should detect English text", () => {
      expect(detectLanguage("hello")).toBe("en");
      expect(detectLanguage("Current Account")).toBe("en");
    });

    it("should detect mixed text as Arabic if it contains Arabic characters", () => {
      expect(detectLanguage("hello مرحبا")).toBe("ar");
    });

    it("should detect numbers as English", () => {
      expect(detectLanguage("12345")).toBe("en");
    });
  });
});
