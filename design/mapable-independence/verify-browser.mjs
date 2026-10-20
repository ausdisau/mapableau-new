/* Optional check using the workspace's EXISTING Playwright and browser.
   No install, server, screenshot or production application is required. */
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("@playwright/test");
const dir = dirname(fileURLToPath(import.meta.url));
const target = resolve(dir, "../../generated-artifacts/mapable-brand/index.html");
if (!existsSync(target)) throw new Error("Build the final guide first: node design/mapable-independence/build.mjs");
const executablePath = process.env.MAPABLE_CHROMIUM || (existsSync("/repl/tools/bin/chromium") ? "/repl/tools/bin/chromium" : undefined);
const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  const errors = [], network = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
  await page.goto(pathToFileURL(target).href);
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const result = await page.evaluate(() => ({
      width: innerWidth, scroll: document.documentElement.scrollWidth,
      logo: document.querySelector(".brand-plate img").naturalWidth,
    }));
    if (result.scroll > width || result.logo !== 1254) throw new Error("Reflow/logo failed: " + JSON.stringify(result));
    console.log("PASS reflow + complete image: " + width + "px");
  }
  const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const light = await background();
  await page.selectOption("#theme", "dark");
  if (await background() === light) throw new Error("Dark theme did not change computed colour.");
  await page.selectOption("#theme", "contrast");
  await page.check("#readable");
  const font = await page.locator("h1").evaluate(node => getComputedStyle(node).fontFamily);
  if (!font.includes("Verdana")) throw new Error("Readable font failed.");
  await page.check("#motion");
  const duration = await page.locator("[data-demo]").first().evaluate(node => getComputedStyle(node).transitionDuration);
  if (duration !== "0s") throw new Error("Reduced motion failed.");
  await page.locator("#consent-demo button[type=submit]").click();
  if (!(await page.locator("#consent-result").textContent()).includes("did not agree")) throw new Error("Refusal failed.");
  await page.check("#consent-choice");
  await page.locator("#consent-demo button[type=submit]").click();
  if (!(await page.locator("#consent-result").textContent()).includes("Nothing was shared")) throw new Error("Consent demo failed.");
  await page.locator("#consent-demo button[type=reset]").click();
  if (await page.isChecked("#consent-choice")) throw new Error("Reset failed.");
  await page.locator("#retry-demo").click();
  if (!(await page.locator("#retry-result").textContent()).includes("complete")) throw new Error("Recovery failed.");
  await page.locator("#theme").focus();
  await page.keyboard.press("Tab");
  if (await page.evaluate(() => document.activeElement.id) !== "readable") throw new Error("Keyboard order failed.");
  await page.selectOption("#theme", "system");
  await page.emulateMedia({ colorScheme: "dark", contrast: "no-preference" });
  if (await background() === light) throw new Error("System dark theme failed.");
  if (errors.length || network.length) throw new Error(JSON.stringify({ errors, network }));
  console.log("PASS computed themes/font/motion, keyboard order, consent/refusal/reset and recovery. No script errors or external requests.");
  console.log("Not a screenshot review, screen-reader assessment or complete WCAG audit.");
} finally {
  await browser.close();
}
