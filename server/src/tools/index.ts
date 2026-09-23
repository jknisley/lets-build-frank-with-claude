import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getStatusTool } from "./get-status.js";

export const ALLOWED_VERBS = ["get", "list", "search", "summarize"] as const;

export const tools = [getStatusTool];

export function registerAllTools(server: McpServer): void {
  for (const tool of tools) {
    server.registerTool(tool.name, tool.config, tool.handler);
  }
}
