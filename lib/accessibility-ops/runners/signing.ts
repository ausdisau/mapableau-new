import { createHmac, createHash, timingSafeEqual, randomUUID } from "crypto";

export interface RunnerIdentity {
  runnerId: string;
  runnerVersion: string;
}

export interface SignedTestResultPayload {
  runnerId: string;
  runnerVersion: string;
  ruleStableKey: string;
  ruleVersionId: string;
  assetVersionId: string;
  environment: string;
  browserOrDevice?: string;
  assistiveTechnology?: string;
  testedAt: string;
  outcome: string;
  reasonCodes: string[];
  evidenceRefs?: string[];
  limitations?: string;
  confidence?: string;
  nonce: string;
  resultHash: string;
  signature: string;
}

function runnerSecret(): string {
  return (
    process.env.MAPABLE_ACCESSIBILITY_OPS_RUNNER_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "dev-only-accessibility-ops-runner-secret"
  );
}

export function computeResultHash(
  payload: Omit<SignedTestResultPayload, "resultHash" | "signature">
): string {
  const canonical = JSON.stringify({
    runnerId: payload.runnerId,
    runnerVersion: payload.runnerVersion,
    ruleStableKey: payload.ruleStableKey,
    ruleVersionId: payload.ruleVersionId,
    assetVersionId: payload.assetVersionId,
    environment: payload.environment,
    browserOrDevice: payload.browserOrDevice ?? null,
    assistiveTechnology: payload.assistiveTechnology ?? null,
    testedAt: payload.testedAt,
    outcome: payload.outcome,
    reasonCodes: [...payload.reasonCodes].sort(),
    evidenceRefs: payload.evidenceRefs ?? [],
    limitations: payload.limitations ?? null,
    confidence: payload.confidence ?? null,
    nonce: payload.nonce,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export function signResultHash(resultHash: string, runnerId: string): string {
  return createHmac("sha256", runnerSecret())
    .update(`${runnerId}:${resultHash}`)
    .digest("hex");
}

export function buildSignedTestResult(
  input: Omit<
    SignedTestResultPayload,
    "nonce" | "resultHash" | "signature"
  > & { nonce?: string }
): SignedTestResultPayload {
  const nonce = input.nonce ?? randomUUID();
  const base = { ...input, nonce };
  const resultHash = computeResultHash(base);
  const signature = signResultHash(resultHash, input.runnerId);
  return { ...base, resultHash, signature };
}

export function verifySignedTestResult(
  payload: SignedTestResultPayload
): { ok: true } | { ok: false; reason: string } {
  const expectedHash = computeResultHash(payload);
  if (expectedHash !== payload.resultHash) {
    return { ok: false, reason: "RESULT_HASH_MISMATCH" };
  }
  const expectedSig = signResultHash(payload.resultHash, payload.runnerId);
  const a = Buffer.from(expectedSig, "hex");
  const b = Buffer.from(payload.signature, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "SIGNATURE_INVALID" };
  }

  const pinnedVersion = process.env.MAPABLE_ACCESSIBILITY_OPS_RUNNER_VERSION_PIN;
  if (pinnedVersion && payload.runnerVersion !== pinnedVersion) {
    return { ok: false, reason: "STALE_RUNNER_VERSION" };
  }

  return { ok: true };
}

/** Replay protection: track nonces in-process (Wave 2). */
const seenNonces = new Set<string>();

export function consumeRunnerNonce(nonce: string): boolean {
  if (seenNonces.has(nonce)) return false;
  seenNonces.add(nonce);
  if (seenNonces.size > 10_000) {
    seenNonces.clear();
  }
  return true;
}

export function clearRunnerNoncesForTests(): void {
  seenNonces.clear();
}
