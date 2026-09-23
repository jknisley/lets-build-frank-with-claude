import express, { type Express, type Request, type Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadConfig, type Config } from "./config.js";
import { createMcpServer } from "./mcp/server.js";

function methodNotAllowed(_req: Request, res: Response): void {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
}

export function createApp(config: Config = loadConfig()): Express {
  const app = express();
  app.use(express.json());

  app.get("/healthz", (_req, res) => {
    res.status(200).send("ok");
  });

  // Stateless Streamable HTTP: a fresh McpServer + transport per request.
  // Frank's tools are read-only and idempotent, so there is no session state
  // worth keeping across requests, and this avoids ever leaking a session.
  app.post("/mcp", async (req, res) => {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });
  app.get("/mcp", methodNotAllowed);
  app.delete("/mcp", methodNotAllowed);

  const indexHtml = path.join(config.publicDir, "index.html");
  if (existsSync(indexHtml)) {
    app.use(express.static(config.publicDir));
    // SPA fallback for client-side console routes. /healthz and /mcp are
    // matched by the routes above and never reach here.
    app.get(/.*/, (_req, res) => {
      res.sendFile(indexHtml);
    });
  } else {
    // ADR-003: the console is built late in the class. Frank must deploy and
    // serve MCP long before it exists.
    app.get("/", (_req, res) => {
      res
        .type("text/plain")
        .send("Frank is running. The console hasn't been built yet (ADR-003) — talk to him at POST /mcp.");
    });
  }

  return app;
}
