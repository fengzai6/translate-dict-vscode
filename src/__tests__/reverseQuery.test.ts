import { describe, expect, it } from "vitest";
import { containsChinese, reverseQuery } from "../reverseQuery";

describe("reverseQuery", () => {
  describe("containsChinese", () => {
    it("应该检测到纯中文字符", () => {
      expect(containsChinese("你好")).toBe(true);
      expect(containsChinese("测试")).toBe(true);
      expect(containsChinese("中文")).toBe(true);
    });

    it("不应该检测到非中文字符", () => {
      expect(containsChinese("hello")).toBe(false);
      expect(containsChinese("123")).toBe(false);
      expect(containsChinese("test")).toBe(false);
    });

    it("中英混合文本应该返回false", () => {
      expect(containsChinese("hello世界")).toBe(false);
      expect(containsChinese("组件react")).toBe(false);
      expect(containsChinese("Vue组件")).toBe(false);
      expect(containsChinese("测试test")).toBe(false);
    });
  });

  describe("reverseQuery", () => {
    it("应该能够根据中文查找英文单词", () => {
      const results = reverseQuery("头", 5);
      expect(results.length).toBeGreaterThan(0);
      // 检查结果中是否包含与"头"相关的单词
      expect(results.some((r) => r.translation.includes("头"))).toBe(true);
    });

    it("应该能够查找包含特定中文的翻译", () => {
      const results = reverseQuery("男人", 5);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.translation.includes("男人"))).toBe(true);
    });

    it("对于非中文文本应该返回空数组", () => {
      const results = reverseQuery("hello", 5);
      expect(results.length).toBe(0);
    });

    it("应该限制返回结果数量", () => {
      const results = reverseQuery("的", 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it("应该优先返回完全匹配的结果", () => {
      const results = reverseQuery("男人", 10);
      if (results.length > 0) {
        // 第一个结果应该是完全匹配或以搜索词开头的
        const firstResult = results[0];
        const isExactMatch = firstResult.translation === "男人";
        const startsWithMatch = firstResult.translation.startsWith("男人");
        const hasExactInParts = firstResult.translation
          .split(/[；;、，,\s\n]/)
          .some((part) => part === "男人");

        expect(isExactMatch || startsWithMatch || hasExactInParts).toBe(true);
      }
    });

    it("完全匹配应该排在部分匹配之前", () => {
      const results = reverseQuery("人", 20);
      if (results.length >= 2) {
        // 找到完全匹配和部分匹配的索引
        const exactMatchIndex = results.findIndex(
          (r) =>
            r.translation === "人" ||
            r.translation.split(/[；;、，,\s\n]/).includes("人")
        );
        const partialMatchIndex = results.findIndex(
          (r) =>
            r.translation.includes("人") &&
            r.translation !== "人" &&
            !r.translation.split(/[；;、，,\s\n]/).includes("人")
        );

        // 如果两种匹配都存在，完全匹配应该在前面
        if (exactMatchIndex !== -1 && partialMatchIndex !== -1) {
          expect(exactMatchIndex).toBeLessThan(partialMatchIndex);
        }
      }
    });
  });
});
