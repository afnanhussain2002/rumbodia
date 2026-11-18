import "server-only";
import { DEFAULT_GEMINI_MODEL } from "@/lib/constants";
import { AppError } from "@/server/http";

export interface ServerEnv {
  geminiApiKey: string;
  geminiModel: string;
}

/** Read env lazily so the app can boot (and show a helpful message) before a key is set. */
export function getEnv(): ServerEnv {
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  if (!geminiApiKey || geminiApiKey === "your_key_here") {
    throw new AppError(
      "GEMINI_API_KEY is missing. Copy .env.example to .env.local, add your key, then restart the dev server.",
      500,
      "missing_api_key",
    );
  }

  return { geminiApiKey, geminiModel: getModelName() };
}

/** OpenAI is an optional backup for when Gemini fails. Null when no key is set. */
export function getOpenAiEnv(): { apiKey: string; model: string } | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim().replace(/^["']+|["']+$/g, "");
  if (!apiKey) return null;
  return { apiKey, model: process.env.OPENAI_MODEL?.trim() || "gpt-5-mini" };
}

/** The model name does not need the API key (shown in Settings / About). */
export function getModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

