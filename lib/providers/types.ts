import type { GenerationAction } from "../contracts";

export type ProviderGenerationInput = {
  action: GenerationAction;
  context: Record<string, unknown>;
  modelOverride?: string;
};

export interface ModelProvider {
  readonly id: string;
  readonly model: string;
  isConfigured(): boolean;
  generate(input: ProviderGenerationInput): Promise<unknown>;
}

export type SearchPurpose = "recent_hotspots" | "benchmark_identification";

export type SearchDocument = {
  title: string;
  url: string;
  publishedAt: string | null;
  summary: string;
};

export type SearchEvidence = {
  purpose: SearchPurpose;
  query: string;
  searchedAt: string;
  documents: SearchDocument[];
  note: string;
};

export interface SearchProvider {
  readonly id: string;
  readonly model: string;
  isConfigured(): boolean;
  search(input: {
    purpose: SearchPurpose;
    query: string;
    context: Record<string, unknown>;
  }): Promise<SearchEvidence>;
}
