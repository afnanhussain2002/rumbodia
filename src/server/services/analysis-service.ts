import "server-only";
import { generateJson } from "@/lib/gemini/client";
import { buildPrompt, RESPONSE_SCHEMA, SYSTEM_INSTRUCTION, type PromptInput } from "@/lib/gemini/prompt";
import { analysisResultSchema, type AnalysisResult } from "@/lib/schemas";
import { AppError } from "@/server/http";
import { getEnv } from "@/server/env";

export interface AnalysisOutput extends AnalysisResult {
  model: string;
}

/** Ask Gemini to score one update. Returns a validated, clamped result. */
export async function analyzeUpdate(input: PromptInput): Promise<AnalysisOutput> {
  const env = getEnv();

  const raw = await generateJson({
    apiKey: env.geminiApiKey,
    model: env.geminiModel,
    systemInstruction: SYSTEM_INSTRUCTION,
    prompt: buildPrompt(input),
    responseSchema: RESPONSE_SCHEMA as unknown as Record<string, unknown>,
  });

  const parsed = analysisResultSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError("Gemini's answer was not in the expected shape. Try again.", 502, "gemini_bad_shape");
  }
  return { ...parsed.data, model: env.geminiModel };
}
