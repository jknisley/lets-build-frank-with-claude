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
  it("discovers and calls get_status over Streamable HTTP", async () => {
    const url = await startServer();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(url));
    await client.connect(transport);

    const tools = await client.listTools();
    expect(tools.tools.map((t) => t.name)).toContain("get_status");

    const result = await client.callTool({ name: "get_status", arguments: {} });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toMatchObject({
      greeting: "Hi, I'm Frank.",
    });

    await client.close();
  });

  it("rejects unknown fields on get_status input", async () => {
    const url = await startServer();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(url));
    await client.connect(transport);

    const result = await client.callTool({
      name: "get_status",
      arguments: { unexpected: "field" },
    });
    expect(result.isError).toBe(true);

    await client.close();
  });
});
