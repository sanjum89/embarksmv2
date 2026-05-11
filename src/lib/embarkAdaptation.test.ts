import { describe, it, expect } from "vitest";
import {
  formatAdaptationLabel,
  containsForbiddenPhrasing,
  sanitizeReason,
} from "./embarkAdaptation";

describe("formatAdaptationLabel", () => {
  it("maps every backend value to a learner-friendly label", () => {
    expect(formatAdaptationLabel("full_module")).toBe("Full module");
    expect(formatAdaptationLabel("microlearning")).toBe("Condensed module");
    expect(formatAdaptationLabel("diagnostic_only")).toBe("Quick diagnostic");
    expect(formatAdaptationLabel("evidence_required")).toBe("Evidence task");
    expect(formatAdaptationLabel("skip_after_validation")).toBe("Already covered");
  });
});

describe("containsForbiddenPhrasing", () => {
  it("flags skip/bypass/removed phrasings", () => {
    expect(containsForbiddenPhrasing("This is skipped for you")).toBe(true);
    expect(containsForbiddenPhrasing("We will bypass this module")).toBe(true);
    expect(containsForbiddenPhrasing("Module removed from your path")).toBe(true);
    expect(containsForbiddenPhrasing("You don't need this content")).toBe(true);
  });

  it("passes Clara-safe phrasings", () => {
    expect(
      containsForbiddenPhrasing("Already covered based on your current profile.")
    ).toBe(false);
    expect(
      containsForbiddenPhrasing("Confirmed via your existing experience.")
    ).toBe(false);
  });
});

describe("sanitizeReason", () => {
  it("rewrites skip/bypass/removed into Clara-safe phrasing", () => {
    expect(sanitizeReason("This will be skipped")).toMatch(/already covered/);
    expect(sanitizeReason("Module removed from path")).toMatch(/not required/);
  });
});
