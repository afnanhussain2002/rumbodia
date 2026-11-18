import { afterEach, describe, expect, it, vi } from "vitest";
import { RESPONSE_SCHEMA } from "@/lib/gemini/prompt";
import { WEEKLY_RESPONSE_SCHEMA } from "@/lib/gemini/weekly-prompt";
import { toOpenAiSchema } from "@/lib/ai/openai";
import { generateStructured } from "@/lib/ai/generate";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const geminiOk = (obj: unknown) => json(200, { candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] });
const openAiOk = (obj: unknown) => json(200, { choices: [{ message: { content: JSON.stringify(obj) } }] });
const RESULT = { score: 4, reason: "ok", wins: [], slips: [], tags: ["work"] };

const opts = { apiKey: "g", model: "gemini-3.5-flash", systemInstruction: "s", prompt: "p", responseSchema: RESPONSE_SCHEMA as unknown as Record<string, unknown> };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("toOpenAiSchema", () => {
  it("makes every property required and forbids extras", () => {
    const s = toOpenAiSchema(RESPONSE_SCHEMA) as { required: string[]; additionalProperties: boolean; properties: { score: { type: unknown } } };
    expect(s.required).toEqual(["score", "reason", "wins", "slips", "tags"]);
    expect(s.additionalProperties).toBe(false);
    expect(s.properties.score.type).toBe("integer");
  });

  it("turns optional or nullable fields into string-or-null", () => {
    const s = toOpenAiSchema(WEEKLY_RESPONSE_SCHEMA) as { required: string[]; properties: { bestDay: { type: unknown }; headline: { type: unknown } } };
    expect(s.required).toEqual(["headline", "bestDay", "hardDay", "suggestion"]);
    expect(s.properties.bestDay.type).toEqual(["string", "null"]);
    expect(s.properties.headline.type).toBe("string");
  });
});

describe("generateStructured", () => {
  it("uses Gemini when it answers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(geminiOk(RESULT));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    await expect(generateStructured(opts)).resolves.toEqual({ data: RESULT, model: "gemini-3.5-flash" });
    expect(fetchMock.mock.calls.every(([url]) => String(url).includes("generativelanguage"))).toBe(true);
  });

  it("falls back to OpenAI when every Gemini model fails", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    const fetchMock = vi.fn(async (url: string, _init?: RequestInit) =>
      url.includes("openai.com") ? openAiOk({ ...RESULT, extra: null }) : json(404, { error: { message: "gone" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    vi.stubEnv("OPENAI_MODEL", "gpt-test");
    const res = await generateStructured(opts);
    expect(res).toEqual({ data: RESULT, model: "gpt-test" });
    const openAiCall = fetchMock.mock.calls.find(([url]) => url.includes("openai.com"))!;
    expect(JSON.parse(openAiCall[1]!.body as string).response_format.json_schema.strict).toBe(true);
  });

  it("without an OpenAI key, shows Gemini's error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(404, { error: { message: "gone" } })));
    vi.stubEnv("OPENAI_API_KEY", "");
    await expect(generateStructured(opts)).rejects.toMatchObject({ code: "gemini_bad_model" });
  });

  it("if OpenAI fails too, still shows Gemini's error", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => (url.includes("openai.com") ? json(401, { error: { message: "bad key" } }) : json(404, {}))));
    vi.stubEnv("OPENAI_API_KEY", "sk-bad");
    await expect(generateStructured(opts)).rejects.toMatchObject({ code: "gemini_bad_model" });
  });
});
