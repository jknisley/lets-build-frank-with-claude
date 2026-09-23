import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToolsPage } from "../../src/pages/Tools.js";
import { listTools, callTool } from "../../src/mcpClient.js";

vi.mock("../../src/mcpClient.js", () => ({
  listTools: vi.fn(),
  callTool: vi.fn(),
}));

describe("ToolsPage", () => {
  it("discovers tools, renders a schema-driven form, and shows the call result", async () => {
    vi.mocked(listTools).mockResolvedValue([
      {
        name: "get_status",
        description: "Returns Frank's status.",
        inputSchema: { type: "object", properties: {} },
      },
    ] as never);
    vi.mocked(callTool).mockResolvedValue({
      isError: false,
      content: [{ type: "text", text: "ok" }],
      structuredContent: { greeting: "Hi, I'm Frank." },
    } as never);

    render(<ToolsPage />);

    await waitFor(() => expect(screen.getByText("get_status")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("radio"));
    await userEvent.click(screen.getByRole("button", { name: "Call tool" }));

    await waitFor(() => expect(callTool).toHaveBeenCalledWith("get_status", {}));
    await waitFor(() => expect(screen.getByText(/Hi, I'm Frank\./)).toBeInTheDocument());
  });

  it("shows a plain-language error when discovery fails", async () => {
    vi.mocked(listTools).mockRejectedValue(new Error("no tools for you"));

    render(<ToolsPage />);

    await waitFor(() => expect(screen.getByText("no tools for you")).toBeInTheDocument());
  });
});
