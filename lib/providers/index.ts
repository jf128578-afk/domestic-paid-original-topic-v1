import { LocalCodexModelProvider } from "./local-codex-provider";
import { OpenAIModelProvider } from "./openai-model-provider";
import { OpenAIWebSearchProvider } from "./openai-search-provider";
import type { ModelProvider, SearchProvider } from "./types";

export function getModelProvider(modelOverride?: string): ModelProvider {
  const configured = process.env.MODEL_PROVIDER || "openai";
  if (configured === "local-codex") return new LocalCodexModelProvider();
  if (configured === "openai") return new OpenAIModelProvider(modelOverride);
  throw new Error(`UNSUPPORTED_MODEL_PROVIDER:${configured}`);
}

export function getSearchProvider(): SearchProvider {
  const configured = process.env.SEARCH_PROVIDER || "openai";
  if (configured === "openai") return new OpenAIWebSearchProvider();
  throw new Error(`UNSUPPORTED_SEARCH_PROVIDER:${configured}`);
}

export type { ModelProvider, SearchProvider } from "./types";
