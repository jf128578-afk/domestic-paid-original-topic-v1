import { z } from "zod";

export const actionSchema = z.enum([
  "a_hotspots",
  "a_cuts",
  "a_frameworks",
  "a_reward",
  "a_intensify",
  "a_creative",
  "a_candidates",
  "b_decompose",
  "b_directions",
  "b_candidates",
  "final_card",
]);

export type GenerationAction = z.infer<typeof actionSchema>;

export const optionSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  reason: z.string(),
  recommended: z.boolean().default(false),
  meta: z.record(z.string(), z.string()).default({}),
});

export type ChoiceOption = z.infer<typeof optionSchema>;

export const candidateSchema = z.object({
  id: z.string(),
  title: z.string(),
  oneLiner: z.string(),
  coreHook: z.string(),
  mainline: z.string(),
  labels: z.array(z.string()).min(2).max(4),
  innovation: z.string(),
  why: z.string(),
  recommended: z.boolean().default(false),
  internal: z.object({
    motherFramework: z.string(),
    emotionReward: z.string(),
    gameplay: z.array(z.string()),
  }),
});

export type TopicCandidate = z.infer<typeof candidateSchema>;

export const breakdownSchema = z.object({
  workTitle: z.string(),
  sourceNote: z.string(),
  motherFramework: z.string(),
  emotionFrame: z.string(),
  coreHook: z.string(),
  baseMainline: z.string(),
  gameplayBundles: z.array(
    z.object({
      name: z.string(),
      functions: z.array(z.string()).min(1),
    }),
  ).min(2).max(4),
  reasons: z.string(),
  mustKeep: z.array(z.string()),
});

export type BenchmarkBreakdown = z.infer<typeof breakdownSchema>;

export const reportCardSchema = z.object({
  names: z.array(z.string()).min(2).max(3),
  coreHook: z.string(),
  labels: z.array(z.string()).min(2).max(4),
  benchmark: z
    .object({ title: z.string(), borrowed: z.string() })
    .nullable(),
  synopsis: z.string(),
  direction: z.string().nullable(),
  internal: z.object({
    route: z.enum(["A", "B"]),
    motherFramework: z.string(),
    emotionReward: z.string(),
    coreHook: z.string(),
    baseMainline: z.string(),
    gameplay: z.array(z.string()),
    innovation: z.string(),
    benchmark: z.string().nullable(),
  }),
});

export type ReportCard = z.infer<typeof reportCardSchema>;

const optionsResultSchema = z.object({ options: z.array(optionSchema).min(1) });
const candidatesResultSchema = z.object({
  options: z.array(candidateSchema).min(2).max(3),
});

export const resultSchemas = {
  a_hotspots: optionsResultSchema,
  a_cuts: optionsResultSchema,
  a_frameworks: optionsResultSchema,
  a_reward: z.object({ reward: z.string(), reason: z.string() }),
  a_intensify: optionsResultSchema,
  a_creative: optionsResultSchema,
  a_candidates: candidatesResultSchema,
  b_decompose: z.object({
    status: z.enum(["resolved", "ambiguous", "insufficient"]),
    message: z.string(),
    alternatives: z.array(optionSchema),
    breakdown: breakdownSchema.nullable(),
  }),
  b_directions: optionsResultSchema,
  b_candidates: candidatesResultSchema,
  final_card: z.object({
    warnings: z.array(
      z.object({ issue: z.string(), suggestion: z.string() }),
    ),
    card: reportCardSchema,
  }),
} satisfies Record<GenerationAction, z.ZodType>;

export const generationRequestSchema = z.object({
  action: actionSchema,
  context: z.record(z.string(), z.unknown()),
});

export type GenerationRequest = z.infer<typeof generationRequestSchema>;

export type ConfirmedField<T> = {
  ai: T;
  user: T;
  confirmedAt: string;
};

export type SourceMode = "search" | "own";
export type BenchmarkMode = "replacement" | "upgrade";

export type StudioState = {
  version: 1;
  route: "A" | "B" | null;
  screen: string;
  sourceMode?: SourceMode;
  modelMode?: "local" | "live" | "demo";
  modelName?: string;
  draft: Record<string, unknown>;
  confirmed: Record<string, ConfirmedField<unknown>>;
  history: Array<{ screen: string; at: string }>;
  updatedAt: string;
};

export function newStudioState(): StudioState {
  const now = new Date().toISOString();
  return {
    version: 1,
    route: null,
    screen: "route",
    draft: {},
    confirmed: {},
    history: [{ screen: "route", at: now }],
    updatedAt: now,
  };
}

export function confirmValue<T>(ai: T, user: T): ConfirmedField<T> {
  return { ai, user, confirmedAt: new Date().toISOString() };
}
