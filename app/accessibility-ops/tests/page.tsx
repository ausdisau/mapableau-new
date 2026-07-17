import { isAccessibilityOpsFlagEnabled } from "@/lib/accessibility-ops/feature-flags";
import { getAccessibilityOpsMode } from "@/lib/accessibility-ops/feature-flags";

export default function AccessibilityOpsTestsPage() {
  const enabled = isAccessibilityOpsFlagEnabled("testLab");
  const mode = getAccessibilityOpsMode();

  return (
    <section aria-labelledby="tests-heading" className="space-y-4">
      <h2 id="tests-heading" className="text-xl font-semibold">
        Test laboratory (shadow)
      </h2>
      <dl className="grid gap-3 sm:grid-cols-2 text-sm">
        <div className="rounded-md border border-border p-3">
          <dt className="text-muted-foreground">Test lab flag</dt>
          <dd>{enabled ? "enabled" : "disabled"}</dd>
        </div>
        <div className="rounded-md border border-border p-3">
          <dt className="text-muted-foreground">Mode</dt>
          <dd>{mode}</dd>
        </div>
      </dl>
      <ul className="list-disc space-y-2 pl-5 text-sm">
        <li>
          Runner script:{" "}
          <code>runners/accessibility-ops/shadow-web-runner.mjs</code>
        </li>
        <li>
          Ingest endpoint:{" "}
          <code>POST /api/internal/accessibility-ops/test-results</code>
        </li>
        <li>
          Auth: header <code>x-mapable-runner-secret</code> matching{" "}
          <code>MAPABLE_ACCESSIBILITY_OPS_RUNNER_SECRET</code>
        </li>
        <li>Results are signed and hashed. Replay nonces are rejected.</li>
        <li>Ingest never blocks releases while gate flags remain off.</li>
      </ul>
      <p className="text-sm text-muted-foreground">
        List alternative for any future charts: use the evaluation JSON returned
        by shadow evaluate and runner ingest APIs.
      </p>
    </section>
  );
}
