import {
  CrawlAllowlistEntrySchema,
  type CrawlAllowlistEntry,
} from "@/lib/support-intelligence/spider/types";

/** Reviewed public hosts only — never screening or auth-gated systems. */
export const DEFAULT_CRAWL_ALLOWLIST: CrawlAllowlistEntry[] = [
  CrawlAllowlistEntrySchema.parse({
    host: "www.ndis.gov.au",
    paths: ["/participants/", "/providers/"],
    maxPagesPerRun: 10,
    robotsRequired: true,
  }),
  CrawlAllowlistEntrySchema.parse({
    host: "www.ndiscommission.gov.au",
    paths: [
      "/provider-registration/",
      "/compliance-and-enforcement-actions",
      "/workforce/worker-screening",
    ],
    maxPagesPerRun: 10,
    robotsRequired: true,
  }),
];

const BLOCKED_HOST_SUFFIXES = [
  "nwschc.org.au",
  "workercheck",
  "screening",
  "localhost",
  "127.0.0.1",
  "169.254.",
  "metadata.google",
];

export function isHostBlocked(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)
  ) {
    return true;
  }
  return BLOCKED_HOST_SUFFIXES.some((s) => host.includes(s));
}

export function findAllowlistEntry(
  urlString: string,
  allowlist: CrawlAllowlistEntry[] = DEFAULT_CRAWL_ALLOWLIST,
): CrawlAllowlistEntry | null {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (isHostBlocked(url.hostname)) return null;

  for (const entry of allowlist) {
    if (url.hostname.toLowerCase() !== entry.host.toLowerCase()) continue;
    const pathOk = entry.paths.some(
      (p) => url.pathname === p || url.pathname.startsWith(p),
    );
    if (pathOk) return entry;
  }
  return null;
}

/** Minimal robots.txt disallow check for User-agent: * rules. */
export function isPathDisallowedByRobots(
  robotsTxt: string,
  pathname: string,
): boolean {
  const lines = robotsTxt.split(/\r?\n/);
  let inStar = false;
  const disallows: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const lower = line.toLowerCase();
    if (lower.startsWith("user-agent:")) {
      const ua = line.slice("user-agent:".length).trim();
      inStar = ua === "*";
      continue;
    }
    if (!inStar) continue;
    if (lower.startsWith("disallow:")) {
      const path = line.slice("disallow:".length).trim();
      if (path) disallows.push(path);
    }
  }
  return disallows.some(
    (d) => d === "/" || pathname === d || pathname.startsWith(d),
  );
}
