import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { allowedScreeningReasons, regressionCases } from "../lib/regression-cases.mjs";

test("ships exactly the four handoff regression cases", () => {
  assert.deepEqual(regressionCases.map((item) => item.id), ["case-a-embryo", "case-b-zero-five", "case-c-peach", "case-d-maid"]);
  assert.deepEqual(regressionCases.map((item) => item.route), ["A", "B", "B", "B"]);
});

test("background screening stays within the frozen lightweight list", () => {
  assert.deepEqual(allowedScreeningReasons, ["重复", "明显跑偏", "明显削弱核心情绪", "无意义元素堆积", "明显逻辑冲突"]);
});

test("model and search providers stay separate and configurable", async () => {
  const [modelSource, promptSource, registrySource, searchSource] = await Promise.all([
    readFile(new URL("../lib/model.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/prompts.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/providers/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/providers/openai-search-provider.ts", import.meta.url), "utf8"),
  ]);
  assert.match(modelSource, /getModelProvider/);
  assert.match(modelSource, /getSearchProvider/);
  assert.match(modelSource, /a_hotspots: "recent_hotspots"/);
  assert.match(modelSource, /b_decompose: "benchmark_identification"/);
  assert.match(promptSource, /process\.env\.OPENAI_MODEL \|\| "gpt-5\.6-sol"/);
  assert.match(registrySource, /MODEL_PROVIDER/);
  assert.match(registrySource, /SEARCH_PROVIDER/);
  assert.match(searchSource, /tools: \[\{ type: "web_search" \}\]/);
  assert.doesNotMatch(`${modelSource}\n${searchSource}`, /NEXT_PUBLIC_OPENAI_API_KEY/);
});
