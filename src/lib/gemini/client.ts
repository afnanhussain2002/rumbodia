import "server-only";
import { GEMINI_ATTEMPT_TIMEOUT_MS, GEMINI_TOTAL_BUDGET_MS } from "@/lib/constants";
import { AppError } from "@/server/http";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Tried in order when the configured model is overloaded, rate limited, slow or unavailable.
 * "gemini-flash-latest" is Google's alias for the current Flash model, so it doesn't go stale
 * the way a pinned name does (gemini-2.5-flash was retired for new keys).
 */
const FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-flash-latest"];
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;
/** Don't start a call with less time than this left in the budget. */
const MIN_ATTEMPT_MS = 4_000;
/** Retry the same model on these (brief overload). */
const RETRYABLE_STATUSES = new Set([500, 503]);
/** Go straight to the next model on these (each model has its own availability and quota). */
const NEXT_MODEL_STATUSES = new Set([404, 429]);
/**
 * Scoring a short update doesn't need deep reasoning; low thinking answers several times faster.
 * If a model rejects the setting (400 mentioning "thinking"), the call is repeated without it.
 */
const THINKING_CONFIG = { thinkingLevel: "low" };

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

type Failure = { kind: "http"; status: number; message?: string } | { kind: "timeout" } | { kind: "unreachable" };

/**
 * Calls Gemini's generateContent endpoint and returns the parsed JSON.
 * Uses plain fetch so there is no SDK to keep in sync with model changes.
 * The API key stays on the server and is never sent to the browser.
 */
export async function generateGeminiJson({
  apiKey,
  model,
  systemInstruction,
  prompt,
  responseSchema,
}: GenerateJsonOptions): Promise<unknown> {
  const requestBody = (thinking: boolean) =>
    JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
        ...(thinking ? { thinkingConfig: THINKING_CONFIG } : {}),
      },
    });

  const deadline = Date.now() + GEMINI_TOTAL_BUDGET_MS;
  /** The configured model's own failure: what we report if every model fails. */
  let primaryFailure: Failure | null = null;
  let lastFailure: Failure | null = null;
  const models = [...new Set([model, ...FALLBACK_MODELS])];

  outer: for (const currentModel of models) {
    let thinking = true;
    let failure: Failure | null = null;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      const remaining = deadline - Date.now();
      if (remaining < MIN_ATTEMPT_MS) {
        failure ??= { kind: "timeout" };
        break;
      }

      let res: Response;
      try {
        res = await fetch(`${BASE_URL}/${encodeURIComponent(currentModel)}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: requestBody(thinking),
          signal: AbortSignal.timeout(Math.min(GEMINI_ATTEMPT_TIMEOUT_MS, remaining)),
        });
      } catch (err) {
        // A model that timed out or can't be reached won't recover in a second: try the next one.
        const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
        failure = { kind: timedOut ? "timeout" : "unreachable" };
        break;
      }

      const body = (await res.json().catch(() => ({}))) as GeminiResponse;
      if (res.ok) return parseAnswer(body);

      failure = { kind: "http", status: res.status, message: body.error?.message };
      if (res.status === 400 && thinking && /thinking/i.test(body.error?.message ?? "")) {
        thinking = false;
        attempt--; // same attempt again, without the thinking setting
        continue;
      }
      if (NEXT_MODEL_STATUSES.has(res.status)) break;
      if (!RETRYABLE_STATUSES.has(res.status)) {
        // Bad key, bad request…: another model won't fix it.
        lastFailure = failure;
        if (currentModel === model) primaryFailure = failure;
        break outer;
      }
    }

    if (failure) {
      console.warn(`[gemini] ${currentModel} failed: ${describe(failure)}`);
      lastFailure = failure;
      if (currentModel === model) primaryFailure = failure;
    }
    if (deadline - Date.now() < MIN_ATTEMPT_MS) break;
  }

  // Report why the configured model failed (e.g. "busy"), not a fallback's unrelated error.
  throw toAppError(primaryFailure ?? lastFailure ?? { kind: "timeout" });
}

function parseAnswer(body: GeminiResponse): unknown {
  if (body.promptFeedback?.blockReason) {
    throw new AppError(
      `The AI declined to score this update (${body.promptFeedback.blockReason}). Try rewording it.`,
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
    throw new AppError("The AI returned an empty answer. Try again.", 502, "gemini_empty");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new AppError("The AI returned something that is not valid JSON. Try again.", 502, "gemini_bad_json");
  }
}

function describe(f: Failure): string {
  return f.kind === "http" ? `${f.status} ${f.message ?? ""}`.trim() : f.kind;
}

function toAppError(f: Failure): AppError {
  if (f.kind === "timeout") return new AppError("The AI took too long to answer. Try again.", 504, "gemini_timeout");
  if (f.kind === "unreachable") return new AppError("Could not reach the AI service. Try again in a moment.", 502, "gemini_unreachable");
  return mapGeminiHttpError(f.status, f.message);
}

function mapGeminiHttpError(status: number, message?: string): AppError {
  if (status === 400 && message && /api key/i.test(message)) {
    return new AppError("The AI service rejected its API key.", 401, "gemini_bad_key");
  }
  if (status === 401 || status === 403) {
    return new AppError("The AI service rejected its API key.", 401, "gemini_bad_key");
  }
  if (status === 404) {
    return new AppError(
      "The AI model is not available.",
      502,
      "gemini_bad_model",
    );
  }
  if (status === 500 || status === 503) {
    return new AppError("The AI is very busy right now. Wait a minute and try again.", 503, "gemini_busy");
  }
  if (status === 429) {
    return new AppError("AI rate limit reached. Wait a minute and try again.", 429, "gemini_rate_limited");
  }
  return new AppError(message ? `AI error: ${message}` : `AI error (${status}).`, 502, "gemini_error");
}
