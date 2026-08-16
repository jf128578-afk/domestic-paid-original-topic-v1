"use client";

import { useEffect, useState } from "react";
import type {
  BenchmarkBreakdown,
  ChoiceOption,
  GenerationAction,
  ReportCard,
  StudioState,
  TopicCandidate,
} from "@/lib/contracts";
import { confirmValue, newStudioState } from "@/lib/contracts";

const STORAGE_KEY = "paid-original-topic-v1";
const EMBRYO_CASE = "丈夫婚内出轨，并和第三者做试管。妻子仍在婚姻与人生中。";
const BENCHMARK_CASES = ["《零五逆袭》", "《人面桃花长相忆》", "《腹黑女佣》"];

type ApiEnvelope<T> = {
  data?: T;
  mode?: "local" | "live" | "demo";
  model?: string;
  fallback?: boolean;
  notice?: string;
  error?: string;
};

const A_STEPS = [
  ["a_source", "热点原料"],
  ["a_hotspots", "选择热点"],
  ["a_cuts", "核心炸点"],
  ["a_frameworks", "付费框架"],
  ["a_reward", "情绪回报"],
  ["a_intensify", "同轴放大"],
  ["a_creative", "创意升级"],
  ["a_candidates", "候选选题"],
  ["result", "汇报卡"],
] as const;

const B_STEPS = [
  ["b_source", "输入对标"],
  ["b_breakdown", "确认拆解"],
  ["b_mode", "创作模式"],
  ["b_directions", "选择方向"],
  ["b_candidates", "候选选题"],
  ["result", "汇报卡"],
] as const;

function asOptions(value: unknown): ChoiceOption[] {
  if (!value || typeof value !== "object" || !("options" in value)) return [];
  return ((value as { options?: ChoiceOption[] }).options || []);
}

function asCandidates(value: unknown): TopicCandidate[] {
  return asOptions(value) as unknown as TopicCandidate[];
}

function now() {
  return new Date().toISOString();
}

