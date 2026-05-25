/**
 * Generates MapAble PWA icons from brand SVG.
 * Run: node scripts/generate-pwa-icons.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const svgPath = path.join(root, "public/brand/mapable-logo-mark.svg");
const outDir = path.join(root, "public/icons");

const BRAND_BG = { r: 0, g: 63, b: 136, alpha: 1 };
const sizes = [
  { name: "mapable-icon-192.png", size: 192, maskable: false },
  { name: "mapable-icon-512.png", size: 512, maskable: false },
  { name: "mapable-maskable-192.png", size: 192, maskable: true },
  { name: "mapable-maskable-512.png", size: 512, maskable: true },
];

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const svg = fs.readFileSync(svgPath);

  for (const { name, size, maskable } of sizes) {
    const padding = maskable ? Math.round(size * 0.1) : 0;
    const inner = size - padding * 2;
    const logo = await sharp(svg)
      .resize(inner, inner, { fit: "contain", background: BRAND_BG })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: BRAND_BG,
      },
    })
      .composite([{ input: logo, gravity: "centre" }])
      .png()
      .toFile(path.join(outDir, name));

    console.log(`Wrote ${name}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
