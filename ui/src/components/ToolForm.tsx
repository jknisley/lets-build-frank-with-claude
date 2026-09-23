import { useState } from "react";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Checkbox from "@cloudscape-design/components/checkbox";
import Select from "@cloudscape-design/components/select";
import Textarea from "@cloudscape-design/components/textarea";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";

export interface JsonSchemaProperty {
  type?: string;
  description?: string;
  enum?: string[];
}

export interface ObjectJsonSchema {
  type: "object";
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

// Supports the bounded subset of JSON Schema Frank's tools use today: strict
// objects of scalar (string/number/integer/boolean) or string-enum fields.
// Anything else falls back to a raw-JSON field, visibly, rather than being
// silently dropped from the form.
const SUPPORTED_SCALAR_TYPES = ["string", "number", "integer", "boolean"];

function isSupported(prop: JsonSchemaProperty): boolean {
  if (prop.enum) return true;
  return SUPPORTED_SCALAR_TYPES.includes(prop.type ?? "");
}

type FieldValue = string | boolean;

export function ToolForm({
  schema,
  onSubmit,
  submitLabel = "Call tool",
}: {
  schema: ObjectJsonSchema;
  onSubmit: (args: Record<string, unknown>) => void;
  submitLabel?: string;
}) {
  const properties = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  const fieldNames = Object.keys(properties);

  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [rawJson, setRawJson] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | undefined>();

  function setField(name: string, value: FieldValue) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(undefined);

    const args: Record<string, unknown> = {};
    for (const name of fieldNames) {
      const prop = properties[name];
      if (!isSupported(prop)) {
        const raw = rawJson[name];
        if (raw !== undefined && raw.trim() !== "") {
          try {
            args[name] = JSON.parse(raw);
          } catch {
            setError(`"${name}" must be valid JSON.`);
            return;
          }
        } else if (required.has(name)) {
          setError(`"${name}" is required.`);
          return;
        }
        continue;
      }

      const value = values[name];
      if (value === undefined || value === "") {
        if (required.has(name)) {
          setError(`"${name}" is required.`);
          return;
        }
        continue;
      }
      args[name] = prop.type === "number" || prop.type === "integer" ? Number(value) : value;
    }

    onSubmit(args);
  }

  if (fieldNames.length === 0) {
    return (
      <form onSubmit={handleSubmit}>
        <Form actions={<Button variant="primary">{submitLabel}</Button>} />
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Form
        errorText={error}
        actions={
          <Button variant="primary" formAction="submit">
            {submitLabel}
          </Button>
        }
      >
        <SpaceBetween size="m">
          {fieldNames.map((name) => {
            const prop = properties[name];
            const label = required.has(name) ? `${name} (required)` : name;

            if (prop.enum) {
              const options = prop.enum.map((option) => ({ label: option, value: option }));
              const selected = options.find((o) => o.value === values[name]) ?? null;
              return (
                <FormField key={name} label={label} description={prop.description}>
                  <Select
                    selectedOption={selected}
                    options={options}
                    onChange={(e) => setField(name, e.detail.selectedOption.value ?? "")}
                    placeholder="Choose a value"
                  />
                </FormField>
              );
            }

            if (prop.type === "boolean") {
              return (
                <FormField key={name} label={label} description={prop.description}>
                  <Checkbox
                    checked={values[name] === true}
                    onChange={(e) => setField(name, e.detail.checked)}
                  />
                </FormField>
              );
            }

            if (prop.type === "number" || prop.type === "integer") {
              return (
                <FormField key={name} label={label} description={prop.description}>
                  <Input
                    type="number"
                    value={typeof values[name] === "string" ? values[name] : ""}
                    onChange={(e) => setField(name, e.detail.value)}
                  />
                </FormField>
              );
            }

            if (prop.type === "string") {
              return (
                <FormField key={name} label={label} description={prop.description}>
                  <Input
                    value={typeof values[name] === "string" ? values[name] : ""}
                    onChange={(e) => setField(name, e.detail.value)}
                  />
                </FormField>
              );
            }

            return (
              <FormField
                key={name}
                label={`${label} (raw JSON)`}
                description={prop.description ?? "This field's schema isn't a scalar or enum — enter its value as JSON."}
              >
                <Textarea
                  value={rawJson[name] ?? ""}
                  onChange={(e) => setRawJson((prev) => ({ ...prev, [name]: e.detail.value }))}
                />
              </FormField>
            );
          })}
        </SpaceBetween>
      </Form>
    </form>
  );
}
