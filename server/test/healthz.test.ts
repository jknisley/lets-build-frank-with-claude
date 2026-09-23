import { describe, expect, it } from "vitest";
import request from "node:http";
import { createApp } from "../src/app.js";

function get(port: number, urlPath: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request.request({ port, path: urlPath, method: "GET" }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on("error", reject);
    req.end();
  });
}

describe("GET /healthz", () => {
  it("returns 200 for container health probes", async () => {
    const app = createApp({ port: 0, publicDir: "/nonexistent" });
    const server = app.listen(0);
    try {
      const { port } = server.address() as { port: number };
      const res = await get(port, "/healthz");
      expect(res.status).toBe(200);
    } finally {
      server.close();
    }
  });
});
