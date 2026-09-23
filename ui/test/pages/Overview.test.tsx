import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Overview } from "../../src/pages/Overview.js";
import { callTool } from "../../src/mcpClient.js";

vi.mock("../../src/mcpClient.js", () => ({
  callTool: vi.fn(),
}));

describe("Overview", () => {
  it("shows connecting, then the status once get_status resolves", async () => {
    vi.mocked(callTool).mockResolvedValue({
      isError: false,
      content: [{ type: "text", text: "Frank v0.1.0 has been up for 5s." }],
      structuredContent: { summary: "...", version: "0.1.0", uptimeSeconds: 5, greeting: "Hi, I'm Frank." },
    } as never);

    render(<Overview />);

    expect(screen.getByText(/connecting to frank/i)).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("Connected")).toBeInTheDocument());
    expect(screen.getByText("0.1.0")).toBeInTheDocument();
    expect(screen.getByText("5s")).toBeInTheDocument();
    expect(callTool).toHaveBeenCalledWith("get_status", {});
  });

  it("shows a plain-language error when get_status fails", async () => {
    vi.mocked(callTool).mockRejectedValue(new Error("connection refused"));

    render(<Overview />);

    await waitFor(() => expect(screen.getByText("connection refused")).toBeInTheDocument());
  });
});
