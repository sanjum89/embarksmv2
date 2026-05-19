import { describe, it, expect } from "vitest";
import { __NARRATIVES_FOR_TEST, NARRATIVE_OWNER_NAMES } from "./rathbonesNarrative";

describe("rathbonesNarrative", () => {
  it("every entry declares expectedStatus", () => {
    for (const [id, n] of Object.entries(__NARRATIVES_FOR_TEST)) {
      expect(n.expectedStatus, `${id} must declare expectedStatus`).toBeTruthy();
    }
  });

  it("story still starts with the persona's first name (drift guard)", () => {
    for (const [id, n] of Object.entries(__NARRATIVES_FOR_TEST)) {
      const expected = NARRATIVE_OWNER_NAMES[id];
      expect(n.story.startsWith(expected), `${id} story should start with ${expected}`).toBe(true);
    }
  });
});
