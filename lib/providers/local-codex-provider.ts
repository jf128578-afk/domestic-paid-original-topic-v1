import { z } from "zod";
import { resultSchemas } from "../contracts";
import { promptFor } from "../prompts";
import type { ModelProvider, ProviderGenerationInput } from "./types";

export class LocalCodexModelProvider implements ModelProvider {
  readonly id = "local-codex";
  readonly model = process.env.CODEX_MODEL || "";

  isConfigured() {
    return Boolean(process.env.LOCAL_CODEX_BRIDGE_URL && this.model);
  }

  async generate({ action, context }: ProviderGenerationInput) {
    const bridgeUrl = process.env.LOCAL_CODEX_BRIDGE_URL;
    if (!bridgeUrl) throw new Error("LOCAL_CODEX_NOT_CONFIGURED");
    const response = await fetch(`${bridgeUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        context,
        prompt: promptFor(action),
        schema: z.toJSONSchema(resultSchemas[action], {
          target: "draft-7",
          unrepresentable: "any",
        }),
      }),
    });
    if (!response.ok) throw new Error(`LOCAL_CODEX_FAILED:${response.status}`);
    const raw = (await response.json()) as { data?: unknown };
    return resultSchemas[action].parse(raw.data);
  }
}
