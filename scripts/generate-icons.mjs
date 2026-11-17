// Renders the Rumbodia mark into the PWA / touch icons in public/.
// Run with: npm run icons
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const BRAND = "#13A38B";
const WHITE = "#FFFFFF";

/** Full-bleed "smile that turns into a rising arrow" mark (maskable-safe: the glyph sits inside the central 60%). */
function svg({ rounded }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  ${rounded ? `<rect x="1" y="1" width="46" height="46" rx="13" fill="${BRAND}"/>` : `<rect width="48" height="48" fill="${BRAND}"/>`}
  <circle cx="16.5" cy="18.5" r="3.1" fill="${WHITE}"/>
  <circle cx="29.5" cy="18.5" r="3.1" fill="${WHITE}"/>
  <g fill="none" stroke="${WHITE}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11.5 26.5C14.5 33.5 23.5 36.5 30 32L37 25"/>
    <path d="M31 25H37V31"/>
  </g>
</svg>`;
}

const root = path.resolve(import.meta.dirname, "..");
const pub = path.join(root, "public");
await mkdir(path.join(pub, "icons"), { recursive: true });

await writeFile(path.join(pub, "icon.svg"), svg({ rounded: true }));
const square = Buffer.from(svg({ rounded: false }));
for (const [file, size] of [
  ["icons/icon-192.png", 192],
  ["icons/icon-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  await sharp(square, { density: 600 }).resize(size, size).png().toFile(path.join(pub, file));
  console.log("wrote", file);
}
