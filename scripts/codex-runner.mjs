import { Codex } from "@openai/codex-sdk";

const DEFAULT_TIMEOUT_MS = 180_000;

function codexClient() {
  const options = {};
  if (process.env.CODEX_CLI_PATH) {
    options.codexPathOverride = process.env.CODEX_CLI_PATH;
  }
  return new Codex(options);
}

export async function runCodexStructured({
  model,
  prompt,
  schema,
  enableSearch = false,
  timeoutMs = Number(process.env.CODEX_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
  workingDirectory = process.cwd(),
}) {
  if (!model) throw new Error("CODEX_MODEL_NOT_CONFIGURED");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const thread = codexClient().startThread({
      model,
      modelReasoningEffort: process.env.CODEX_REASONING_EFFORT || "medium",
      sandboxMode: "read-only",
      approvalPolicy: "never",
      workingDirectory,
      skipGitRepoCheck: true,
      webSearchMode: enableSearch ? "live" : "disabled",
      networkAccessEnabled: enableSearch,
    });
    const turn = await thread.run(prompt, {
      outputSchema: schema,
      signal: controller.signal,
    });
    if (!turn.finalResponse) throw new Error("CODEX_RETURNED_NO_TEXT");

    try {
      return {
        data: JSON.parse(turn.finalResponse),
        usage: turn.usage,
        threadId: thread.id,
      };
    } catch {
      throw new Error("CODEX_RETURNED_INVALID_JSON");
    }
  } finally {
    clearTimeout(timer);
  }
}
