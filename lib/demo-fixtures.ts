import type { GenerationAction, TopicCandidate } from "./contracts";

const option = (
  id: string,
  title: string,
  summary: string,
  reason: string,
  recommended = false,
  meta: Record<string, string> = {},
) => ({ id, title, summary, reason, recommended, meta });

const candidate = (
  id: string,
  title: string,
  oneLiner: string,
  coreHook: string,
  mainline: string,
  labels: string[],
  innovation: string,
  why: string,
  recommended: boolean,
  motherFramework: string,
  emotionReward: string,
  gameplay: string[],
): TopicCandidate => ({
  id,
  title,
  oneLiner,
  coreHook,
  mainline,
  labels,
  innovation,
  why,
  recommended,
  internal: { motherFramework, emotionReward, gameplay },
});

function text(context: Record<string, unknown>, key: string, fallback: string) {
  const value = context[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function demoResult(
  action: GenerationAction,
  context: Record<string, unknown>,
): unknown {
  switch (action) {
    case "a_hotspots":
      return {
        options: [
          option(
            "embryo",
            "婚外胚胎风波",
            "妻子尚未退出婚姻，丈夫已与第三者筹备完整的替代家庭。",
            "婚姻、生育、身份与财产集中在同一条“完整替代”价值轴上。",
            true,
            {
              conflict: "旧家庭仍在，替代家庭已被秘密启动",
              source: "交接包回归案例（演示数据）",
              publishedAt: "演示数据",
            },
          ),
          option(
            "eldercare",
            "赡养承诺变房产争夺",
            "承担多年照护的人被排除在房产分配之外，缺席亲属却突然要求均分。",
            "亲子/手足关系、养老投入与房产损失形成快速可懂的不公平。",
            false,
            {
              conflict: "付出者被清零，缺席者来分走结果",
              source: "产品演示素材",
              publishedAt: "演示数据",
            },
          ),
          option(
            "wedding",
            "婚礼前夜的共同账户",
            "婚礼前夜，女方发现共同账户被转空，男方全家却要求她照常完婚。",
            "婚姻承诺、共同财产与家族合谋形成明确损失和“凭什么”。",
            false,
            {
              conflict: "钱被转走，还要她配合维护体面",
              source: "产品演示素材",
              publishedAt: "演示数据",
            },
          ),
        ],
      };
    case "a_cuts": {
      const material = text(context, "material", "这段现实素材");
      return {
        options: [
          option(
            "replacement",
            "被提前替代的人生",
            `${material}的真正炸点不是一次背叛，而是当事人还未退出，对方已筹备完整替代方案。`,
            "从事件表层推进到身份、资源和未来被整体夺走的创作视角。",
            true,
          ),
          option(
            "alliance",
            "最亲近的人组成利益同盟",
            "伤害不是一个人的冲动，而是身边人共同维持、共同获利的长期安排。",
            "能把个体冲突升级为强关系共同体的清算。",
          ),
          option(
            "exit",
            "退出不是认输，而是断供",
            "被伤害者停止继续提供感情、资源和体面，让依赖她的一切开始失灵。",
            "天然连接后续的对称反杀，又不需要堆叠额外灾难。",
          ),
        ],
      };
    }
    case "a_frameworks":
      return {
        options: [
          option(
            "revenge",
            "复仇清算",
            "让试图清除、替代她的人，最终失去自己最想保住的关系、身份与资源。",
            "攻击与反击可以落在同一价值轴上，情绪回收最完整。",
            true,
            { payoff: "你想替代我，最后被清出局的是你" },
          ),
          option(
            "regret",
            "后悔打脸",
            "她彻底抽离并重新建立价值后，对方才发现失去的不可替代。",
            "后悔成立，但需要确保不把清算弱化成等待回头。",
            false,
            { payoff: "失去以后才知道，但已经晚了" },
          ),
          option(
            "identity",
            "身份反杀",
            "对方基于错误认知轻视和替代她，最终认知被彻底击穿。",
            "适合素材中存在被隐藏、被低估的真实身份或能力时。",
            false,
            { payoff: "你曾看不起的人，正是你永远够不到的人" },
          ),
        ],
      };
    case "a_reward": {
      const framework = text(context, "framework", "复仇清算");
      return {
        reward:
          framework.includes("后悔")
            ? "你失去以后才知道我不可替代，但我不会再回头。"
            : "你试图把我从人生里清除，最后被彻底清出局的人是你。",
        reason: "把前面的攻击方式原样回收到结局，形成同轴、对称的情绪兑现。",
      };
    }
    case "a_intensify":
      return {
        options: [
          option("identity-chain", "身份替代链", "让替代从感情延伸到公开身份与生活位置。", "始终围绕“完整替代”加压。", true),
          option("asset-chain", "利益共同体", "让财产安排与关系背叛互相证明，而非另起一条豪门线。", "钱成为替代计划的证据和工具。"),
          option("family-chain", "家族合谋", "亲属不是随机恶人，而是替代计划的知情者和受益者。", "强化孤立感，也为后续逐一清算建立因果。"),
          option("mirror", "对称清除", "前期怎样剥夺她的选择权，后期就怎样让对方失去掌控。", "攻击与反击命中同一价值。", true),
        ],
      };
    case "a_creative":
      return {
        options: [
          option("no-forgive", "不以原谅收尾", "对方后悔不是复合通行证，清算完成后女主继续向前。", "反写常规和解，同时不削弱付费情绪。", true),
          option("active-exit", "主动退出变主动断供", "她不靠突然获得外援，而是收回一直被对方占用的资源与能力。", "把抽离变成可见行动和新因果。"),
          option("false-winner", "替代者先赢后崩", "替代家庭短暂成形，却因原本被掩盖的利益结构从内部瓦解。", "让反转来自既有机制，而非空降身份。"),
        ],
      };
    case "a_candidates":
      return {
        options: [
          candidate(
            "a-final-1",
            "替代人生",
            "丈夫提前筹备替代家庭，原配让整套替代计划反噬所有参与者。",
            "她还没退出人生，他们已经在瓜分她的位置。",
            "发现替代计划 → 收回资源并拆解利益同盟 → 让策划替代她的人逐一失去位置。",
            ["原配清算", "复仇虐渣", "破镜不重圆"],
            "把婚外情改写为一场“完整人生替代”，所有放大都服务同一价值轴。",
            "戏剧核、情绪回报与对称清算最统一。",
            true,
            text(context, "framework", "复仇清算"),
            text(context, "reward", "你想替代我，最后被清出局的是你"),
            ["完整替代", "利益共同体", "对称清除"],
          ),
          candidate(
            "a-final-2",
            "断供之后",
            "被全家视作可替换的妻子突然断供，所有靠她维持的体面开始崩塌。",
            "他们以为失去的是一个妻子，实际失去的是整个家的支点。",
            "确认合谋 → 主动断供抽离 → 旧家庭因依赖链断裂而反噬。",
            ["追妻火葬场", "原配逆袭", "破镜不重圆"],
            "不靠空降豪门，用“收回被占用的价值”完成反转。",
            "更偏后悔流，情绪直观但复仇力度稍弱。",
            false,
            "后悔打脸",
            "失去以后才知道，但已经晚了",
            ["不可逆抽离", "价值断供"],
          ),
        ],
      };
    case "b_decompose": {
      const title = text(context, "title", "《人面桃花长相忆》");
      const peach = title.includes("人面桃花");
      const maid = title.includes("腹黑女佣");
      const zero = title.includes("零五") || title.includes("05");
      return {
        status: "resolved",
        message: "已按选题颗粒度完成公开资料识别；演示模式使用交接包回归信息。",
        alternatives: [],
        breakdown: maid
          ? {
              workTitle: title,
              sourceNote: "交接包 Case D（演示数据）",
              motherFramework: "复仇流",
              emotionFrame: "曾经欠下的债，被对应清算",
              coreHook: "高身份受害者以低位身份潜入仇人核心生活圈",
              baseMainline: "潜伏 → 反杀 → 清算",
              gameplayBundles: [
                { name: "高身份受害者 × 低身份潜伏者", functions: ["隐藏真实位置", "进入敌人生活圈", "获得信任", "制造身份反转"] },
                { name: "贴身关系中的对称清算", functions: ["近距离取证", "逐项回收旧债"] },
              ],
              reasons: "女佣只是载体，核心功能是以低位身份进入敌人核心生活圈并获得信任。",
              mustKeep: ["低位潜伏功能", "复仇主线", "对应清算"],
            }
          : zero
            ? {
                workTitle: title,
                sourceNote: "交接包 Case B（演示数据）",
                motherFramework: "后悔打脸 / 断亲逆袭",
                emotionFrame: "你失去以后才知道，但已经晚了",
                coreHook: "被家庭低估的人彻底断亲后变强，让曾经轻视他的人失去挽回资格",
                baseMainline: "断亲 → 赚钱/变强 → 打脸",
                gameplayBundles: [
                  { name: "不可逆断亲", functions: ["退出旧关系", "建立后悔前提"] },
                  { name: "反写常规和解", functions: ["拒绝包饺子式和解", "保持情绪兑现"] },
                  { name: "关系预期反写", functions: ["支持型恋人", "拒绝英雄救美"] },
                ],
                reasons: "创新在预期反写；哥哥失败、父亲求助等属于后续长线，不强塞进选题。",
                mustKeep: ["断亲主线", "后悔打脸", "不原谅", "选题与长线边界"],
              }
            : {
                workTitle: title,
                sourceNote: peach ? "交接包 Case C（演示数据）" : "演示识别结果",
                motherFramework: "后悔流 / 追妻火葬场",
                emotionFrame: "她不可逆抽离后，旧爱才开始后悔追妻",
                coreHook: "追爱者彻底抽离并改嫁一个看似更差的选择，旧爱被强刺激后追悔",
                baseMainline: "追爱 → 抽离/改嫁 → 后悔追妻",
                gameplayBundles: [
                  { name: "嫁植物人", functions: ["看似关系降级", "不可逆退出旧关系", "强刺激旧男主", "建立新关系", "后续新关系价值反转"] },
                  { name: "旧爱迟到的认知反转", functions: ["失去后确认价值", "形成追妻动力"] },
                ],
                reasons: "“嫁植物人”承担多个相互依赖的功能，必须作为玩法组合保留。",
                mustKeep: ["不可逆抽离", "玩法组合完整性", "后悔追妻情绪承诺"],
              },
      };
    }
    case "b_directions": {
      const mode = text(context, "mode", "replacement");
      const benchmark = JSON.stringify(context.confirmedBreakdown || {});
      const isZero = benchmark.includes("断亲") || benchmark.includes("零五");
      const isMaid = benchmark.includes("低位") || benchmark.includes("潜伏") || benchmark.includes("女佣");
      return {
        options:
          isZero
            ? [
                option("no-reconcile", "把“不原谅”做成核心承诺", "家人后悔只证明旧关系判断错误，不自动换来主角回归。", "强化后悔打脸，同时守住断亲的不可逆。", true),
                option("support-reversal", "让坚定支持成为关系反写", "新关系从嫌贫爱富改为看见并支持主角，但不替代主角完成逆袭。", "创新来自关系预期反写，不靠额外灾难。"),
                option("refuse-rescue", "拒绝英雄救美式和解", "旧关系遇险时，主角不再以拯救换取认可。", "把拒绝救赎落在已经确认的断亲价值轴上。"),
              ]
            : isMaid && mode === "upgrade"
              ? [
                  option("deeper-trust", "让信任成为清算工具", "受害者不是单纯潜入，而是让仇人主动交出最想隐藏的利益链。", "把低位潜伏与信任反噬做得更深。", true),
                  option("mirror-debt", "每一笔旧债对应回收", "当年怎样剥夺身份与尊严，后期就怎样逐项清算。", "保持复仇主线和对称兑现。"),
                  option("identity-pressure", "双重身份持续加压", "低位身份越受轻视，真实位置揭开时的认知击穿越强。", "放大既有身份机制，不另堆元素。"),
                ]
              : mode === "upgrade"
            ? [
                option("deeper-exit", "把抽离做得更不可逆", "不是换更多身份，而是让退出同时切断情感、利益和社会关系。", "深化原机制而不改变核心框架。", true),
                option("new-motive", "给新关系更强主动动机", "新关系不是工具人，而是基于共同利益与互相选择建立。", "让玩法升级来自新动机。"),
                option("symmetric-payback", "后悔与清算对称回收", "旧关系曾怎样轻视，后期就在哪个价值上被认知击穿。", "前后反差更大且因果清晰。"),
              ]
            : [
                option("caregiver", "护工潜入豪门", "保留低位身份进入核心生活圈并获得信任的功能，置换具体职业和冲突载体。", "功能完整，载体变化明显。", true),
                option("family-tutor", "家庭教师进入继承人家庭", "通过教育关系进入家族内部，获得孩子与核心成员信任。", "保留潜伏功能，同时产生新的关系压力。"),
                option("assistant", "危机助理接近仇人", "以解决危机为理由进入事业核心，逐步掌握利益链。", "从家庭空间置换到事业空间。"),
              ],
      };
    }
    case "b_candidates": {
      const benchmark = JSON.stringify(context.confirmedBreakdown || {});
      const isZero = benchmark.includes("断亲") || benchmark.includes("零五");
      const isMaid = benchmark.includes("低位") || benchmark.includes("潜伏") || benchmark.includes("女佣");
      if (isZero) {
        return {
          options: [
            candidate(
              "b-zero-1",
              "断亲以后",
              "被全家轻视的主角彻底断亲后独立变强，家人终于后悔时，他拒绝用和解换回旧位置。",
              "他们终于承认他重要，但他已经不需要这份迟到的认可。",
              "被轻视并断亲 → 自己赚钱变强 → 家人认知击穿 → 主角不原谅。",
              ["断亲逆袭", "后悔打脸", "不原谅"],
              "保留断亲逆袭主线，用“不原谅”和关系预期反写守住选题承诺。",
              "没有把哥哥失败、父亲重病等后续长线强塞进选题。",
              true,
              "后悔打脸 / 断亲逆袭",
              "你失去以后才知道，但已经晚了",
              ["不可逆断亲", "反写常规和解", "关系预期反写"],
            ),
            candidate(
              "b-zero-2",
              "这次我不救",
              "总被家人当作兜底工具的主角断亲创业，旧家再次求救时，他第一次拒绝牺牲自己。",
              "拒绝救他们，不是冷血，而是停止用自损购买亲情。",
              "长期兜底 → 彻底断亲 → 建立自己的事业与关系 → 拒绝旧家的再次索取。",
              ["断亲", "逆袭成长", "拒绝和解"],
              "把英雄救美式回头反写为拒绝救赎，让退出真正不可逆。",
              "更聚焦主角边界感，打脸外放程度略低。",
              false,
              "断亲逆袭",
              "迟到的需要，不再等于我的义务",
              ["停止兜底", "不可逆退出"],
            ),
          ],
        };
      }
      if (isMaid) {
        return {
          options: [
            candidate(
              "b-maid-1",
              "护工棋局",
              "失去身份的继承人以护工身份进入仇人家庭，借他们主动交出的信任逐项收回旧债。",
              "他们把最危险的人留在身边，还亲手把秘密交给了她。",
              "低位进入核心生活圈 → 获取信任与证据 → 恢复真实位置 → 对称清算。",
              ["身份反转", "潜伏复仇", "豪门清算"],
              "保留低位潜入和获得信任的功能，整体置换女佣载体为护工关系。",
              "功能保留完整，职业、关系压力和取证方式都发生整体变化。",
              true,
              "复仇流",
              "曾经欠下的债，被对应清算",
              ["低位潜伏", "核心生活圈", "信任反噬", "对称清算"],
            ),
            candidate(
              "b-maid-2",
              "继承人的家庭教师",
              "被夺走一切的受害者化身家庭教师接近仇人继承人，在教育与信任关系中撬开家族真相。",
              "她教孩子辨认谎言，也让整个家族的谎言无处可藏。",
              "隐藏身份进入家庭 → 获得孩子与核心成员信任 → 撬开利益链 → 完成清算。",
              ["潜伏复仇", "家庭博弈", "身份反杀"],
              "整体置换为教育关系，仍保留低位进入、贴身信任和近距离清算功能。",
              "新关系张力更强，但需要控制孩子不成为工具人。",
              false,
              "复仇流",
              "曾经欠下的债，被对应清算",
              ["低位潜入", "教育信任", "身份反转"],
            ),
          ],
        };
      }
      return {
        options: [
          candidate(
            "b-final-1",
            "桃花尽处",
            "她用一场不可逆改嫁退出旧爱人生，旧爱追来时才发现新关系早已完成价值反转。",
            "看似降级的改嫁，是她第一次真正选择自己。",
            "追爱受辱 → 不可逆抽离并建立新关系 → 旧爱认知击穿后追妻无门。",
            ["追妻火葬场", "破镜不重圆", "先婚后爱"],
            "保留“改嫁组合”的完整功能，同时把新关系从工具升级为主动选择。",
            "核心情绪与玩法功能保存最完整。",
            true,
            "后悔流 / 追妻火葬场",
            "失去以后才知道，但已经晚了",
            ["不可逆改嫁", "新关系价值反转"],
          ),
          candidate(
            "b-final-2",
            "旧爱迟来",
            "她切断与旧爱的全部共同利益后远走，旧爱在失去身份与资源支撑时才开始追悔。",
            "她离开的不只是关系，而是旧爱一直免费占用的人生支点。",
            "关系断裂 → 利益断供 → 旧爱失控追寻 → 女主拒绝回头。",
            ["追妻火葬场", "女性成长", "破镜不重圆"],
            "把抽离从感情退出升级为完整生活解绑。",
            "情绪更现实，但需要继续守住玩法辨识度。",
            false,
            "后悔流",
            "失去以后才知道，但已经晚了",
            ["完整解绑", "迟到后悔"],
          ),
        ],
      };
    }
    case "final_card": {
      const selected = context.selected as TopicCandidate | undefined;
      const route = context.route === "B" ? "B" : "A";
      const fallback = candidate(
        "fallback",
        "替代人生",
        "被提前替代的人夺回自己的人生，并让整套替代计划反噬。",
        "她还没退出，他们已经在瓜分她的位置。",
        "发现计划 → 主动抽离 → 对称清算",
        ["复仇虐渣", "原配清算"],
        "围绕同一价值轴完成反转。",
        "核心看点明确。",
        true,
        "复仇流",
        "欠下的债被对应清算",
        ["同轴放大"],
      );
      const item = selected || fallback;
      const benchmarkTitle = text(context, "benchmarkTitle", "");
      return {
        warnings: [],
        card: {
          names: [item.title, `${item.title}之后`, `不再回头`].slice(0, 3),
          coreHook: item.coreHook,
          labels: item.labels,
          benchmark:
            route === "B" && benchmarkTitle
              ? { title: benchmarkTitle, borrowed: `借鉴其${item.internal.gameplay.join("、")}的功能组合。` }
              : null,
          synopsis: `${item.mainline} 核心卖点是：${item.coreHook}`,
          direction: item.mainline.includes("→") ? item.mainline : null,
          internal: {
            route,
            motherFramework: item.internal.motherFramework,
            emotionReward: item.internal.emotionReward,
            coreHook: item.coreHook,
            baseMainline: item.mainline,
            gameplay: item.internal.gameplay,
            innovation: item.innovation,
            benchmark: route === "B" ? benchmarkTitle || null : null,
          },
        },
      };
    }
  }
}
