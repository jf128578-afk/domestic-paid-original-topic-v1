type ResponsesRequest = {
  apiKey: string;
  model: string;
  reasoningEffort: string;
  instructions: string;
  input: string;
  schemaName: string;
  schema: Record<string, unknown>;
  tools?: Array<Record<string, unknown>>;
};

export function responseOutputText(response: unknown): string {
  if (!response || typeof response !== "object") return "";
  const data = response as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  if (data.output_text) return data.output_text;
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === "output_text")
    .map((item) => item.text || "")
    .join("");
}

export async function callOpenAIResponses(request: ResponsesRequest) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    const body: Record<string, unknown> = {
      model: request.model,
      reasoning: { effort: request.reasoningEffort },
      instructions: request.instructions,
      input: request.input,
      text: {
        verbosity: "medium",
        format: {
          type: "json_schema",
          name: request.schemaName,
          strict: true,
          schema: request.schema,
        },
      },
      store: false,
    };
    if (request.tools?.length) body.tools = request.tools;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${request.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`OPENAI_RESPONSES_FAILED:${response.status}:${detail.slice(0, 400)}`);
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}
