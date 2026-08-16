import { z } from "zod";
import { resultSchemas } from "../contracts";
import { MODEL_CONFIG, promptFor } from "../prompts";
import { callOpenAIResponses, responseOutputText } from "./openai-responses";
import type { ModelProvider, ProviderGenerationInput } from "./types";

function outputSchema(action: ProviderGenerationInput["action"]) {
  return z.toJSONSchema(resultSchemas[action], {
    target: "draft-7",
    unrepresentable: "any",
  }) as Record<string, unknown>;
}

export class OpenAIModelProvider implements ModelProvider {
  readonly id = "openai";
  readonly model: string;

  constructor(modelOverride?: string) {
    this.model = modelOverride || MODEL_CONFIG.defaultModel;
  }

  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY && this.model);
  }

  async generate({ action, context, modelOverride }: ProviderGenerationInput) {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = modelOverride || this.model;
    if (!apiKey || !model) throw new Error("OPENAI_MODEL_NOT_CONFIGURED");
    const raw = await callOpenAIResponses({
      apiKey,
      model,
      reasoningEffort: MODEL_CONFIG.reasoningEffort,
      instructions: promptFor(action),
      input: JSON.stringify(context),
      schemaName: `${action}_result`,
      schema: outputSchema(action),
    });
    const text = responseOutputText(raw);
    if (!text) throw new Error("MODEL_RETURNED_NO_TEXT");
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("MODEL_RETURNED_INVALID_JSON");
    }
    return resultSchemas[action].parse(parsed);
  }
}
