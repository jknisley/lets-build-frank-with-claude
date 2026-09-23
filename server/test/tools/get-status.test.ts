import { describe, expect, it } from "vitest";
import { computeUptimeSeconds, getStatus, inputSchema, outputSchema } from "../../src/tools/get-status.js";

describe("get_status", () => {
  it("reports version, uptime, and a greeting", () => {
    const startMs = 1_700_000_000_000;
    const output = getStatus(startMs + 5_000, startMs);

    expect(output.uptimeSeconds).toBe(5);
    expect(output.greeting).toBe("Hi, I'm Frank.");
    expect(output.summary).toContain("5s");
    expect(outputSchema.safeParse(output).success).toBe(true);
  });

  it("never reports negative uptime", () => {
    expect(computeUptimeSeconds(1_000, 500)).toBe(0);
  });

  it("takes no input and rejects unknown fields", () => {
    expect(inputSchema.safeParse({}).success).toBe(true);
    expect(inputSchema.safeParse({ extra: 1 }).success).toBe(false);
  });
});
