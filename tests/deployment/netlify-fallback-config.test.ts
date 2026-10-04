import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  ".github/workflows/netlify-fallback-release.yml",
  "utf8",
);
const netlifyConfig = readFileSync("netlify.toml", "utf8");
const nextConfig = readFileSync("next.config.ts", "utf8");

describe("Netlify fallback deployment contract", () => {
  it("keeps production behind explicit human-controlled workflow gates", () => {
    expect(workflow).toContain('environment: netlify-production');
    expect(workflow).toContain("inputs.confirm_production == 'PROMOTE NETLIFY'");
    expect(workflow).toContain("github.event_name == 'workflow_dispatch'");
  });

  it("keeps preview and production environment enforcement distinct", () => {
    expect(netlifyConfig).toContain('[context.deploy-preview.environment]');
    expect(netlifyConfig).toContain('MAPABLE_ENFORCE_PRODUCTION_ENV = "false"');
    expect(netlifyConfig).toContain('[context.production.environment]');
    expect(netlifyConfig).toContain('MAPABLE_ENFORCE_PRODUCTION_ENV = "true"');
    expect(workflow).toContain(
      '--env "MAPABLE_ENFORCE_PRODUCTION_ENV=false"',
    );
    expect(workflow).toContain(
      '--env "MAPABLE_ENFORCE_PRODUCTION_ENV=true"',
    );
    expect(workflow).toContain(
      '--env "MAPABLE_ACCESS_EXPERIENCE_V2_ENABLED=true"',
    );
  });

  it("does not automate the mapable.com.au DNS cutover", () => {
    expect(workflow).not.toMatch(/cloudflare.*dns|route53|dnsimple|dns.*update/i);
    expect(workflow).toContain(
      "DNS cutover is intentionally NOT automated by this workflow.",
    );
  });

  it("requires external Netlify credentials without committing values", () => {
    expect(workflow).toContain("secrets.NETLIFY_AUTH_TOKEN");
    expect(workflow).toContain("secrets.NETLIFY_SITE_ID");
    expect(workflow).not.toMatch(/NETLIFY_AUTH_TOKEN:\s*['\"][A-Za-z0-9_-]{20,}/);
  });

  it("keeps the portable Node recovery build opt-in", () => {
    expect(nextConfig).toContain(
      'process.env.MAPABLE_PORTABLE_BUILD === "1" ? "standalone" : undefined',
    );
  });

  it("enables pnpm compatibility required by Netlify Next.js builds", () => {
    expect(netlifyConfig).toContain('PNPM_FLAGS = "--shamefully-hoist"');
  });
});
