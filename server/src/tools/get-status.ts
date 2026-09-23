import { z } from "zod";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(path.resolve(here, "..", "..", "package.json"), "utf-8"),
) as { version: string };

const processStartMs = Date.now();

export const inputSchema = z.object({}).strict();

export const outputSchema = z.object({
  summary: z.string().describe("Human-readable status line: version and uptime."),
  version: z.string().describe("Frank's package version."),
  uptimeSeconds: z.number().int().nonnegative().describe("Seconds since this process started."),
  greeting: z.string().describe("A short greeting from Frank."),
});

export type GetStatusOutput = z.infer<typeof outputSchema>;

export function computeUptimeSeconds(startMs: number, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - startMs) / 1000));
}

export function getStatus(nowMs: number = Date.now(), startMs: number = processStartMs): GetStatusOutput {
  const uptimeSeconds = computeUptimeSeconds(startMs, nowMs);
  return {
    summary: `Frank v${pkg.version} has been up for ${uptimeSeconds}s.`,
    version: pkg.version,
    uptimeSeconds,
    greeting: "Hi, I'm Frank.",
  };
}

export const getStatusTool = {
  name: "get_status",
  config: {
    description:
      "Returns Frank's version, uptime in seconds, and a greeting. Use this to check that Frank is reachable and healthy before calling any other tool. Takes no input.",
    inputSchema,
    outputSchema,
  },
  handler: async () => {
    const output = getStatus();
    return {
      content: [{ type: "text" as const, text: output.summary }],
      structuredContent: output,
    };
  },
};