export default function TopicStudio() {
  const [state, setState] = useState<StudioState>(newStudioState);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [freeText, setFreeText] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as StudioState;
          if (parsed.version === 1) setState(parsed);
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const steps = state.route === "A" ? A_STEPS : state.route === "B" ? B_STEPS : [];
  const currentIndex = Math.max(0, steps.findIndex(([id]) => id === state.screen));
  const progress = steps.length ? Math.round(((currentIndex + 1) / steps.length) * 100) : 0;

  const patchState = (
    screen: string,
    draft: Record<string, unknown> = {},
    confirmed: StudioState["confirmed"] = {},
  ) => {
    setState((previous) => ({
      ...previous,
      screen,
      draft: { ...previous.draft, ...draft },
      confirmed: { ...previous.confirmed, ...confirmed },
      history: [...previous.history, { screen, at: now() }],
      updatedAt: now(),
    }));
    setFreeText("");
    setSelectedIds([]);
    setError("");
  };

  async function generate<T>(
    action: GenerationAction,
    context: Record<string, unknown>,
  ): Promise<T | null> {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, context }),
      });
      const envelope = (await response.json()) as ApiEnvelope<T>;
      if (!response.ok || !envelope.data) {
        setError(envelope.error || "这一步没有生成成功，请重试。");
        return null;
      }
      setState((previous) => ({
        ...previous,
        modelMode: envelope.mode || previous.modelMode,
        modelName: envelope.model || previous.modelName,
      }));
      setNotice(envelope.notice || "");
      return envelope.data;
    } catch {
      setError("暂时无法连接生成服务。已确认的内容仍然保留。 ");
      return null;
    } finally {
      setLoading(false);
    }
  }

  function chooseRoute(route: "A" | "B") {
    const fresh = newStudioState();
    setState({
      ...fresh,
      route,
      screen: route === "A" ? "a_source" : "b_source",
      history: [{ screen: route === "A" ? "a_source" : "b_source", at: now() }],
    });
  }

  async function loadHotspots() {
    const result = await generate<{ options: ChoiceOption[] }>("a_hotspots", {
      request: "近期适合国内付费短剧选题的中文现实热点",
    });
    if (result) patchState("a_hotspots", { hotspots: result });
  }

  async function loadCuts(material: string, selected?: ChoiceOption) {
    const result = await generate<{ options: ChoiceOption[] }>("a_cuts", { material });
    if (result) {
      patchState(
        "a_cuts",
        { cuts: result, material },
        selected ? { hotspot: confirmValue(selected, selected) } : { material: confirmValue(material, material) },
      );
    }
  }

  async function chooseCut(cut: ChoiceOption) {
    const result = await generate<{ options: ChoiceOption[] }>("a_frameworks", {
      material: state.draft.material,
      confirmedCut: cut,
    });
    if (result) patchState("a_frameworks", { frameworks: result }, { cut: confirmValue(cut, cut) });
  }

  async function chooseFramework(framework: ChoiceOption) {
    const result = await generate<{ reward: string; reason: string }>("a_reward", {
      material: state.draft.material,
      confirmedCut: state.confirmed.cut?.user,
      framework: framework.title,
    });
    if (result) {
      patchState("a_reward", { reward: result }, { framework: confirmValue(framework, framework) });
      setFreeText(result.reward);
    }
  }

  async function confirmReward() {
    const rewardData = state.draft.reward as { reward?: string; reason?: string } | undefined;
    const reward = freeText.trim() || rewardData?.reward || "";
    if (!reward) return setError("请确认核心情绪回报。 ");
    const result = await generate<{ options: ChoiceOption[] }>("a_intensify", {
      material: state.draft.material,
      confirmedCut: state.confirmed.cut?.user,
      framework: state.confirmed.framework?.user,
      confirmedReward: reward,
    });
    if (result) patchState("a_intensify", { intensify: result }, { reward: confirmValue(rewardData?.reward || reward, reward) });
  }

  async function confirmIntensify() {
    const options = asOptions(state.draft.intensify);
    const chosen = options.filter((item) => selectedIds.includes(item.id));
    if (freeText.trim()) {
      chosen.push({ id: "custom", title: "我的补充", summary: freeText.trim(), reason: "用户补充", recommended: false, meta: {} });
    }
    const result = await generate<{ options: ChoiceOption[] }>("a_creative", {
      confirmedCut: state.confirmed.cut?.user,
      framework: state.confirmed.framework?.user,
      reward: state.confirmed.reward?.user,
      intensifyDirections: chosen,
    });
    if (result) patchState("a_creative", { creative: result }, { intensify: confirmValue(chosen, chosen) });
  }

  async function confirmCreative(creative: ChoiceOption | null) {
    const result = await generate<{ options: TopicCandidate[] }>("a_candidates", {
      material: state.draft.material,
      confirmedCut: state.confirmed.cut?.user,
      framework: state.confirmed.framework?.user,
      reward: state.confirmed.reward?.user,
      intensifyDirections: state.confirmed.intensify?.user,
      creativeUpgrade: creative,
    });
    if (result) patchState("a_candidates", { candidates: result }, { creative: confirmValue(creative, creative) });
  }

  async function decomposeTitle(rawTitle: string) {
    const title = rawTitle.trim();
    if (!title) return setError("请输入作品名。 ");
    const result = await generate<{
      status: "resolved" | "ambiguous" | "insufficient";
      message: string;
      alternatives: ChoiceOption[];
      breakdown: BenchmarkBreakdown | null;
    }>("b_decompose", { title });
    if (!result) return;
    if (result.status !== "resolved" || !result.breakdown) {
      patchState("b_source", { benchmarkLookup: result });
      setError(result.message);
      return;
    }
    patchState("b_breakdown", { breakdown: result.breakdown, benchmarkTitle: title });
  }

  async function decomposeBenchmark() {
    await decomposeTitle(freeText);
  }

  function updateBreakdown(key: keyof BenchmarkBreakdown, value: unknown) {
    const current = state.draft.breakdown as BenchmarkBreakdown;
    setState((previous) => ({
      ...previous,
      draft: { ...previous.draft, breakdown: { ...current, [key]: value } },
      updatedAt: now(),
    }));
  }

  function confirmBreakdown() {
    const breakdown = state.draft.breakdown as BenchmarkBreakdown;
    patchState("b_mode", {}, { breakdown: confirmValue(breakdown, breakdown) });
  }

  async function chooseBenchmarkMode(mode: "replacement" | "upgrade") {
    const result = await generate<{ options: ChoiceOption[] }>("b_directions", {
      confirmedBreakdown: state.confirmed.breakdown?.user,
      mode,
    });
    if (result) patchState("b_directions", { directions: result, benchmarkMode: mode }, { benchmarkMode: confirmValue(mode, mode) });
  }

  async function refreshDirections() {
    const result = await generate<{ options: ChoiceOption[] }>("b_directions", {
      confirmedBreakdown: state.confirmed.breakdown?.user,
      mode: state.draft.benchmarkMode,
      userIdea: freeText.trim() || undefined,
      refresh: true,
    });
    if (result) patchState("b_directions", { directions: result });
  }

  async function chooseDirection(direction: ChoiceOption) {
    const result = await generate<{ options: TopicCandidate[] }>("b_candidates", {
      confirmedBreakdown: state.confirmed.breakdown?.user,
      mode: state.confirmed.benchmarkMode?.user,
      selectedDirection: direction,
      userIdea: freeText.trim() || undefined,
    });
    if (result) patchState("b_candidates", { candidates: result }, { direction: confirmValue(direction, direction) });
  }

  async function finish(candidate: TopicCandidate) {
    const result = await generate<{
      warnings: Array<{ issue: string; suggestion: string }>;
      card: ReportCard;
    }>("final_card", {
      route: state.route,
      selected: candidate,
      benchmarkTitle: state.draft.benchmarkTitle,
      confirmed: state.confirmed,
    });
    if (result) patchState("result", { final: result }, { candidate: confirmValue(candidate, candidate) });
  }

  function reset() {
    window.localStorage.removeItem(STORAGE_KEY);
    setState(newStudioState());
    setFreeText("");
    setSelectedIds([]);
    setError("");
    setNotice("");
  }

  const screen = (() => {
    if (state.screen === "route") return <RouteChoice onChoose={chooseRoute} />;
    if (state.screen === "a_source") {
      return (
        <Panel eyebrow="A｜原创选题" title="从一条现实原料开始" description="在国内付费短剧框架下，让 AI 找近期热点，或直接使用你手里的现实素材。自己有素材时不会被强制重新搜索。">
          <div className="action-grid">
            <button className="route-card compact" onClick={loadHotspots} disabled={loading}>
              <span className="route-index">A1</span><strong>AI 帮我找近期热点</strong><small>检索后只展示少量真正有戏的候选</small>
            </button>
            <div className="route-card compact input-card">
              <span className="route-index">A2</span><strong>我自己有现实素材</strong>
              <textarea value={freeText} onChange={(event) => setFreeText(event.target.value)} placeholder="用自然语言讲清事件即可，不需要专业字段" />
              <div className="sample-row"><span>比赛示范</span><button type="button" onClick={() => setFreeText(EMBRYO_CASE)}>填入婚外胚胎案例</button></div>
              <button className="primary" onClick={() => loadCuts(freeText)} disabled={loading || !freeText.trim()}>分析这条素材</button>
            </div>
          </div>
        </Panel>
      );
    }
    if (state.screen === "a_hotspots") {
      return <OptionScreen eyebrow="人工选择 ①" title="哪些热点真的有戏？" description="先按新鲜度呈现，再标注国内付费短剧适配推荐。热榜第一不等于最推荐。" options={asOptions(state.draft.hotspots)} onChoose={(item) => loadCuts(item.summary, item)} footer={<><button className="secondary" onClick={loadHotspots} disabled={loading}>换一批</button><button className="ghost" onClick={() => patchState("a_source")}>我自己输入素材</button></>} />;
    }
    if (state.screen === "a_cuts") {
      return <OptionScreen eyebrow="人工选择 ②" title="从哪里切，最炸？" description="同一个现实事件可以成为完全不同的故事。确认后，后续会始终以这个创作切法为核心。" options={asOptions(state.draft.cuts)} onChoose={chooseCut} custom={{ value: freeText, onChange: setFreeText, placeholder: "也可以写下你自己的创作切法", onSubmit: () => chooseCut({ id: "custom", title: "我的切法", summary: freeText.trim(), reason: "用户自定义", recommended: false, meta: {} }) }} />;
    }
    if (state.screen === "a_frameworks") {
      return <OptionScreen eyebrow="人工选择 ③" title="适合进入哪种付费情绪框架？" description="框架决定这是一场什么情绪游戏，不等于故事主线。" options={asOptions(state.draft.frameworks)} onChoose={chooseFramework} custom={{ value: freeText, onChange: setFreeText, placeholder: "接受、修改，或写一个自定义框架", onSubmit: () => chooseFramework({ id: "custom", title: freeText.trim(), summary: freeText.trim(), reason: "用户自定义", recommended: false, meta: {} }) }} />;
    }
    if (state.screen === "a_reward") {
      const reward = state.draft.reward as { reward?: string; reason?: string };
      return <Panel eyebrow="人工确认 ④" title="观众最终在等什么？" description="框架确认以后，先锁定核心情绪回报，再决定后面重点放大哪里。"><div className="focus-card"><label htmlFor="reward">核心情绪回报</label><textarea id="reward" value={freeText || reward?.reward || ""} onChange={(event) => setFreeText(event.target.value)} /><p>{reward?.reason}</p></div><button className="primary" onClick={confirmReward} disabled={loading}>确认并继续</button></Panel>;
    }
    if (state.screen === "a_intensify") {
      return <MultiSelectScreen options={asOptions(state.draft.intensify)} selected={selectedIds} onToggle={(id) => setSelectedIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])} freeText={freeText} onFreeText={setFreeText} onContinue={confirmIntensify} />;
    }
    if (state.screen === "a_creative") {
      return <OptionScreen eyebrow="创意升级" title="够狠以后，还能有什么新处理？" description="创意升级与情绪极致化分开。创新不能削弱已经确认的核心付费情绪。" options={asOptions(state.draft.creative)} onChoose={confirmCreative} footer={<button className="ghost" onClick={() => confirmCreative(null)} disabled={loading}>不额外采用，直接生成候选</button>} />;
    }
    if (state.screen === "b_source") {
      const lookup = state.draft.benchmarkLookup as { alternatives?: ChoiceOption[]; message?: string } | undefined;
      return <Panel eyebrow="B｜对标迭代" title="你想学习哪一部作品？" description="从成熟爆款出发，理解其有效机制，再通过对标置换或选题升级形成国内付费短剧新选题。最低只需要作品名。"><div className="focus-card"><label htmlFor="benchmark">作品名</label><input id="benchmark" value={freeText} onChange={(event) => setFreeText(event.target.value)} placeholder="例如：《人面桃花长相忆》；也可补充平台或主角" /><p>不需要先写一篇对标分析。</p><div className="sample-row"><span>比赛示范</span>{BENCHMARK_CASES.map((title) => <button type="button" key={title} onClick={() => setFreeText(title)}>{title}</button>)}</div></div>{lookup?.alternatives && lookup.alternatives.length > 0 && <div className="lookup-options"><strong>找到多个可能版本，请确认：</strong>{lookup.alternatives.map((item) => <button className="secondary" key={item.id} onClick={() => decomposeTitle(item.title)}>{item.title} — {item.summary}</button>)}</div>}<button className="primary" onClick={decomposeBenchmark} disabled={loading || !freeText.trim()}>识别并拆解</button></Panel>;
    }
    if (state.screen === "b_breakdown") {
      const breakdown = state.draft.breakdown as BenchmarkBreakdown;
      return <BreakdownEditor value={breakdown} onChange={updateBreakdown} onConfirm={confirmBreakdown} />;
    }
    if (state.screen === "b_mode") {
      return <Panel eyebrow="创作模式" title="这次想怎样学习对标？" description="两种模式都要保住核心情绪，并把情绪做到极致。"><div className="action-grid"><button className="route-card" onClick={() => chooseBenchmarkMode("replacement")} disabled={loading}><span className="route-index">模式一</span><strong>对标置换</strong><p>保留功能，整体置换背景、身份、冲突载体和玩法表现。</p><small>不是换名字、换职业、换城市</small></button><button className="route-card" onClick={() => chooseBenchmarkMode("upgrade")} disabled={loading}><span className="route-index">模式二</span><strong>选题升级</strong><p>保留框架和情绪承诺，把痛点、反差、机制或清算做得更深。</p><small>不是换得更多，而是换得更深</small></button></div></Panel>;
    }
    if (state.screen === "b_directions") {
      return <OptionScreen eyebrow="人工确认 ②" title="选择一个新方向" description="前台只保留少量真正不同的方向。你的自然语言想法会由 AI 理解并作用到相关层。" options={asOptions(state.draft.directions)} onChoose={chooseDirection} custom={{ value: freeText, onChange: setFreeText, placeholder: "我的想法：例如保留抽离机制，但换成现代职场关系", onSubmit: refreshDirections, label: "按我的想法重做" }} footer={<button className="secondary" onClick={refreshDirections} disabled={loading}>换一批</button>} />;
    }
    if (state.screen === "a_candidates" || state.screen === "b_candidates") {
      return <CandidateScreen candidates={asCandidates(state.draft.candidates)} onChoose={finish} />;
    }
    if (state.screen === "result") {
      const final = state.draft.final as { warnings: Array<{ issue: string; suggestion: string }>; card: ReportCard };
      return <ReportView final={final} onReset={reset} />;
    }
    return null;
  })();

  if (!hydrated) return <main className="studio-shell"><div className="loading-state">正在恢复你的确认状态…</div></main>;

  return (
    <main className="studio-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">剧</span><div><strong>专业短剧 AI 创作助手</strong><small>国内付费短剧｜选题决策</small></div></div>
        {state.route && <button className="text-button" onClick={reset}>重新开始</button>}
      </header>

      {state.route && (
        <div className="progress-wrap" aria-label={`当前进度 ${progress}%`}>
          <div className="progress-copy"><span>{state.route === "A" ? "原创选题" : "对标迭代"}</span><span>{progress}%</span></div>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          <div className="step-row">{steps.map(([id, label], index) => <span key={id} className={index <= currentIndex ? "active" : ""}>{label}</span>)}</div>
        </div>
      )}

      {state.modelMode === "demo" && (
        <div className="demo-banner"><strong>比赛演示模式</strong><span>{notice || "当前没有云端模型凭据，使用四个回归案例与预置业务数据；流程、确认和状态保存仍为真实交互。"}</span></div>
      )}
      {state.modelMode === "local" && (
        <div className="demo-banner"><strong>本机 Codex 模式</strong><span>当前使用已登录的 ChatGPT 账号生成{state.modelName ? ` · ${state.modelName}` : ""}。</span></div>
      )}
      {state.modelMode === "live" && (
        <div className="live-banner"><strong>真实生成模式</strong><span>当前结果来自云端模型{state.modelName ? ` · ${state.modelName}` : ""}；原创选题的热点检索与对标迭代的作品识别会读取公开网络资料。</span></div>
      )}

      <section className="workspace">{screen}</section>
      {loading && <div className="generating" role="status"><span /><div><strong>AI 正在处理当前步骤</strong><small>已确认的内容不会被改写</small></div></div>}
      {error && <div className="error-toast" role="alert">{error}</div>}
      <footer className="site-footer"><span>AI 扩大可能性，人决定方向。</span><span>当前开放：国内付费短剧｜选题决策</span></footer>
    </main>
  );
}

