import { describe, it, expect } from "vitest";
import { labelSession } from "~/engine/label";

describe("labelSession", () => {
  it("label is '<first 4 words> · <YYYY-MM-DD>' for a normal passage", () => {
    const date = new Date("2026-05-28T12:00:00Z");
    const label = labelSession("La mer est calme et le ciel est bleu", date);
    expect(label).toBe("La mer est calme · 2026-05-28");
  });

  it("label is truncated to ≤ 80 chars", () => {
    const date = new Date("2026-05-28T12:00:00Z");
    const longPassage =
      "Supercalifragilisticexpialidocious extraordinaire magnificient spectacular extraordinary";
    const label = labelSession(longPassage, date);
    expect(label.length).toBeLessThanOrEqual(80);
  });

  it("entirely non-word passage yields '(untitled) · <YYYY-MM-DD>'", () => {
    const date = new Date("2026-05-28T12:00:00Z");
    const label = labelSession("... --- ...", date);
    expect(label).toBe("(untitled) · 2026-05-28");
  });
});
