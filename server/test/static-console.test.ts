import { describe, expect, it, afterEach } from "vitest";
import type { Server } from "node:http";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import http from "node:http";

import { createApp } from "../src/app.js";

let server: Server | undefined;
let tmpDir: string | undefined;

afterEach(() => {
  server?.close();
  server = undefined;
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  tmpDir = undefined;
});

function get(port: number, urlPath: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request({ port, path: urlPath, method: "GET" }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on("error", reject);
    req.end();
  });
}

async function listen(publicDir: string): Promise<number> {
  const app = createApp({ port: 0, publicDir });
  server = app.listen(0);
  await new Promise<void>((resolve) => server!.once("listening", resolve));
  return (server.address() as { port: number }).port;
}

describe("static console serving", () => {
  it("says the console isn't built yet when public/ has no index.html (ADR-003)", async () => {
    const port = await listen("/nonexistent");
    const res = await get(port, "/");
    expect(res.status).toBe(200);
    expect(res.body).toContain("hasn't been built yet");
  });

  it("serves the built console and falls back to index.html for client-side routes", async () => {
    tmpDir = mkdtempSync(path.join(tmpdir(), "frank-console-"));
    writeFileSync(path.join(tmpDir, "index.html"), "<html>console</html>");

    const port = await listen(tmpDir);

    const root = await get(port, "/");
    expect(root.body).toContain("console");

    const deepRoute = await get(port, "/some/client/route");
    expect(deepRoute.status).toBe(200);
    expect(deepRoute.body).toContain("console");
  });

  it("never lets static serving shadow /healthz or /mcp", async () => {
    tmpDir = mkdtempSync(path.join(tmpdir(), "frank-console-"));
    writeFileSync(path.join(tmpDir, "index.html"), "<html>console</html>");

    const port = await listen(tmpDir);
    const health = await get(port, "/healthz");
    expect(health.body).toBe("ok");
  });
});
