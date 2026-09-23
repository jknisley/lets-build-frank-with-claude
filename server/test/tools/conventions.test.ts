import { describe, expect, it } from "vitest";
import { ALLOWED_VERBS, tools } from "../../src/tools/index.js";

describe("ADR-002 tool conventions", () => {
  it.each(tools)("$name uses verb_noun naming from the closed verb set", (tool) => {
    const [verb] = tool.name.split("_");
    expect(tool.name).toMatch(/^[a-z]+(_[a-z]+)+$/);
    expect(ALLOWED_VERBS).toContain(verb);
  });

  it.each(tools)("$name has a description", (tool) => {
    expect(tool.config.description?.length).toBeGreaterThan(0);
  });
});
