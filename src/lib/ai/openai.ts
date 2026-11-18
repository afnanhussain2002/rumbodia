import "server-only";
import { GEMINI_TIMEOUT_MS } from "@/lib/constants";
import { AppError } from "@/server/http";

const URL = "https://api.openai.com/v1/chat/completions";

type GeminiSchema = {
  type?: string;
  properties?: Record<string, GeminiSchema>;
  items?: GeminiSchema;
  required?: readonly string[];
  nullable?: boolean;
  description?: string;
  enum?: readonly string[];
};

/**
 * Gemini's OpenAPI-style schema → the JSON Schema OpenAI's strict mode accepts.
 * Strict mode wants every property listed in `required` and no extra keys, so a property Gemini
 * treats as optional becomes "may be null" instead.
 */
export function toOpenAiSchema(schema: GeminiSchema, optional = false): Record<string, unknown> {
  const base = (schema.type ?? "string").toLowerCase();
  const nullable = optional || Boolean(schema.nullable);
  const out: Record<string, unknown> = { type: nullable ? [base, "null"] : base };
  if (schema.description) out.description = schema.description;
  if (schema.enum) out.enum = nullable ? [...schema.enum, null] : [...schema.enum];
  if (base === "object") {
    const props = schema.properties ?? {};
    const req = new Set(schema.required ?? []);
    out.properties = Object.fromEntries(Object.entries(props).map(([k, v]) => [k, toOpenAiSchema(v, !req.has(k))]));
    out.required = Object.keys(props);
    out.additionalProperties = false;
  }
  if (base === "array" && schema.items) out.items = toOpenAiSchema(schema.items);
  return out;
}

/** Drops nulls OpenAI used for "not given", so the result looks like Gemini's. */
function stripNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripNulls);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== null).map(([k, v]) => [k, stripNulls(v)]));
  }
  return value;
}

export interface OpenAiJsonOptions {
  apiKey: string;
  model: string;
  systemInstruction: string;
  prompt: string;
  responseSchema: Record<string, unknown>;
}

/** Same job as the Gemini call, through OpenAI's Chat Completions with a strict JSON schema. */
export async function generateOpenAiJson({ apiKey, model, systemInstruction, prompt, responseSchema }: OpenAiJsonOptions): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "result", strict: true, schema: toOpenAiSchema(responseSchema as GeminiSchema) },
        },
      }),
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
      throw new AppError("OpenAI took too long to answer.", 504, "openai_timeout");
    }
    throw new AppError("Could not reach OpenAI.", 502, "openai_unreachable");
  }

  const body = (await res.json().catch(() => ({}))) as {
    choices?: { message?: { content?: string | null; refusal?: string | null } }[];
    error?: { message?: string };
  };
  if (!res.ok) throw new AppError(`OpenAI error (${res.status}): ${body.error?.message ?? "unknown"}`, 502, "openai_error");

  const msg = body.choices?.[0]?.message;
  if (msg?.refusal) throw new AppError(`OpenAI declined to score this update. Try rewording it.`, 422, "openai_refused");
  if (!msg?.content) throw new AppError("OpenAI returned an empty answer.", 502, "openai_empty");
  try {
    return stripNulls(JSON.parse(msg.content));
  } catch {
    throw new AppError("OpenAI returned something that is not valid JSON.", 502, "openai_bad_json");
  }
}
