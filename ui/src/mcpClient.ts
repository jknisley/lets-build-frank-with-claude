import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// Same-origin, relative /mcp (ADR-006): Frank serves this console himself,
// so there is no VITE_FRANK_URL and no cross-origin request to configure.
const MCP_URL = new URL("/mcp", window.location.origin);

let connected: Promise<Client> | undefined;

function connect(): Promise<Client> {
  const client = new Client({ name: "frank-console", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(MCP_URL);
  return client.connect(transport).then(() => client);
}

// One shared, lazily-established session for the whole console: both pages
// call through this rather than each opening their own MCP connection.
function getClient(): Promise<Client> {
  if (!connected) {
    connected = connect().catch((error) => {
      connected = undefined;
      throw error;
    });
  }
  return connected;
}

export async function callTool(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
  const client = await getClient();
  return client.callTool({ name, arguments: args }) as Promise<CallToolResult>;
}
