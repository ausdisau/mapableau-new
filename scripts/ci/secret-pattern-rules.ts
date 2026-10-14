/**
 * Shared secret-pattern rules for CI scanning and unit tests.
 * Never place real credentials in fixtures — use clearly fake values only.
 */

export type SecretPattern = { re: RegExp; label: string };

const PLACEHOLDER =
  "(?:changeme|your-?password|replace-?me|xxx+|<.*>|\\*{3,}|\\[[^\\]]*\\]|example|placeholder|TODO|REDACTED|password123|secret123)";

export const SECRET_PATTERNS: SecretPattern[] = [
  {
    re: /-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----/,
    label: "private key block",
  },
  { re: /AKIA[0-9A-Z]{16}/, label: "AWS access key id" },
  { re: /ghp_[A-Za-z0-9]{36}/, label: "GitHub PAT" },
  { re: /xox[baprs]-[A-Za-z0-9-]{10,}/, label: "Slack token" },
  {
    re: /sk_live_[A-Za-z0-9]{20,}/,
    label: "Stripe live secret",
  },
  {
    // Narrative / env disclosure: Password: value or PASSWORD=value (not TS field types)
    re: new RegExp(
      `(?:^|[\\s"'\\\`])(?:Password|PASSWORD|passwd)\\s*[:=]\\s*(?!["']?${PLACEHOLDER}["']?\\s*(?:$|[\\s#,;]))["']?[^\\s"'\\\`]{8,}`,
      "m",
    ),
    label: "password assignment",
  },
  {
    // email + Password: pair in prose (docs / PR templates)
    re: new RegExp(
      `[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}[\\s\\S]{0,80}(?:Password|PASSWORD|passwd)\\s*[:=]\\s*(?!["']?${PLACEHOLDER})\\S{6,}`,
      "i",
    ),
    label: "email and password pair",
  },
  {
    // https://user:pass@host
    re: /https?:\/\/[^/\s:@]+:[^/\s:@]{4,}@/i,
    label: "URL with embedded credentials",
  },
  {
    // Non-example assignment of common secret env keys with long values
    re: /(?:^|[\s])(?:UBER_CLIENT_SECRET|ORS_API_KEY|NEXTAUTH_SECRET)\s*=\s*(?!["']?(?:your-|change-me|example|<.*>|\$\{))["']?[^\s"'`]{12,}/i,
    label: "env secret value (non-placeholder)",
  },
];

/** Labels enforced inside docs/, .github/, .env.example (not application source). */
export const DOCS_SCAN_LABELS = new Set([
  "private key block",
  "password assignment",
  "email and password pair",
  "URL with embedded credentials",
]);

/** Labels that only apply to docs / templates (too noisy in TypeScript). */
export const DOCS_ONLY_LABELS = new Set([
  "password assignment",
  "email and password pair",
]);

export function isDocsOrExamplePath(rel: string): boolean {
  return (
    rel.includes("docs/") ||
    rel.endsWith(".env.example") ||
    rel.includes(".github/")
  );
}

export function findSecretPatternHits(
  text: string,
  rel: string,
  options?: { allowPathSnippets?: string[] },
): Array<{ label: string }> {
  const allow = options?.allowPathSnippets ?? [];
  if (allow.some((s) => rel.includes(s))) return [];
  const hits: Array<{ label: string }> = [];
  const docsMode = isDocsOrExamplePath(rel);
  for (const { re, label } of SECRET_PATTERNS) {
    re.lastIndex = 0;
    if (docsMode) {
      if (!DOCS_SCAN_LABELS.has(label)) continue;
    } else if (DOCS_ONLY_LABELS.has(label)) {
      continue;
    }
    if (re.test(text)) {
      hits.push({ label });
    }
  }
  return hits;
}
