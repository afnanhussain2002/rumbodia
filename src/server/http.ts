import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiErrorBody } from "@/types";

/** An error with an HTTP status and a message that is safe to show the user. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function ok<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function toErrorResponse(err: unknown): NextResponse<ApiErrorBody> {
  if (err instanceof AppError) {
    return NextResponse.json({ error: { message: err.message, code: err.code } }, { status: err.status });
  }

  if (err instanceof ZodError) {
    const message = err.issues[0]?.message ?? "Invalid request.";
    return NextResponse.json({ error: { message, code: "invalid_request" } }, { status: 400 });
  }

  console.error("[api] Unhandled error:", err);
  return NextResponse.json(
    { error: { message: "Something went wrong on the server.", code: "internal_error" } },
    { status: 500 },
  );
}

/** Parse a JSON body, turning malformed JSON into a 400 instead of a 500. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError("Request body must be valid JSON.", 400, "invalid_json");
  }
}
