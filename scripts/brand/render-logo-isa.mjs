#!/usr/bin/env node
/**
 * Overlay a solid white International Symbol of Access onto the dark-blue
 * placemarker in public/brand/mapable-logo.png, clipped to the pin silhouette.
 *
 * Usage: node scripts/brand/render-logo-isa.mjs
 */
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const logoPath = path.join(root, "public/brand/mapable-logo.png");

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require("sharp");
} catch {
  sharp = require(
    path.join(
      root,
      "node_modules/.pnpm/sharp@0.35.3_@types+node@20.19.30/node_modules/sharp",
    ),
  );
}

/** Pin head measured from current artwork (754×1008). */
const PIN_CX = 370;
const PIN_CY = 183;
const PIN_R = 183;
/** Match measured pin fill (~teal navy). */
const PIN_FILL = "rgb(0,80,116)";

/** Classic International Symbol of Access (64×64), facing right. */
function isaSvg(size) {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <g fill="#FFFFFF">
    <circle cx="27" cy="9" r="6"/>
    <path d="M16 20h13.5c1.8 0 3.3 1.15 3.95 2.85L38 35h7.5c1.66 0 3 1.34 3 3s-1.34 3-3 3H37.2l-3.7-8.4-4 4.55V40.8c5.35 1.45 9.25 6.35 9.25 12.15 0 6.9-5.6 12.5-12.5 12.5S13.75 59.85 13.75 52.95c0-5.1 2.9-9.55 7.15-11.7V29.6L17.4 25.5H12c-1.66 0-3-1.34-3-3s1.34-3 3-3h7.05l2.7-3.15C22.4 20.55 23.35 20 24.4 20H16z"/>
    <path fill-rule="evenodd" d="M27.25 43.2c-5.4 0-9.75 4.35-9.75 9.75s4.35 9.75 9.75 9.75 9.75-4.35 9.75-9.75-4.35-9.75-9.75-9.75zm0 5.25c2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5-4.5-2-4.5-4.5 2-4.5 4.5-4.5z"/>
  </g>
</svg>`);
}

function coverSvg(size, r) {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${r}" cy="${r}" r="${r}" fill="${PIN_FILL}"/>
</svg>`);
}

async function buildPinMask(source, width, height) {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const mask = Buffer.alloc(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * ch;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      // Pin body: teal-navy fill in the upper logo (exclude Australia polygons lower down)
      const isPin =
        a > 200 &&
        y < 390 &&
        r <= 55 &&
        g >= 55 &&
        g <= 125 &&
        b >= 90 &&
        b <= 150 &&
        b - r >= 45;
      mask[y * width + x] = isPin ? 255 : 0;
    }
  }
  return sharp(mask, { raw: { width, height, channels: 1 } }).png().toBuffer();
}

async function main() {
  const source = await fs.readFile(logoPath);
  const meta = await sharp(source).metadata();
  if (meta.width !== 754 || meta.height !== 1008) {
    throw new Error(
      `Unexpected logo size ${meta.width}×${meta.height}; update PIN_* constants`,
    );
  }

  const coverR = PIN_R - 2;
  const coverSize = coverR * 2;
  const isaSize = Math.round(PIN_R * 0.98);
  const coverLeft = Math.round(PIN_CX - coverR);
  const coverTop = Math.round(PIN_CY - coverR);
  const isaLeft = Math.round(PIN_CX - isaSize / 2);
  const isaTop = Math.round(PIN_CY - isaSize / 2 + 2);

  const coverPng = await sharp(coverSvg(coverSize, coverR)).png().toBuffer();
  const isaPng = await sharp(isaSvg(isaSize)).png().toBuffer();
  const pinMask = await buildPinMask(source, meta.width, meta.height);

  // Full-size overlay: solid pin fill + white ISA, then clip to pin silhouette.
  const overlay = await sharp({
    create: {
      width: meta.width,
      height: meta.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: coverPng, left: coverLeft, top: coverTop },
      { input: isaPng, left: isaLeft, top: isaTop },
    ])
    .png()
    .toBuffer();

  const maskedOverlay = await sharp(overlay)
    .composite([{ input: pinMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const outBuffer = await sharp(source)
    .composite([{ input: maskedOverlay, left: 0, top: 0 }])
    .png()
    .toBuffer();
  await fs.writeFile(logoPath, outBuffer);

  console.log(
    `Updated ${path.relative(root, logoPath)} with white ISA at (${PIN_CX}, ${PIN_CY})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
