import assert from "node:assert/strict";
import test from "node:test";

async function worker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const ctx = { waitUntil() {}, passThroughOnException() {} };

test("renders the finished topic decision product", async () => {
  const response = await (await worker()).fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), env, ctx);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>选题决策｜国内付费原创 V1<\/title>/);
  assert.match(html, /正在恢复你的确认状态/);
  assert.match(html, /TopicStudio-/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/);
});

test("demo generation endpoint returns a valid A-route decision", async () => {
  const response = await (await worker()).fetch(new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "a_hotspots", context: { request: "test" } }),
  }), env, ctx);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.mode, "demo");
  assert.match(body.notice, /未配置云端模型凭据/);
  assert.ok(body.data.options.length >= 3);
  assert.ok(body.data.options.some((item) => item.recommended));
  assert.ok(body.data.options.every((item) => typeof item.reason === "string"));
});

test("all frozen A and B stages have a valid demo response", async () => {
  const actions = [
    ["a_cuts", { material: "现实素材" }],
    ["a_frameworks", { confirmedCut: "完整替代" }],
    ["a_reward", { framework: "复仇清算" }],
    ["a_intensify", { reward: "对应清算" }],
    ["a_creative", { intensifyDirections: [] }],
    ["a_candidates", { material: "现实素材" }],
    ["b_decompose", { title: "《人面桃花长相忆》" }],
    ["b_directions", { mode: "replacement" }],
    ["b_candidates", { mode: "upgrade" }],
  ];
  const app = await worker();
  for (const [action, context] of actions) {
    const response = await app.fetch(new Request("http://localhost/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, context }),
    }), env, ctx);
    assert.equal(response.status, 200, `${action} should succeed`);
    const body = await response.json();
    assert.equal(body.mode, "demo");
    assert.ok(body.data);
  }
});

test("live A hotspot path performs search before business generation", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const calls = [];
  process.env.OPENAI_API_KEY = "test-server-secret";
  globalThis.fetch = async (input, init) => {
    if (String(input) === "https://api.openai.com/v1/responses") {
      const body = JSON.parse(String(init.body));
      calls.push(body);
      const output = body.tools
        ? {
            documents: [
              {
                title: "近期公开事件",
                url: "https://example.com/public-event",
                publishedAt: "2026-08-15",
                summary: "强关系中的明确利益损失与不公平处境。",
              },
            ],
            note: "公开资料检索完成",
          }
        : {
            options: [
              { id: "1", title: "事件一", summary: "关系与利益冲突一", reason: "适合短剧", recommended: true, meta: { source: "近期公开事件", url: "https://example.com/public-event", date: "2026-08-15" } },
              { id: "2", title: "事件二", summary: "关系与利益冲突二", reason: "可形成清算", recommended: false, meta: { source: "公开来源", url: "https://example.com/two", date: "2026-08-14" } },
              { id: "3", title: "事件三", summary: "关系与利益冲突三", reason: "存在不公平", recommended: false, meta: { source: "公开来源", url: "https://example.com/three", date: "2026-08-13" } },
            ],
          };
      return new Response(JSON.stringify({ output_text: JSON.stringify(output) }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return originalFetch(input, init);
  };

  try {
    const response = await (await worker()).fetch(new Request("http://localhost/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "a_hotspots", context: { request: "最近的家庭财产热点" } }),
    }), env, ctx);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.mode, "live");
    assert.equal(body.model, "gpt-5.6-sol");
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0].tools, [{ type: "web_search" }]);
    assert.match(calls[1].input, /searchEvidence/);
    assert.equal(body.data.options[0].meta.url, "https://example.com/public-event");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
});

test("live B path searches a new title and preserves ambiguity confirmation", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const calls = [];
  process.env.OPENAI_API_KEY = "test-server-secret";
  globalThis.fetch = async (input, init) => {
    if (String(input) === "https://api.openai.com/v1/responses") {
      const body = JSON.parse(String(init.body));
      calls.push(body);
      const output = body.tools
        ? {
            documents: [
              { title: "同名短剧资料", url: "https://example.com/drama", publishedAt: "2026-01-02", summary: "2026年短剧版本，平台甲。" },
              { title: "同名小说资料", url: "https://example.com/novel", publishedAt: "2024-03-04", summary: "2024年网络小说版本。" },
            ],
            note: "发现两个同名版本",
          }
        : {
            status: "ambiguous",
            message: "找到同名短剧与小说，请确认版本。",
            alternatives: [
              { id: "drama", title: "《新作品》· 2026短剧版（平台甲）", summary: "短剧版本", reason: "公开资料显示为2026年短剧", recommended: true, meta: { source: "同名短剧资料" } },
              { id: "novel", title: "《新作品》· 2024网文版", summary: "网络小说版本", reason: "公开资料显示为2024年网文", recommended: false, meta: { source: "同名小说资料" } },
            ],
            breakdown: null,
          };
      return new Response(JSON.stringify({ output_text: JSON.stringify(output) }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return originalFetch(input, init);
  };
  try {
    const response = await (await worker()).fetch(new Request("http://localhost/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "b_decompose", context: { title: "《新作品》" } }),
    }), env, ctx);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.mode, "live");
    assert.equal(body.data.status, "ambiguous");
    assert.equal(body.data.breakdown, null);
    assert.equal(body.data.alternatives.length, 2);
    assert.equal(calls.length, 2);
    assert.match(calls[0].instructions, /同名、多版本/);
    assert.match(calls[1].input, /同名短剧资料/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
});

test("live provider failure falls back without breaking the confirmed flow", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-server-secret";
  globalThis.fetch = async (input, init) => {
    if (String(input) === "https://api.openai.com/v1/responses") {
      return new Response("temporary failure", { status: 503 });
    }
    return originalFetch(input, init);
  };
  try {
    const response = await (await worker()).fetch(new Request("http://localhost/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "a_reward", context: { framework: "复仇清算" } }),
    }), env, ctx);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.mode, "demo");
    assert.equal(body.fallback, true);
    assert.match(body.notice, /自动切换比赛演示数据/);
    assert.ok(body.data.reward);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
});