function RouteChoice({ onChoose }: { onChoose: (route: "A" | "B") => void }) {
  return <div className="hero"><div className="hero-copy"><span className="eyebrow">专业短剧 AI 创作助手</span><span className="showcase-badge">当前开放模块</span><h1>国内付费短剧<br />选题决策</h1><p>这是同一个国内付费选题模块的两种创作方式：从热点与现实素材创造原创选题，或从成熟爆款出发做对标迭代。AI 负责检索、拆解和发散，每个关键方向仍由你确认。</p><div className="case-note"><strong>真实生成 · 演示兜底</strong><span>云端服务不可用时，自动使用 4 个回归案例保证完整流程可继续体验。</span></div></div><div className="route-stack"><div className="route-group-label"><strong>选择一种创作方式</strong><span>两种入口共享同一套国内付费选题决策框架，并统一输出选题汇报卡。</span></div><button className="route-card" onClick={() => onChoose("A")}><span className="route-index">创作方式 A</span><strong>原创选题</strong><p>在国内付费短剧框架下，从近期热点、现实事件或你手里的素材出发，创造一个全新的选题。</p><span className="route-link">从现实原料开始 <b>→</b></span></button><button className="route-card dark" onClick={() => onChoose("B")}><span className="route-index">创作方式 B</span><strong>对标迭代</strong><p>从已有成熟爆款出发，理解其有效机制，再通过对标置换或选题升级形成一个新选题。</p><span className="route-link">从成熟作品开始 <b>→</b></span></button></div></div>;
}

