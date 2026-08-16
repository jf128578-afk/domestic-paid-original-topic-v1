import type { GenerationAction } from "./contracts";
import { getModelProvider, getSearchProvider } from "./providers";

type ModelCall = {
  action: GenerationAction;
  context: Record<string, unknown>;
  modelOverride?: string;
};

const SEARCH_ACTIONS: Partial<Record<GenerationAction, "recent_hotspots" | "benchmark_identification">> = {
  a_hotspots: "recent_hotspots",
  b_decompose: "benchmark_identification",
};

function searchQuery(action: GenerationAction, context: Record<string, unknown>) {
  if (action === "a_hotspots") {
    return typeof context.request === "string"
      ? context.request
      : "近期适合国内付费短剧选题的中文现实热点";
  }
  return typeof context.title === "string" ? context.title : "";
}

export function hasLiveModel() {
  try {
    return getModelProvider().isConfigured();
  } catch {
    return false;
  }
}

export function activeModelName() {
  try {
    return getModelProvider().model;
  } catch {
    return undefined;
  }
}

export function activeMode(): "local" | "live" {
  return getModelProvider().id === "local-codex" ? "local" : "live";
}

export async function generateWithModel({ action, context, modelOverride }: ModelCall) {
  const modelProvider = getModelProvider(modelOverride);
  if (!modelProvider.isConfigured()) throw new Error("MODEL_PROVIDER_NOT_CONFIGURED");

  let enrichedContext = context;
  const purpose = SEARCH_ACTIONS[action];
  if (purpose) {
    const searchProvider = getSearchProvider();
    if (!searchProvider.isConfigured()) throw new Error("SEARCH_PROVIDER_NOT_CONFIGURED");
    const searchEvidence = await searchProvider.search({
      purpose,
      query: searchQuery(action, context),
      context,
    });
    enrichedContext = {
      ...context,
      searchEvidence,
      searchProvider: searchProvider.id,
    };
  }

  return modelProvider.generate({ action, context: enrichedContext, modelOverride });
}
