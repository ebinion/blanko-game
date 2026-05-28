import { describe, it, expect } from "vitest";
import { tokenize } from "~/engine/tokenize";
import { selectBlanks } from "~/engine/select-blanks";

describe("performance (SC-003)", () => {
  it("tokenize + selectBlanks on 500-word passage completes in under 200ms", () => {
    const passage = Array.from({ length: 500 }, () => "lorem").join(" ");
    const start = performance.now();
    const tokens = tokenize(passage);
    selectBlanks(tokens, "hard");
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });
});
