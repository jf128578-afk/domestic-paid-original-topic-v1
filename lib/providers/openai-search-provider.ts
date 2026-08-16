import { z } from "zod";
import { MODEL_CONFIG } from "../prompts";
import { callOpenAIResponses, responseOutputText } from "./openai-responses";
import type { SearchEvidence, SearchProvider, SearchPurpose } from "./types";

const searchEvidenceSchema = z.object({
  documents: z.array(z.object({
    title: z.string(),
    url: z.string(),
    publishedAt: z.string().nullable(),
    summary: z.string(),
  })).max(12),
  note: z.string(),
});

const SEARCH_INSTRUCTIONS: Record<SearchPurpose, string> = {
  recent_hotspots: `你是独立的公开网络检索层，不负责替用户做最终选题判断。检索近期中文公开网络信息，优先最近30天，必要时可扩展到90天。寻找涉及强关系、明确利益或损失、可辨认不公平处境的现实事件。返回6至12条来自可访问公开页面的证据，尽量覆盖不同事件；每条保留准确标题、URL、公开日期和事实摘要。不要编造链接，不要输出短剧评分。`,
  benchmark_identification: `你是独立的公开网络检索层。根据作品名搜索公开资料，用于识别影视、短剧、网文、漫画或其他叙事作品。重点收集能区分同名、多版本的信息：媒介类型、年份、平台、主创或主演、主要人物与可靠梗概。返回最多12条准确来源。若资料不足，照实说明，不得把同名作品资料混在一起。`,
};

export class OpenAIWebSearchProvider implements SearchProvider {
  readonly id = "openai-web-search";
  readonly model: string;

  constructor(modelOverride?: string) {
    this.model = modelOverride || process.env.OPENAI_SEARCH_MODEL || MODEL_CONFIG.defaultModel;
  }

  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY && this.model);
  }

  async search({ purpose, query }: { purpose: SearchPurpose; query: string; context: Record<string, unknown> }): Promise<SearchEvidence> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || !this.model) throw new Error("OPENAI_SEARCH_NOT_CONFIGURED");
    const raw = await callOpenAIResponses({
      apiKey,
      model: this.model,
      reasoningEffort: process.env.OPENAI_SEARCH_REASONING_EFFORT || "low",
      instructions: SEARCH_INSTRUCTIONS[purpose],
      input: `检索目的：${purpose}\n检索请求：${query}\n当前日期：${new Date().toISOString().slice(0, 10)}`,
      schemaName: `${purpose}_evidence`,
      schema: z.toJSONSchema(searchEvidenceSchema, {
        target: "draft-7",
        unrepresentable: "any",
      }) as Record<string, unknown>,
      tools: [{ type: "web_search" }],
    });
    const text = responseOutputText(raw);
    if (!text) throw new Error("SEARCH_RETURNED_NO_TEXT");
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("SEARCH_RETURNED_INVALID_JSON");
    }
    const evidence = searchEvidenceSchema.parse(parsed);
    return {
      purpose,
      query,
      searchedAt: new Date().toISOString(),
      ...evidence,
    };
  }
}
