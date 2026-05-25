#!/usr/bin/env node
/**
 * Generates MapAble PWA icons (brand teal #0B6E99).
 * Run: node scripts/generate-pwa-icons.mjs
 */
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "icons");
const BRAND = [11, 110, 153];

function crc32(buf) {
  let c = 0xffffffff;
  const table = [];
  for (let n = 0; n < 256; n++) {
    let t = n;
    for (let k = 0; k < 8; k++) t = (t & 1) ? (0xedb88320 ^ (t >>> 1)) : (t >>> 1);
    table[n] = t;
  }
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type);
  const crcBuf = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuf), 0);
  return Buffer.concat([len, t, data, crc]);
}

function createPng(size, r, g, b) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let off = 0;
  for (let y = 0; y < size; y++) {
    raw[off++] = 0;
    for (let x = 0; x < size; x++) {
      raw[off++] = r;
      raw[off++] = g;
      raw[off++] = b;
      raw[off++] = 255;
    }
  }
  const compressed = zlib.deflateSync(raw);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const size of [192, 512]) {
  fs.writeFileSync(
    path.join(OUT_DIR, `mapable-icon-${size}.png`),
    createPng(size, ...BRAND)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, `mapable-maskable-${size}.png`),
    createPng(size, ...BRAND)
  );
}
console.log("Wrote PWA icons to", OUT_DIR);
