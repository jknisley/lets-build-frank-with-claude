import { describe, expect, it, afterEach } from "vitest";
import type { Server } from "node:http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createApp } from "../src/app.js";

let server: Server | undefined;

afterEach(() => {
  server?.close();
  server = undefined;
});

async function startServer(): Promise<string> {
  const app = createApp({ port: 0, publicDir: "/nonexistent" });
  server = app.listen(0);
  await new Promise<void>((resolve) => server!.once("listening", resolve));
  const { port } = server.address() as { port: number };
  return `http://127.0.0.1:${port}/mcp`;
}

describe("POST /mcp", () => {
  it("completes the MCP initialize handshake", async () => {
    const url = await startServer();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(url));
    await client.connect(transport);

    expect(client.getServerVersion()).toEqual({ name: "frank", version: "0.1.0" });

    await client.close();
  });
});
