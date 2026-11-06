import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("redesign R8 participant dashboard home", () => {
  it("uses What needs you today structure instead of dense hub wall", () => {
    const source = read("app/dashboard/page.tsx");
    expect(source).toContain("What needs you today");
    expect(source).toContain("Next actions");
    expect(source).toContain("Upcoming trips and care");
    expect(source).toContain("Messages");
    expect(source).toContain("Preference summary");
    expect(source).not.toContain("Your control panel");
    expect(source).not.toContain("CoreHubCard");
    expect(source).toContain('aria-labelledby="next-actions-heading"');
    expect(source).toContain("min-h-11");
  });
});

describe("redesign R13 consent / evidence surfaces", () => {
  it("surfaces purpose, recipient, fields, revoke, and audit download", () => {
    const list = read("app/dashboard/consent/page.tsx");
    expect(list).toContain("Purpose:");
    expect(list).toContain("Recipient:");
    expect(list).toContain("Fields:");
    expect(list).toContain("DownloadConsentAuditButton");
    expect(list).toContain("RevokeConsentButton");
    expect(list).toContain("no ambient supporter access");

    expect(existsSync(join(root, "app/dashboard/consent/DownloadConsentAuditButton.tsx"))).toBe(
      true
    );

    const detail = read("app/dashboard/consent/[id]/page.tsx");
    expect(detail).toContain("Fields in scope");
    expect(detail).toContain("Revoke consent");
    expect(detail).toContain("/api/consents/");

    const api = read("app/api/consent/micro/route.ts");
    expect(api).toContain("exportParticipantConsentAuditCsv");

    const service = read("lib/consent/micro-consent-service.ts");
    expect(service).toContain("exportParticipantConsentAuditCsv");
  });
});

describe("redesign R15 Option A decision", () => {
  it("records Option A in the ANZ gap analysis decision log", () => {
    const gap = read("docs/strategy/BUSINESS_PLAN_ANZ_GAP_ANALYSIS.md");
    expect(gap).toContain("DECIDED_OPTION_A");
    expect(gap).toContain("Option A — Keep orchestration strategy");
    expect(gap).toContain("UNBLOCKED_OPTION_A");
    expect(gap).not.toMatch(/\|\s*—\s*\|\s*\*Pending\*/);
  });
});
