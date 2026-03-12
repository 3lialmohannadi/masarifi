import { describe, it, expect } from "vitest";
import { generateId, now } from "../../utils/id";
import { createSyncFn } from "../../utils/syncHelper";

describe("id utils", () => {
  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });

    it("should return a non-empty string", () => {
      const id = generateId();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe("now", () => {
    it("should return a valid ISO string", () => {
      const timestamp = now();
      expect(typeof timestamp).toBe("string");
      const date = new Date(timestamp);
      expect(date.getTime()).not.toBeNaN();
    });

    it("should return a recent timestamp", () => {
      const before = Date.now();
      const timestamp = now();
      const after = Date.now();
      const ts = new Date(timestamp).getTime();
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });
  });
});

describe("syncHelper", () => {
  describe("createSyncFn", () => {
    it("should call onError when promise rejects", async () => {
      let capturedError = "";
      const sync = createSyncFn((msg) => { capturedError = msg; });

      sync(Promise.reject(new Error("network fail")), "test operation");

      // Wait for the promise to settle
      await new Promise((r) => setTimeout(r, 10));
      expect(capturedError).toBe("Sync failed: test operation");
    });

    it("should not call onError when promise resolves", async () => {
      let called = false;
      const sync = createSyncFn(() => { called = true; });

      sync(Promise.resolve(), "test operation");

      await new Promise((r) => setTimeout(r, 10));
      expect(called).toBe(false);
    });

    it("should work without onError callback", () => {
      const sync = createSyncFn();
      // Should not throw
      sync(Promise.reject(new Error("fail")), "test");
    });
  });
});
