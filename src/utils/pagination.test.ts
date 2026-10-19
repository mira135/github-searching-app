import { describe, expect, it } from "vitest";
import { getTotalPages } from "./pagination";

describe("getTotalPages", () => {
  it("rounds up to fit all results", () => {
    expect(getTotalPages(45, 20)).toBe(3);
  });

  it("stops at the 1,000 results GitHub makes available", () => {
    expect(getTotalPages(1_116_899, 20)).toBe(50);
  });
});
