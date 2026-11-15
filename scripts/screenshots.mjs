// Captures every route at phone and desktop widths into screenshots/.
// Uses a local Chrome/Edge through the DevTools protocol (no Playwright needed).
//
//   npm run build && npm start        (in one terminal)
//   npm run screenshots               (in another)
//
// Options (env): BASE_URL (default http://localhost:3000), WIDTHS (default "390,1440"),
//                THEME=light|dark (default light), CHROME=path/to/chrome
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const WIDTHS = (process.env.WIDTHS ?? "390,1440").split(",").map(Number);
const THEME = process.env.THEME === "dark" ? "dark" : "light";
const ROUTES = [
  "/",
  "/app/stats",
  "/app/entries",
  "/app/calendar",
  "/app/more",
  "/app/more/goals",
  "/app/more/settings",
  "/app/more/data",
];

const CANDIDATES = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

const chromePath = CANDIDATES.find((p) => existsSync(p));
if (!chromePath) {
  console.error("No Chrome/Edge found. Set CHROME=/path/to/chrome.");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const outDir = path.resolve(import.meta.dirname, "..", "screenshots");
await mkdir(outDir, { recursive: true });
const profile = await mkdtemp(path.join(os.tmpdir(), "rumbodia-shots-"));
const port = 9300 + Math.floor(Math.random() * 500);

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "about:blank",
]);

let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i++) {
  await sleep(200);
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    wsUrl = list.find((t) => t.type === "page")?.webSocketDebuggerUrl;
  } catch {
    /* not up yet */
  }
}
if (!wsUrl) throw new Error("Chrome did not start.");

const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let nextId = 1;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, (m) => (m.error ? reject(new Error(m.error.message)) : resolve(m.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: THEME }] });

const problems = [];
for (const width of WIDTHS) {
  const mobile = width < 640;
  await send("Emulation.setDeviceMetricsOverride", { width, height: mobile ? 844 : 900, deviceScaleFactor: 1, mobile });
  await send("Emulation.setTouchEmulationEnabled", { enabled: mobile });
  for (const route of ROUTES) {
    await send("Page.navigate", { url: BASE + route });
    await sleep(2500);
    const { result } = await send("Runtime.evaluate", {
      expression: "JSON.stringify({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, vw: innerWidth })",
      returnByValue: true,
    });
    const m = JSON.parse(result.value);
    if (m.w > m.vw) problems.push(`${route} @${width}: horizontal scroll (${m.w}px > ${m.vw}px)`);
    await send("Emulation.setDeviceMetricsOverride", { width, height: Math.min(m.h, 6000), deviceScaleFactor: 1, mobile });
    await sleep(300);
    const shot = await send("Page.captureScreenshot", { format: "png" });
    const name = `${route === "/" ? "landing" : route.slice(1).replace(/\//g, "-")}-${width}-${THEME}.png`;
    await writeFile(path.join(outDir, name), Buffer.from(shot.data, "base64"));
    console.log("saved", name);
    await send("Emulation.setDeviceMetricsOverride", { width, height: mobile ? 844 : 900, deviceScaleFactor: 1, mobile });
  }
}

ws.close();
chrome.kill();
await sleep(300);
await rm(profile, { recursive: true, force: true }).catch(() => {});

if (problems.length) {
  console.log("\nLayout problems:\n  " + problems.join("\n  "));
  process.exitCode = 1;
} else {
  console.log("\nNo horizontal scrolling at any width.");
}
