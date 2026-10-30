/**
 * Fail-closed, read-only MapAble Assessment production release gate.
 * This approves nothing and never deploys or changes feature flags.
 *
 * Invocation: GitHub Actions manual dispatch on protected main.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const REQUIRED_CHECKS = Object.freeze([
  "CI",
  "verify",
  "Security / dependency-audit",
  "Security / authentication",
  "Security / secrets",
  "Security / environment",
  "Security / public-api-exposure",
  "Security / upload-validation",
  "Security / semgrep",
  "Accessibility",
  "Migrations",
  "Migrate from zero",
  "Production claims",
  "CSP enforce preview",
  "Analyze (javascript-typescript)",
]);

export const REQUIRED_SIGNOFFS = Object.freeze([
  "security",
  "privacy",
  "participantAccessibility",
  "operations",
]);

export function assessChecks(checks) {
  const problems = [];
  for (const name of REQUIRED_CHECKS) {
    const matching = checks
      .filter((c) => c.name === name && c.app?.slug === "github-actions")
      .sort((a, b) => Date.parse(b.started_at || "1970-01-01") - Date.parse(a.started_at || "1970-01-01"));
    const latest = matching[0];
    if (!latest || latest.status !== "completed" || latest.conclusion !== "success") {
      problems.push(`Required check not successful: ${name}`);
    }
  }
  return problems;
}

const isSha = (x) => typeof x === "string" && /^[0-9a-f]{40}$/.test(x);
const isHttps = (x) => typeof x === "string" && /^https:\/\/[^\s]+$/i.test(x);

export function assessEvidence(doc, sha, now = new Date()) {
  const errors = [];
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return ["Release evidence absent or malformed"];
  if (doc.schemaVersion !== 1) errors.push("Unsupported release evidence schema");
  if (!isSha(doc.releaseSha) || doc.releaseSha !== sha) errors.push("Evidence SHA does not match requested release");
  const p = doc.preview;
  if (!p || p.commitSha !== sha || !isHttps(p.url) || p.protected !== true || p.syntheticOnly !== true) {
    errors.push("Protected synthetic-data preview evidence missing or SHA mismatch");
  }
  for (const role of REQUIRED_SIGNOFFS) {
    const entry = doc.signoffs?.[role];
    if (!entry || entry.status !== "PASS" || !entry.reviewer || !isHttps(entry.evidenceUrl)) {
      errors.push(`Missing independent review evidence: ${role}`);
      continue;
    }
    const reviewedAt = Date.parse(entry.reviewedAt || "");
    if (!Number.isFinite(reviewedAt) || reviewedAt > now.getTime() || now.getTime() - reviewedAt > 30 * 86400_000) {
      errors.push(`Missing or stale review timestamp: ${role}`);
    }
  }
  if (doc.rollback?.status !== "PASS" || !isHttps(doc.rollback?.evidenceUrl)) {
    errors.push("Rollback exercise evidence missing");
  }
  if (doc.privacyLifecycle?.status !== "PASS" || !isHttps(doc.privacyLifecycle?.evidenceUrl)) {
    errors.push("Consent, encryption, retention and deletion evidence missing");
  }
  return errors;
}

async function gh(path, token) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) throw new Error(`GitHub evidence request returned HTTP ${response.status}: ${path}`);
  return response.json();
}

async function readAllCheckRuns(repo, sha, token) {
  const found = [];
  for (let page = 1; page <= 5; page++) {
    const data = await gh(`/repos/${repo}/commits/${sha}/check-runs?per_page=100&page=${page}`, token);
    if (!Array.isArray(data.check_runs)) throw new Error("GitHub returned unrecognised check run format");
    found.push(...data.check_runs);
    if (data.check_runs.length < 100) return found;
  }
  throw new Error("More than 500 check runs: explicit manual review required");
}

async function run() {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  const sha = process.env.RELEASE_SHA;
  if (!repo || !/^[-\w.]+\/[-\w.]+$/.test(repo) || !token || !isSha(sha)) {
    throw new Error("Missing valid GitHub repository, token or exact release SHA");
  }
  if (process.env.GITHUB_REF !== "refs/heads/main") {
    throw new Error("Assessment gate may only run from main");
  }
  if (process.env.GITHUB_SHA !== sha) {
    throw new Error("Requested release SHA must equal the checked-out main workflow commit");
  }

  const current = await gh(`/repos/${repo}/git/ref/heads/main`, token);
  if (current.object?.sha !== sha) throw new Error("Release SHA is not the current main HEAD");

  const errors = assessChecks(await readAllCheckRuns(repo, sha, token));
  if (!existsSync("lib/config/assessment-release.ts")) {
    errors.push("The fail-closed assessment release flag is not merged into main");
  }
  const statuses = await gh(`/repos/${repo}/commits/${sha}/status`, token);
  if (!statuses.statuses?.some((s) => s.context === "Vercel – mapableau-new" && s.state === "success")) {
    errors.push("Canonical Next.js Vercel deployment status is not successful");
  }

  const env = await gh(`/repos/${repo}/environments/assessment-production`, token);
  const rules = Array.isArray(env.protection_rules) ? env.protection_rules : [];
  if (!rules.some((rule) => rule.type === "required_reviewers" && rule.reviewers?.length > 0)) {
    errors.push("assessment-production GitHub environment lacks required reviewers");
  }

  let evidence;
  try {
    const path = "docs/operations/assessment-production-evidence.json";
    const raw = readFileSync(path, "utf8");
    if (Buffer.byteLength(raw, "utf8") > 131072) throw new Error("Release evidence file too large");
    evidence = JSON.parse(raw);
  } catch {
    errors.push("Required approved assessment-production-evidence.json unavailable");
  }
  errors.push(...assessEvidence(evidence, sha));

  if (errors.length) {
    for (const issue of errors) console.error(`BLOCKED: ${issue}`);
    throw new Error(`Assessment production gate failed: ${errors.length} blocker(s)`);
  }
  console.log(`Assessment preflight verified for ${sha}; GitHub environment reviewer approval is still required. No deployment was performed.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
