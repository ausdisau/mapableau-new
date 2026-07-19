"use client";

import type { AccessFactVerification } from "@/types/access-preflight";

export function VerificationMetadata({
  source,
  verificationStatus,
  lastCheckedAt,
  notes,
  confidence,
}: AccessFactVerification) {
  return (
    <dl className="mt-2 grid gap-1 text-xs text-slate-600">
      {source ? (
        <div>
          <dt className="inline font-bold">Source: </dt>
          <dd className="inline">{source}</dd>
        </div>
      ) : null}
      {verificationStatus ? (
        <div>
          <dt className="inline font-bold">Verification: </dt>
          <dd className="inline">{verificationStatus}</dd>
        </div>
      ) : null}
      {lastCheckedAt ? (
        <div>
          <dt className="inline font-bold">Last checked: </dt>
          <dd className="inline">{lastCheckedAt}</dd>
        </div>
      ) : null}
      {confidence ? (
        <div>
          <dt className="inline font-bold">Confidence: </dt>
          <dd className="inline">{confidence}</dd>
        </div>
      ) : null}
      {notes ? (
        <div>
          <dt className="inline font-bold">Notes: </dt>
          <dd className="inline">{notes}</dd>
        </div>
      ) : null}
    </dl>
  );
}