function Panel({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <div className="panel"><div className="panel-heading"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{children}</div>;
}

function OptionScreen({ eyebrow, title, description, options, onChoose, custom, footer }: { eyebrow: string; title: string; description: string; options: ChoiceOption[]; onChoose: (option: ChoiceOption) => void; custom?: { value: string; onChange: (value: string) => void; placeholder: string; onSubmit: () => void; label?: string }; footer?: React.ReactNode }) {
  return <Panel eyebrow={eyebrow} title={title} description={description}><div className="option-list">{options.map((item) => <button key={item.id} className={`option-card ${item.recommended ? "recommended" : ""}`} onClick={() => onChoose(item)}><div className="option-top"><span>{item.recommended ? "AI 更推荐" : "可选方向"}</span><b>选择 →</b></div><h3>{item.title}</h3><p>{item.summary}</p><small>{item.reason}</small>{Object.keys(item.meta || {}).length > 0 && <div className="meta-list">{Object.entries(item.meta).map(([key, value]) => /^https?:\/\//.test(value) ? <a key={key} href={value} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>查看公开来源 ↗</a> : <span key={key}>{value}</span>)}</div>}</button>)}</div>{custom && <div className="custom-box"><label>我的想法</label><textarea value={custom.value} onChange={(event) => custom.onChange(event.target.value)} placeholder={custom.placeholder} /><button className="secondary" onClick={custom.onSubmit} disabled={!custom.value.trim()}>{custom.label || "使用我的想法"}</button></div>} {footer && <div className="button-row">{footer}</div>}</Panel>;
}

function MultiSelectScreen({ options, selected, onToggle, freeText, onFreeText, onContinue }: { options: ChoiceOption[]; selected: string[]; onToggle: (id: string) => void; freeText: string; onFreeText: (value: string) => void; onContinue: () => void }) {
  return <Panel eyebrow="人工参与 ⑤" title="让它更痛，也让它翻得更爽" description="可以多选、不选或补充。所有放大都应围绕同一价值轴，不靠热门元素堆叠。"><div className="check-grid">{options.map((item) => <label key={item.id} className={selected.includes(item.id) ? "checked" : ""}><input type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} /><span><strong>{item.title}</strong><p>{item.summary}</p><small>{item.reason}</small></span></label>)}</div><div className="custom-box"><label>我的补充（可选）</label><textarea value={freeText} onChange={(event) => onFreeText(event.target.value)} placeholder="例如：反击必须命中对方最看重的家族身份" /></div><button className="primary" onClick={onContinue}>继续做创意升级</button></Panel>;
}

function BreakdownEditor({ value, onChange, onConfirm }: { value: BenchmarkBreakdown; onChange: (key: keyof BenchmarkBreakdown, value: unknown) => void; onConfirm: () => void }) {
  const updateBundle = (index: number, field: "name" | "functions", next: string) => {
    const bundles = value.gameplayBundles.map((bundle, itemIndex) => itemIndex === index ? { ...bundle, [field]: field === "functions" ? next.split(/[\/、，,]/).map((item) => item.trim()).filter(Boolean) : next } : bundle);
    onChange("gameplayBundles", bundles);
  };
  const addBundle = () => {
    if (value.gameplayBundles.length < 4) onChange("gameplayBundles", [...value.gameplayBundles, { name: "新的玩法组合", functions: ["请补充它承担的功能"] }]);
  };
  return <Panel eyebrow="人工确认 ①" title="AI 对这部作品的理解" description="请确认、修改或增加你的理解。确认后，这一版会成为后续正式基准。"><div className="breakdown-grid"><Editable label="母框架" value={value.motherFramework} onChange={(next) => onChange("motherFramework", next)} /><Editable label="情绪框子" value={value.emotionFrame} onChange={(next) => onChange("emotionFrame", next)} /><Editable label="核心看点" value={value.coreHook} onChange={(next) => onChange("coreHook", next)} wide /><Editable label="基础主线" value={value.baseMainline} onChange={(next) => onChange("baseMainline", next)} wide /></div><div className="bundle-list"><div className="section-label">2～4 个玩法组合（可修改或增加）</div>{value.gameplayBundles.map((bundle, index) => <div className="bundle-edit" key={index}><input aria-label={`玩法组合 ${index + 1} 名称`} value={bundle.name} onChange={(event) => updateBundle(index, "name", event.target.value)} /><textarea aria-label={`玩法组合 ${index + 1} 功能`} value={bundle.functions.join(" / ")} onChange={(event) => updateBundle(index, "functions", event.target.value)} /></div>)}{value.gameplayBundles.length < 4 && <button className="ghost" onClick={addBundle}>+ 增加一个玩法组合</button>}</div><div className="breakdown-grid note-edit"><Editable label="我的理解 / 判断依据" value={value.reasons} onChange={(next) => onChange("reasons", next)} wide /><Editable label="不宜轻易丢失（用顿号分隔）" value={value.mustKeep.join("、")} onChange={(next) => onChange("mustKeep", next.split(/[、，,]/).map((item) => item.trim()).filter(Boolean))} wide /></div><button className="primary" onClick={onConfirm}>确认 AI 理解</button></Panel>;
}

function Editable({ label, value, onChange, wide = false }: { label: string; value: string; onChange: (value: string) => void; wide?: boolean }) {
  return <label className={wide ? "wide" : ""}><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function CandidateScreen({ candidates, onChoose }: { candidates: TopicCandidate[]; onChoose: (candidate: TopicCandidate) => void }) {
  return <Panel eyebrow="最终选择" title="留下少量真正不同的候选" description="这里仍然是选题层。选择一个方向后，系统只做轻量自检，再生成统一汇报卡。"><div className="candidate-grid">{candidates.map((item) => <article key={item.id} className={`candidate-card ${item.recommended ? "recommended" : ""}`}><div className="candidate-label">{item.recommended ? "AI 更推荐" : "候选选题"}</div><h3>{item.title}</h3><blockquote>{item.oneLiner}</blockquote><dl><div><dt>核心看点</dt><dd>{item.coreHook}</dd></div><div><dt>大概主线</dt><dd>{item.mainline}</dd></div><div><dt>创新 / 放大</dt><dd>{item.innovation}</dd></div></dl><div className="tag-row">{item.labels.map((label) => <span key={label}>{label}</span>)}</div><p className="candidate-why">{item.why}</p><button className="primary" onClick={() => onChoose(item)}>确认这个选题</button></article>)}</div></Panel>;
}

function ReportView({ final, onReset }: { final: { warnings: Array<{ issue: string; suggestion: string }>; card: ReportCard }; onReset: () => void }) {
  const { card, warnings } = final;
  return <div className="report-wrap"><div className="report-lead"><span className="eyebrow">选题模块完成</span><h2>统一选题汇报卡</h2><p>这张卡已经停在选题颗粒度，可以直接拿给编辑沟通。</p></div>{warnings.length > 0 && <div className="warning-box"><strong>轻量自检发现问题（未自动修改）</strong>{warnings.map((item) => <p key={item.issue}>{item.issue} — {item.suggestion}</p>)}</div>}<article className="report-card"><section><span className="field-no">01</span><div><h3>备选名</h3><div className="name-row">{card.names.map((name) => <strong key={name}>{name}</strong>)}</div></div></section><section className="featured"><span className="field-no">02</span><div><h3>核心看点</h3><blockquote>{card.coreHook}</blockquote></div></section><section><span className="field-no">03</span><div><h3>定位 / 常用标签</h3><div className="tag-row">{card.labels.map((label) => <span key={label}>{label}</span>)}</div></div></section>{card.benchmark && <section><span className="field-no">04</span><div><h3>借鉴对标</h3><strong>《{card.benchmark.title.replace(/[《》]/g, "")}》</strong><p>{card.benchmark.borrowed}</p></div></section>}<section><span className="field-no">{card.benchmark ? "05" : "04"}</span><div><h3>故事梗概</h3><p>{card.synopsis}</p></div></section>{card.direction && <section><span className="field-no">{card.benchmark ? "06" : "05"}</span><div><h3>大概走向</h3><p>{card.direction}</p></div></section>}</article><div className="report-actions"><button className="primary" onClick={() => window.print()}>打印 / 保存汇报卡</button><button className="secondary" onClick={onReset}>开始一个新选题</button></div></div>;
}
