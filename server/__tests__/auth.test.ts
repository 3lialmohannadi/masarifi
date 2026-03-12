import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword, generateToken, verifyToken } from "../auth";

describe("auth", () => {
  describe("hashPassword + comparePassword", () => {
    it("should hash a password and verify it", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);

      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject wrong password", async () => {
      const hash = await hashPassword("correctPassword");
      const isValid = await comparePassword("wrongPassword", hash);
      expect(isValid).toBe(false);
    });

    it("should produce different hashes for the same password", async () => {
      const hash1 = await hashPassword("samePassword");
      const hash2 = await hashPassword("samePassword");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("generateToken + verifyToken", () => {
    it("should generate a valid token and verify it", () => {
      const userId = "test-user-123";
      const token = generateToken(userId);

      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");

      const payload = verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload!.userId).toBe(userId);
    });

    it("should return null for an invalid token", () => {
      const payload = verifyToken("invalid-token");
      expect(payload).toBeNull();
    });

    it("should return null for an empty token", () => {
      const payload = verifyToken("");
      expect(payload).toBeNull();
    });
  });
});
