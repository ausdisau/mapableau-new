import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, relative, sep } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(dir, "../..");
const read = name => readFile(resolve(dir, name), "utf8");
const checkOnly = process.argv.includes("--check");
const local = process.argv.includes("--local");
const supported = new Set(["--check", "--local"]);
if (process.argv.slice(2).some(arg => !supported.has(arg))) throw new Error("Usage: node build.mjs [--check | --local]");
const tokens = JSON.parse(await read("tokens.json"));
const sourcePath = resolve(root, "attached_assets/MapAble_Accessibility_Logo_with_Gradient_Pin_1792453678172.png");
const original = await readFile(sourcePath);
const copied = await readFile(resolve(dir, "assets/mapable-original.png"));
const hash = buffer => createHash("sha256").update(buffer).digest("hex");
if (!original.equals(copied)) throw new Error("Logo bytes differ from the supplied original.");
if (original.readUInt32BE(16) !== 1254 || original.readUInt32BE(20) !== 1254) throw new Error("Unexpected logo dimensions.");
function hsl(hex) {
  const [r,g,b] = hex.match(/[a-f\d]{2}/gi).map(v => parseInt(v,16)/255);
  const max = Math.max(r,g,b), min = Math.min(r,g,b), delta = max-min, light = (max+min)/2;
  let hue = 0;
  if (delta) {
    if (max === r) hue = ((g-b)/delta) % 6;
    else if (max === g) hue = (b-r)/delta + 2;
    else hue = (r-g)/delta + 4;
  }
  return `${((hue*60+360)%360).toFixed(5)} ${(delta ? delta/(1-Math.abs(2*light-1))*100 : 0).toFixed(5)}% ${(light*100).toFixed(5)}%`;
}
const entries = obj => Object.entries(obj).map(([key,value]) => `  --ma-${key}: ${hsl(value)};`).join("\n");
const variables = Object.entries(tokens.type).filter(([,v]) => typeof v === "string").map(([k,v]) => `  --ma-font-${k}: ${v};`).join("\n")
  + "\n" + Object.entries(tokens.radius).map(([k,v]) => `  --ma-radius-${k}: ${v};`).join("\n")
  + "\n" + tokens.spaceRem.map((v,i) => `  --ma-space-${i+1}: ${v}rem;`).join("\n");
const css = `/* Generated from tokens.json by build.mjs. Do not hand-edit. */\n.mapable-system {\n${entries(tokens.themes.light)}\n${variables}\n}\n`
  + Object.entries(tokens.themes).filter(([name]) => name !== "light").map(([name,values]) => `.mapable-system[data-ma-theme="${name}"] {\n${entries(values)}\n}\n`).join("")
  + `@media (prefers-color-scheme: dark) {\n.mapable-system[data-ma-theme="system"] {\n${entries(tokens.themes.dark)}\n  color-scheme: dark;\n}\n}\n`
  + `@media (prefers-contrast: more) {\n.mapable-system[data-ma-theme="system"] {\n${entries(tokens.themes.contrast)}\n  color-scheme: light;\n}\n}\n`;
const luminance = hex => hex.match(/[a-f\d]{2}/gi).map(v => parseInt(v,16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4).reduce((s,v,i) => s+v*[.2126,.7152,.0722][i],0);
const ratio = (a,b) => { const x=luminance(a), y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
const referenceKeys = Object.keys(tokens.themes.light).sort().join(",");
const results = [];
for (const [name, values] of Object.entries(tokens.themes)) {
  if (Object.keys(values).sort().join(",") !== referenceKeys) throw new Error("Theme keys differ: " + name);
  for (const value of Object.values(values)) if (!/^#[\da-f]{6}$/i.test(value)) throw new Error("Invalid sRGB token: " + value);
  for (const [fg,bg] of tokens.contrastPairs) {
    const contrast = ratio(values[fg],values[bg]);
    results.push({ theme: name, foreground: fg, background: bg, ratio: Number(contrast.toFixed(2)), minimum: 4.5 });
    if (contrast < 4.5) throw new Error(`${name} ${fg}/${bg} fails: ${contrast.toFixed(2)}`);
  }
  for (const fg of ["border", "focus"]) for (const bg of ["background", "surface"]) {
    const contrast = ratio(values[fg],values[bg]);
    results.push({ theme: name, foreground: fg, background: bg, ratio: Number(contrast.toFixed(2)), minimum: 3 });
    if (contrast < 3) throw new Error(`${name} UI ${fg}/${bg} fails: ${contrast.toFixed(2)}`);
  }
}
const styles = (await read("styles.css")).replace('@import "./tokens.css";', "");
const template = await read("reference.template.html");
const html = template.replace("/*__SYSTEM_CSS__*/", css + styles)
  .replace("__LOGO_DATA_URL__", "data:image/png;base64," + copied.toString("base64"))
  .replace("__TOKENS_JSON__", JSON.stringify(tokens).replaceAll("<", "\\u003c"));
if (/__(?:LOGO_DATA_URL|TOKENS_JSON|SYSTEM_CSS)__/.test(html)) throw new Error("Unresolved template marker.");
if (/(?:src|href)=["']https?:|@import|url\(["']?https?:/i.test(html)) throw new Error("External asset dependency found.");
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
if (new Set(ids).size !== ids.length) throw new Error("Duplicate HTML IDs.");
for (const match of html.matchAll(/href="#([^"]+)"/g)) if (!ids.includes(match[1])) throw new Error("Broken anchor " + match[1]);
const report = { logo: { source: relative(root, sourcePath), sha256: hash(copied), bytes: copied.length, width: 1254, height: 1254 }, contrastChecks: results };
if (checkOnly) {
  if (await read("tokens.css") !== css) throw new Error("Stale tokens.css: run build.mjs --local");
  if (JSON.stringify(JSON.parse(await read("checks.json"))) !== JSON.stringify(report)) throw new Error("Stale checks.json");
  console.log(`PASS: original logo byte parity; ${results.length} contrast pairs; tokens.css parity; no external assets; valid IDs/anchors. This is not a browser accessibility audit.`);
} else {
  const output = local ? resolve(dir, "reference.html") : resolve(root, "generated-artifacts/mapable-brand/index.html");
  if (!local) {
    try { execFileSync("git", ["check-ignore", "--quiet", relative(root, output)], { cwd: root }); }
    catch { throw new Error("Generated output is not ignored. Ask the main agent to set ignores first, or build with --local."); }
  }
  if (local && !output.startsWith(dir+sep)) throw new Error("Invalid local output path.");
  await writeFile(resolve(dir, "tokens.css"), css);
  await writeFile(resolve(dir, "checks.json"), JSON.stringify(report,null,2)+"\n");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html);
  console.log(`Built ${relative(root,output)} (${Buffer.byteLength(html)} bytes). ${results.length} contrast checks passed. Logo SHA-256: ${hash(copied)}`);
}
