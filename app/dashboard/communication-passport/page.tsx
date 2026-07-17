"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type PassportResponse = {
  passport: {
    id: string;
    state: string;
    participantAuthoredInstructions: string[];
    requirements: Array<{
      kind: string;
      value: string | boolean | number;
      instructions?: string;
      evidenceClass: string;
    }>;
    capacityImplication: string;
    consentImplication: string;
    evidenceClass: string;
    isSynthetic?: boolean;
  };
  handoffCard: {
    title: string;
    printableText: string;
    capacityNote: string;
    consentNote: string;
  };
  productionClaimState: string;
  error?: string;
};

export default function CommunicationPassportPage() {
  const [data, setData] = useState<PassportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [useFixture, setUseFixture] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = useFixture ? "?fixture=taylor" : "";
      const res = await fetch(`/api/communications/passport${qs}`);
      const json = (await res.json()) as PassportResponse & { error?: string };
      if (!res.ok) {
        setError(
          json.error ??
            "Communication Passport is unavailable. The feature may be disabled."
        );
        setData(null);
      } else {
        setData(json);
      }
    } catch {
      setError("Could not load Communication Passport.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [useFixture]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm text-neutral-600">
        <Link href="/dashboard" className="underline">
          Dashboard
        </Link>
        {" / "}
        Communication Passport
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Communication Passport
      </h1>
      <p className="mt-2 max-w-prose text-neutral-700">
        Your instructions for how support workers and services should communicate
        with you. Communication support does not reduce your decision-making
        capacity.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useFixture}
            onChange={(e) => setUseFixture(e.target.checked)}
          />
          Show synthetic Taylor fixture
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded border border-neutral-400 px-3 py-2 text-sm min-h-11"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <p className="mt-6" role="status">
          Loading passport…
        </p>
      )}
      {error && (
        <div
          className="mt-6 rounded border border-amber-700 bg-amber-50 p-4"
          role="alert"
        >
          <p className="font-medium">Unavailable</p>
          <p className="mt-1 text-sm">{error}</p>
          <p className="mt-2 text-sm">
            Enable{" "}
            <code>MAPABLE_COMMUNICATIONS_ENABLED</code> and{" "}
            <code>MAPABLE_COMMUNICATION_PASSPORT_ENABLED</code> to use this
            preview.
          </p>
        </div>
      )}

      {data && (
        <section className="mt-8 space-y-6" aria-labelledby="passport-heading">
          <h2 id="passport-heading" className="text-xl font-semibold">
            {data.handoffCard.title}
          </h2>
          {data.passport.isSynthetic && (
            <p className="text-sm font-medium text-amber-900">
              Synthetic fixture — not real participant data.
            </p>
          )}
          <p className="text-sm">
            State: <strong>{data.passport.state}</strong> · Evidence:{" "}
            <strong>{data.passport.evidenceClass}</strong> · Claim:{" "}
            <strong>{data.productionClaimState}</strong>
          </p>

          <div>
            <h3 className="text-lg font-medium">Your instructions</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              {data.passport.participantAuthoredInstructions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium">Requirements</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              {data.passport.requirements.map((req) => (
                <li key={`${req.kind}-${String(req.value)}`}>
                  {req.instructions ?? `${req.kind}: ${String(req.value)}`}{" "}
                  <span className="text-sm text-neutral-600">
                    ({req.evidenceClass})
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="rounded border border-neutral-300 p-4">
            <h3 className="font-medium">Important</h3>
            <p className="mt-2 text-sm">{data.handoffCard.capacityNote}</p>
            <p className="mt-2 text-sm">{data.handoffCard.consentNote}</p>
          </aside>

          <div>
            <h3 className="text-lg font-medium">Printable handoff card</h3>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-neutral-100 p-4 text-sm">
              {data.handoffCard.printableText}
            </pre>
          </div>
        </section>
      )}
    </main>
  );
}
