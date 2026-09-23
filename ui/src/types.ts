// Mirrors server/src/tools/get-status.ts's outputSchema. The Overview page is
// wired specifically to get_status (ADR-003), unlike the generic Tools page.
export interface GetStatusResult {
  summary: string;
  version: string;
  uptimeSeconds: number;
  greeting: string;
}
