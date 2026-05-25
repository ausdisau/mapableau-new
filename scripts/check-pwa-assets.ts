import { existsSync } from "fs";
import { resolve } from "path";

const root = resolve(__dirname, "..");
const required = [
  "public/icons/mapable-icon-192.png",
  "public/icons/mapable-icon-512.png",
  "public/icons/mapable-maskable-192.png",
  "public/icons/mapable-maskable-512.png",
  "public/offline.html",
  "public/sw.js",
  "app/manifest.ts",
];

let failed = false;
for (const file of required) {
  const path = resolve(root, file);
  if (!existsSync(path)) {
    console.error(`Missing PWA asset: ${file}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("PWA assets OK");
