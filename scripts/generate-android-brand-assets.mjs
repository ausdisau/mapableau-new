/**
 * Generate MapAble Android launcher icons and splash screens.
 * Run: node scripts/generate-android-brand-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const assetsDir = path.join(root, "assets");
const resDir = path.join(root, "android/app/src/main/res");
const markSvg = path.join(root, "public/brand/mapable-logo-mark.svg");

const BRAND_PRIMARY = { r: 0, g: 63, b: 136, alpha: 1 };
const SPLASH_BG = { r: 245, g: 248, b: 251, alpha: 1 };

const launcherSizes = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

const foregroundSizes = {
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};

const splashPortrait = {
  "drawable-port-mdpi": [320, 480],
  "drawable-port-hdpi": [480, 800],
  "drawable-port-xhdpi": [720, 1280],
  "drawable-port-xxhdpi": [960, 1600],
  "drawable-port-xxxhdpi": [1280, 1920],
};

const splashLandscape = {
  "drawable-land-mdpi": [480, 320],
  "drawable-land-hdpi": [800, 480],
  "drawable-land-xhdpi": [1280, 720],
  "drawable-land-xxhdpi": [1600, 960],
  "drawable-land-xxxhdpi": [1920, 1280],
};

async function writeIconPng(outputPath, size, background, markScale = 0.62) {
  const markSize = Math.round(size * markScale);
  const markBuffer = await sharp(markSvg)
    .resize(markSize, Math.round(markSize * 1.1))
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: markBuffer, gravity: "center" }])
    .png()
    .toFile(outputPath);
}

async function writeSplashPng(outputPath, width, height) {
  const markSize = Math.round(Math.min(width, height) * 0.28);
  const markBuffer = await sharp(markSvg)
    .resize(markSize, Math.round(markSize * 1.1))
    .png()
    .toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: SPLASH_BG,
    },
  })
    .composite([{ input: markBuffer, gravity: "center" }])
    .png()
    .toFile(outputPath);
}

async function main() {
  fs.mkdirSync(assetsDir, { recursive: true });

  await writeIconPng(path.join(assetsDir, "icon-only.png"), 1024, BRAND_PRIMARY);
  await writeSplashPng(path.join(assetsDir, "splash.png"), 2732, 2732);

  for (const [folder, size] of Object.entries(launcherSizes)) {
    const dir = path.join(resDir, folder);
    fs.mkdirSync(dir, { recursive: true });
    await writeIconPng(path.join(dir, "ic_launcher.png"), size, BRAND_PRIMARY);
    await writeIconPng(
      path.join(dir, "ic_launcher_round.png"),
      size,
      BRAND_PRIMARY,
    );
  }

  for (const [folder, size] of Object.entries(foregroundSizes)) {
    const dir = path.join(resDir, folder);
    fs.mkdirSync(dir, { recursive: true });
    const markSize = Math.round(size * 0.55);
    const markBuffer = await sharp(markSvg)
      .resize(markSize, Math.round(markSize * 1.1))
      .png()
      .toBuffer();
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: markBuffer, gravity: "center" }])
      .png()
      .toFile(path.join(dir, "ic_launcher_foreground.png"));
  }

  await writeSplashPng(path.join(resDir, "drawable/splash.png"), 480, 800);

  for (const [folder, [width, height]] of Object.entries(splashPortrait)) {
    const dir = path.join(resDir, folder);
    fs.mkdirSync(dir, { recursive: true });
    await writeSplashPng(path.join(dir, "splash.png"), width, height);
  }

  for (const [folder, [width, height]] of Object.entries(splashLandscape)) {
    const dir = path.join(resDir, folder);
    fs.mkdirSync(dir, { recursive: true });
    await writeSplashPng(path.join(dir, "splash.png"), width, height);
  }

  console.log("Generated MapAble Android brand assets");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
