import { useEffect, useState } from "react";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { callTool } from "../mcpClient.js";
import type { GetStatusResult } from "../types.js";

type Health = { state: "connecting" } | { state: "ok"; status: GetStatusResult } | { state: "error"; message: string };

export function Overview() {
  const [health, setHealth] = useState<Health>({ state: "connecting" });

  useEffect(() => {
    let cancelled = false;
    callTool("get_status", {})
      .then((result) => {
        if (cancelled) return;
        if (result.isError) {
          setHealth({ state: "error", message: textOf(result) ?? "get_status returned an error." });
          return;
        }
        setHealth({ state: "ok", status: result.structuredContent as unknown as GetStatusResult });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setHealth({ state: "error", message: error instanceof Error ? error.message : String(error) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ContentLayout header={<Header variant="h1">Overview</Header>}>
      <Container header={<Header variant="h2">Connection health</Header>}>
        <SpaceBetween size="m">
          {health.state === "connecting" && <StatusIndicator type="loading">Connecting to Frank…</StatusIndicator>}
          {health.state === "error" && <StatusIndicator type="error">{health.message}</StatusIndicator>}
          {health.state === "ok" && <StatusIndicator type="success">Connected</StatusIndicator>}
          {health.state === "ok" && (
            <KeyValuePairs
              columns={3}
              items={[
                { label: "Version", value: health.status.version },
                { label: "Uptime", value: `${health.status.uptimeSeconds}s` },
                { label: "Greeting", value: health.status.greeting },
              ]}
            />
          )}
        </SpaceBetween>
      </Container>
    </ContentLayout>
  );
}

function textOf(result: { content?: Array<{ type: string; text?: string }> }): string | undefined {
  return result.content?.find((c) => c.type === "text")?.text;
}
