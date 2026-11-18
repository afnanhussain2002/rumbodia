// Builds and deploys to Cloudflare with the live keys from .env.cloudflare.
// Next and OpenNext read .env.production.local ahead of .env, so the live values win
// in both the client bundle (NEXT_PUBLIC_*) and the Worker. The temp copy is always removed.
import { copyFileSync, existsSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";

const SRC = ".env.cloudflare";
const TMP = ".env.production.local";

if (!existsSync(SRC)) {
  console.error(`Missing ${SRC}: put the live keys there before deploying.`);
  process.exit(1);
}

copyFileSync(SRC, TMP);
try {
  execSync("npx opennextjs-cloudflare build && npx opennextjs-cloudflare deploy", { stdio: "inherit" });
} finally {
  rmSync(TMP, { force: true });
}
