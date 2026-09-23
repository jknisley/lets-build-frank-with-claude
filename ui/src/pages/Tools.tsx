import { useEffect, useState } from "react";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Table from "@cloudscape-design/components/table";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Box from "@cloudscape-design/components/box";
import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { listTools, callTool } from "../mcpClient.js";
import { ToolForm, type ObjectJsonSchema } from "../components/ToolForm.js";

type Discovery = { state: "loading" } | { state: "ok"; tools: Tool[] } | { state: "error"; message: string };

export function ToolsPage() {
  const [discovery, setDiscovery] = useState<Discovery>({ state: "loading" });
  const [selected, setSelected] = useState<Tool | undefined>();
  const [result, setResult] = useState<CallToolResult | undefined>();
  const [callError, setCallError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    listTools()
      .then((tools) => {
        if (!cancelled) setDiscovery({ state: "ok", tools });
      })
      .catch((error: unknown) => {
        if (!cancelled) setDiscovery({ state: "error", message: error instanceof Error ? error.message : String(error) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function selectTool(tool: Tool) {
    setSelected(tool);
    setResult(undefined);
    setCallError(undefined);
  }

  async function invoke(args: Record<string, unknown>) {
    if (!selected) return;
    setCallError(undefined);
    setResult(undefined);
    try {
      const callResult = await callTool(selected.name, args);
      setResult(callResult);
    } catch (error) {
      setCallError(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <ContentLayout header={<Header variant="h1">Tools</Header>}>
      <SpaceBetween size="l">
        <Container header={<Header variant="h2">Discovered tools</Header>}>
          {discovery.state === "loading" && <StatusIndicator type="loading">Discovering tools…</StatusIndicator>}
          {discovery.state === "error" && <StatusIndicator type="error">{discovery.message}</StatusIndicator>}
          {discovery.state === "ok" && (
            <Table<Tool>
              columnDefinitions={[
                { id: "name", header: "Name", cell: (tool) => tool.name },
                { id: "description", header: "Description", cell: (tool) => tool.description ?? "" },
              ]}
              items={discovery.tools}
              trackBy="name"
              selectionType="single"
              selectedItems={selected ? [selected] : []}
              onSelectionChange={(event) => selectTool(event.detail.selectedItems[0])}
              empty="Frank has no tools registered."
            />
          )}
        </Container>

        {selected && (
          <Container header={<Header variant="h2">{selected.name}</Header>}>
            <SpaceBetween size="l">
              <ToolForm schema={selected.inputSchema as ObjectJsonSchema} onSubmit={invoke} />
              {callError && <StatusIndicator type="error">{callError}</StatusIndicator>}
              {result && (
                <Box variant="pre">{JSON.stringify(result.structuredContent ?? result.content, null, 2)}</Box>
              )}
            </SpaceBetween>
          </Container>
        )}
      </SpaceBetween>
    </ContentLayout>
  );
}
