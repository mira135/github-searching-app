import { describe, expect, it } from "vitest";
import { formatCount, formatDate } from "./format";

describe("formatCount", () => {
  it("shortens large numbers", () => {
    expect(formatCount(457477)).toBe("457.5K");
  });
});

describe("formatDate", () => {
  it("formats an ISO timestamp as a short date", () => {
    expect(formatDate("2026-10-19T11:55:11Z")).toBe("Oct 19, 2026");
  });
});
