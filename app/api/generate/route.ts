import { NextResponse } from "next/server";
import { demoResult } from "@/lib/demo-fixtures";
import {
  generationRequestSchema,
  resultSchemas,
} from "@/lib/contracts";
import {
  activeMode,
  activeModelName,
  generateWithModel,
  hasLiveModel,
} from "@/lib/model";

export const runtime = "edge";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 });
  }

  const checked = generationRequestSchema.safeParse(payload);
  if (!checked.success) {
    return NextResponse.json(
      { error: "缺少当前步骤所需的信息。" },
      { status: 400 },
    );
  }

  const { action, context } = checked.data;
  if (!hasLiveModel()) {
    const data = resultSchemas[action].parse(demoResult(action, context));
    return NextResponse.json({
      data,
      mode: "demo",
      notice: "当前未配置云端模型凭据，已使用比赛演示数据完成这一步。",
    });
  }

  try {
    const data = await generateWithModel({ action, context });
    return NextResponse.json({
      data,
      mode: activeMode(),
      model: activeModelName(),
    });
  } catch (error) {
    console.error("generation failed", error);
    const data = resultSchemas[action].parse(demoResult(action, context));
    return NextResponse.json({
      data,
      mode: "demo",
      fallback: true,
      notice: "真实模型或联网检索本次没有成功，已自动切换比赛演示数据；已确认内容不会丢失。",
    });
  }
}
