import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const ALLOWED_VERBS = ["get", "list", "search", "summarize"] as const;

interface ToolDefinition {
  name: string;
  config: Parameters<McpServer["registerTool"]>[1];
  handler: Parameters<McpServer["registerTool"]>[2];
}

export const tools: ToolDefinition[] = [];

export function registerAllTools(server: McpServer): void {
  for (const tool of tools) {
    server.registerTool(tool.name, tool.config, tool.handler);
  }
}
