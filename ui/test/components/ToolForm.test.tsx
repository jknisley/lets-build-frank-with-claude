import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToolForm, type ObjectJsonSchema } from "../../src/components/ToolForm.js";

describe("ToolForm", () => {
  it("renders no fields and submits an empty object for a schema with none", async () => {
    const onSubmit = vi.fn();
    const schema: ObjectJsonSchema = { type: "object", properties: {} };
    render(<ToolForm schema={schema} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("button", { name: "Call tool" }));

    expect(onSubmit).toHaveBeenCalledWith({});
  });

  it("collects scalar fields with correct types", async () => {
    const onSubmit = vi.fn();
    const schema: ObjectJsonSchema = {
      type: "object",
      properties: {
        name: { type: "string", description: "A name" },
        count: { type: "number" },
        active: { type: "boolean" },
      },
      required: ["name"],
    };
    render(<ToolForm schema={schema} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/name \(required\)/i), "frank");
    await userEvent.type(screen.getByLabelText("count"), "3");
    await userEvent.click(screen.getByLabelText("active"));
    await userEvent.click(screen.getByRole("button", { name: "Call tool" }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "frank", count: 3, active: true });
  });

  it("blocks submission and shows an error when a required field is empty", async () => {
    const onSubmit = vi.fn();
    const schema: ObjectJsonSchema = {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    };
    render(<ToolForm schema={schema} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("button", { name: "Call tool" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('"name" is required.')).toBeInTheDocument();
  });

  it("falls back to a raw-JSON field for unsupported schema shapes", async () => {
    const onSubmit = vi.fn();
    const schema: ObjectJsonSchema = {
      type: "object",
      properties: { tags: { type: "array" } as never },
    };
    render(<ToolForm schema={schema} onSubmit={onSubmit} />);

    expect(screen.getByText(/raw JSON/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/tags \(raw JSON\)/i), { target: { value: '["a","b"]' } });
    await userEvent.click(screen.getByRole("button", { name: "Call tool" }));

    expect(onSubmit).toHaveBeenCalledWith({ tags: ["a", "b"] });
  });
});
