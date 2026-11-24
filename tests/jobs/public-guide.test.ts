// @vitest-environment jsdom
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { employmentGuideCsp } from "@/lib/jobs/guide-policy";

const dir = join(process.cwd(), "public/employment/guide");
const html = readFileSync(join(dir, "index.html"), "utf8");
const page = new DOMParser().parseFromString(html, "text/html");

describe("public Jobs guide", () => {
  beforeEach(async () => {
    document.body.innerHTML = page.body.innerHTML;
    vi.resetModules();
    await import("../../public/employment/guide/assets/jobs.js");
  });
  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });
  it("ships the same script the document and its isolated content policy permit", () => {
    const bytes = readFileSync(join(dir, "assets/jobs.js"));
    const digest =
      "sha384-" + createHash("sha384").update(bytes).digest("base64");
    expect(page.querySelector("script")?.getAttribute("integrity")).toBe(
      digest,
    );
    expect(employmentGuideCsp).toContain(`script-src '${digest}'`);
    expect(employmentGuideCsp).toContain("connect-src 'none'");
    expect(employmentGuideCsp).toContain("form-action 'none'");
  });
  it("recovers from an empty result when combining a skill and a work setting", () => {
    const search = document.querySelector<HTMLInputElement>("#role-search")!;
    search.value = "audio";
    search.dispatchEvent(new Event("input"));
    expect(document.querySelector("#role-count")?.textContent).toMatch(
      /1 example role shown/,
    );
    const setting = document.querySelector<HTMLSelectElement>("#setting")!;
    setting.value = "Remote";
    setting.dispatchEvent(new Event("change"));
    expect(document.querySelector("#role-count")?.textContent).toMatch(
      /No role guides match/,
    );
    document.querySelector<HTMLButtonElement>("#clear-filters")!.click();
    expect(
      document.querySelectorAll("article.role:not([hidden])"),
    ).toHaveLength(3);
    expect(document.activeElement).toBe(search);
  });
  it("keeps user-written wording until the user opts to replace or clear it", () => {
    const choices = document.querySelectorAll<HTMLInputElement>(
      "input[name=request]",
    );
    const draft = document.querySelector<HTMLTextAreaElement>("#draft")!;
    choices[0].click();
    expect(draft.value).toMatch(/questions in advance/);
    draft.value = "Please send a written agenda.";
    choices[1].click();
    expect(draft.value).toBe("Please send a written agenda.");
    document.querySelector<HTMLButtonElement>("#replace")!.click();
    expect(draft.value).toMatch(/AAC device/);
    document.querySelector<HTMLButtonElement>("button[type=reset]")!.click();
    expect(draft.value).toBe("");
    expect(Array.from(choices).every((choice) => !choice.checked)).toBe(true);
  });
});
