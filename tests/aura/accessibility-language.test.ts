import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

import {
  assertDisclaimersPresent,
  containsForbiddenSelfDescription,
  MANDATORY_DISCLAIMERS,
} from "@/lib/aura/accessibility/language";

describe("accessibility & language guards", () => {
  it("mandatory disclaimers exist for all required keys", () => {
    expect(MANDATORY_DISCLAIMERS.notSentient).toBeTruthy();
    expect(MANDATORY_DISCLAIMERS.notLegalAuthority).toBeTruthy();
    expect(MANDATORY_DISCLAIMERS.humanInLoop).toBeTruthy();
  });

  it("blocks 'sentient' as a self-description", () => {
    const r = containsForbiddenSelfDescription("AURA is a sentient assistant.");
    expect(r.forbidden).toBe(true);
  });

  it("blocks 'artificial general intelligence' as a self-description", () => {
    const r = containsForbiddenSelfDescription(
      "This is artificial general intelligence."
    );
    expect(r.forbidden).toBe(true);
  });

  it("allows a properly qualified description", () => {
    const r = containsForbiddenSelfDescription(
      "AURA is a bounded software agent that suggests plans."
    );
    expect(r.forbidden).toBe(false);
  });

  it("no AURA doc claims consciousness or AGI", () => {
    const dir = path.join(process.cwd(), "docs", "aura");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
    for (const f of files) {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      // File cross-references such as `wave-10-not-sentient.md` are not
      // self-descriptions; strip them before the forbidden-phrase scan.
      const text = raw.replace(/wave-10-not-sentient\.md/gi, "");
      const result = containsForbiddenSelfDescription(text);
      if (result.forbidden) {
        // Not sentient doc is allowed to mention the word as a negation.
        if (f === "wave-10-not-sentient.md") continue;
        // Every other match is only allowed as an explicit negation. Check
        // that each match is preceded by a negation like "not " within 12
        // characters.
        const bad: string[] = [];
        for (const match of result.matches) {
          const re = new RegExp(`(not [^\\n]{0,20})?${match}`, "gi");
          const excerpts = [...text.matchAll(re)].map((m) => m[0].toLowerCase());
          const allNegations = excerpts.every((e) => /\bnot\b/.test(e));
          if (!allNegations) bad.push(match);
        }
        if (bad.length > 0) {
          expect.fail(`doc ${f} contains forbidden phrases without negation: ${bad.join(", ")}`);
        }
      }
    }
  });

  it("assertDisclaimersPresent detects the presence of key disclaimers", () => {
    const banner = `AURA is not sentient and does not experience feelings — it is a bounded software agent.
AURA is not your legal representative. It cannot sign anything on your behalf.
A person still confirms the actions that affect your services, money, or safety.`;
    expect(assertDisclaimersPresent(banner)).toBe(true);
  });
});
