import "server-only";
import { GEMINI_TIMEOUT_MS } from "@/lib/constants";
import { AppError } from "@/server/http";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const FALLBACK_MODEL = "gemini-2.5-flash";
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;
const RETRYABLE_STATUSES = new Set([500, 503]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface GeminiPart {
  text?: string;
  thought?: boolean;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string };
}

export interface GenerateJsonOptions {
  apiKey: string;
  model: string;
  systemInstruction: string;
  prompt: string;
  /** OpenAPI-style response schema. Gemini uses it to shape the JSON output. */
  responseSchema: Record<string, unknown>;
}

/**
 * Calls Gemini's generateContent endpoint and returns the parsed JSON.
 * Uses plain fetch so there is no SDK to keep in sync with model changes.
 * The API key stays on the server and is never sent to the browser.
 */
export async function generateJson({
  apiKey,
  model,
  systemInstruction,
  prompt,
  responseSchema,
}: GenerateJsonOptions): Promise<unknown> {
  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  let res!: Response;
  let body: GeminiResponse = {};
  const models = model === FALLBACK_MODEL ? [model] : [model, FALLBACK_MODEL];

  // Overload (503) is usually brief: retry with backoff, then try the fallback model.
  outer: for (const currentModel of models) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      try {
        res = await fetch(`${BASE_URL}/${encodeURIComponent(currentModel)}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: requestBody,
          signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        });
      } catch (err) {
        if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
          throw new AppError("Gemini took too long to answer. Try again.", 504, "gemini_timeout");
        }
        throw new AppError("Could not reach Gemini. Check your internet connection.", 502, "gemini_unreachable");
      }

      body = (await res.json().catch(() => ({}))) as GeminiResponse;
      if (!RETRYABLE_STATUSES.has(res.status)) break outer;
    }
  }

  if (!res.ok) {
    throw mapGeminiHttpError(res.status, body.error?.message);
  }

  if (body.promptFeedback?.blockReason) {
    throw new AppError(
      `Gemini declined to score this update (${body.promptFeedback.blockReason}). Try rewording it.`,
      422,
      "gemini_blocked",
    );
  }

  const text = (body.candidates?.[0]?.content?.parts ?? [])
    .filter((part) => !part.thought && typeof part.text === "string")
    .map((part) => part.text)
    .join("")
    .trim();

  if (!text) {
    throw new AppError("Gemini returned an empty answer. Try again.", 502, "gemini_empty");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new AppError("Gemini returned something that is not valid JSON. Try again.", 502, "gemini_bad_json");
  }
}

function mapGeminiHttpError(status: number, message?: string): AppError {
  if (status === 400 && message && /api key/i.test(message)) {
    return new AppError("Gemini rejected your API key. Check GEMINI_API_KEY in .env.local.", 401, "gemini_bad_key");
  }
  if (status === 401 || status === 403) {
    return new AppError("Gemini rejected your API key. Check GEMINI_API_KEY in .env.local.", 401, "gemini_bad_key");
  }
  if (status === 404) {
    return new AppError(
      "Gemini does not know that model name. Check GEMINI_MODEL in .env.local.",
      502,
      "gemini_bad_model",
    );
  }
  if (status === 429) {
    return new AppError("Gemini rate limit reached. Wait a minute and try again.", 429, "gemini_rate_limited");
  }
  return new AppError(message ? `Gemini error: ${message}` : `Gemini error (${status}).`, 502, "gemini_error");
}
