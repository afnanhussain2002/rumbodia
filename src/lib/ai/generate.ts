import "server-only";
import { generateGeminiJson, type GenerateJsonOptions } from "@/lib/gemini/client";
import { generateOpenAiJson } from "@/lib/ai/openai";
import { AppError } from "@/server/http";
import { getOpenAiEnv } from "@/server/env";

/** Failures where asking another provider would not help (the text itself was the problem). */
const NO_FALLBACK = new Set(["gemini_blocked"]);

/**
 * Gemini first (with its own retries and fallback models). If Gemini still fails and an
 * OPENAI_API_KEY is set, the same request goes to OpenAI. Returns which model answered.
 */
export async function generateStructured(options: GenerateJsonOptions): Promise<{ data: unknown; model: string }> {
  try {
    return { data: await generateGeminiJson(options), model: options.model };
  } catch (geminiErr) {
    const openai = getOpenAiEnv();
    if (!openai || (geminiErr instanceof AppError && geminiErr.code && NO_FALLBACK.has(geminiErr.code))) throw geminiErr;

    console.warn("[ai] Gemini failed, trying OpenAI:", geminiErr instanceof Error ? geminiErr.message : geminiErr);
    try {
      const data = await generateOpenAiJson({ ...options, apiKey: openai.apiKey, model: openai.model });
      return { data, model: openai.model };
    } catch (openaiErr) {
      console.error("[ai] OpenAI fallback failed too:", openaiErr instanceof Error ? openaiErr.message : openaiErr);
      // Show the user Gemini's reason (e.g. "very busy, try again"): OpenAI is a silent backup.
      throw geminiErr;
    }
  }
}
