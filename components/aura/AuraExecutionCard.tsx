"use client";

import type { AuraExecutionApproval } from "@/lib/aura/execution/types";

type DisclosureField = { key: string; label: string; valuePreview?: string };

export function AuraExecutionApprovalCard({
  approvalLabel,
  limitationNotice,
  recipient,
  fieldsShared,
  fieldsOmitted,
  expectedResult,
  possibleFailures,
  expiresAt,
  onConfirm,
  onDecline,
  busy,
}: {
  approvalLabel: string;
  limitationNotice: string;
  recipient: string;
  fieldsShared: DisclosureField[];
  fieldsOmitted: DisclosureField[];
  expectedResult: string;
  possibleFailures: string[];
  expiresAt: string;
  onConfirm: () => void;
  onDecline: () => void;
  busy?: boolean;
}) {
  return (
    <section aria-labelledby="exec-approval-heading" className="space-y-3 rounded border p-4">
      <h2 id="exec-approval-heading" className="text-lg font-semibold">
        Execution review
      </h2>
      <p role="status">{limitationNotice}</p>
      <div>
        <h3 className="font-medium">Recipient</h3>
        <p>{recipient}</p>
      </div>
      <div>
        <h3 className="font-medium">Information shared</h3>
        <ul>
          {fieldsShared.map((f) => (
            <li key={f.key}>{f.label}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-medium">Information omitted</h3>
        <ul>
          {fieldsOmitted.map((f) => (
            <li key={f.key}>{f.label}</li>
          ))}
        </ul>
      </div>
      <p>
        <strong>Expected result:</strong> {expectedResult}
      </p>
      <p>
        <strong>Expires:</strong> {new Date(expiresAt).toLocaleString()}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded bg-blue-700 px-4 py-2 text-white"
          onClick={onConfirm}
          disabled={busy}
          aria-busy={busy}
        >
          {approvalLabel}
        </button>
        <button type="button" className="rounded border px-4 py-2" onClick={onDecline} disabled={busy}>
          Decline
        </button>
      </div>
    </section>
  );
}

export function AuraExecutionProgress({ state }: { state: string }) {
  return (
    <p role="status" aria-live="polite" className="rounded border px-3 py-2 text-sm">
      Current step: {state.replaceAll("_", " ")}
    </p>
  );
}

export function AuraExecutionReceiptCard({
  summary,
  limitations,
  finalState,
}: {
  summary: string;
  limitations: string[];
  finalState: string;
}) {
  return (
    <article className="space-y-2 rounded border p-4">
      <h2 className="text-lg font-semibold">Execution receipt</h2>
      <p>{summary}</p>
      <p>
        <strong>Status:</strong> {finalState.replaceAll("_", " ")}
      </p>
      <AuraRealityBoundaryNotice limitations={limitations} />
    </article>
  );
}

export function AuraRealityBoundaryNotice({ limitations }: { limitations: string[] }) {
  return (
    <div>
      <h3 className="font-medium">What this does not guarantee</h3>
      <ul>
        {limitations.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

export function AuraPostconditionList({
  items,
}: {
  items: Array<{ condition: string; passed: boolean }>;
}) {
  return (
    <ul>
      {items.map((i) => (
        <li key={i.condition}>
          {i.condition}: {i.passed ? "passed" : "failed"}
        </li>
      ))}
    </ul>
  );
}

export type { AuraExecutionApproval };
