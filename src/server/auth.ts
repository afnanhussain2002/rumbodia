import "server-only";
import { auth } from "@clerk/nextjs/server";
import { AppError } from "@/server/http";

/** The signed-in Clerk user id, or a 401 the client can show. Every data route starts here. */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new AppError("Please sign in to continue.", 401, "unauthenticated");
  return userId;
}
