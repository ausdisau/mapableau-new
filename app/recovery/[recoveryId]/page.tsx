"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ParticipantGoalCard } from "@/components/continuity-os/ParticipantGoalCard";
import { RecoveryOptionCard } from "@/components/continuity-os/RecoveryOptionCard";

export default function RecoveryDetailPage() {
  const params = useParams<{ recoveryId: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/recovery/cases/${params.recoveryId}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.message ?? json.error);
      return;
    }
    setData(json.recoveryCase);
  }

  useEffect(() => {
    load().catch(() => setError("Could not load recovery case."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.recoveryId]);

  const recoveryCase = data as
    | {
        id: string;
        originalGoal: string;
        status: string;
        playbookCode?: string | null;
        selectedOptionId?: string | null;
        options: Array<{
          id: string;
          optionKey: string;
          label: string;
          description: string;
          availabilityState: string;
          preservesOriginalGoal: boolean;
          hardRequirementsMet: boolean;
          excludedReason?: string | null;
          costJson: { estimated?: boolean; whoPays?: string; fundingUncertainty?: string };
        }>;
      }
    | null;

  async function selectOption(optionId: string) {
    setMessage(null);
    const res = await fetch(
      `/api/recovery/cases/${params.recoveryId}/select-option`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      }
    );
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.message ?? "Could not select option.");
      return;
    }
    setMessage("Option selected. Prepare a proposal next — this is not execution.");
    await load();
  }

  async function prepareProposal() {
    const res = await fetch(
      `/api/recovery/cases/${params.recoveryId}/prepare-proposal`,
      { method: "POST" }
    );
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.message ?? "Could not prepare proposal.");
      return;
    }
    setMessage(
      `Proposal prepared (${json.actionLink?.state}). Request created: ${json.states?.requestCreated}. Ride confirmed: ${json.states?.rideConfirmed}.`
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <p className="text-sm">
        <Link href="/recovery" className="underline">
          Recovery
        </Link>
      </p>
      <h1 className="text-2xl font-semibold">Recovery case</h1>
      {error ? (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {recoveryCase ? (
        <>
          <ParticipantGoalCard goal={recoveryCase.originalGoal} />
          <p className="text-sm">
            Status: <strong>{recoveryCase.status}</strong>
            {recoveryCase.playbookCode
              ? ` · Playbook: ${recoveryCase.playbookCode}`
              : null}
          </p>
          <nav aria-label="Recovery sections" className="text-sm">
            <ul className="flex flex-wrap gap-3">
              <li>
                <Link
                  className="underline"
                  href={`/recovery/${params.recoveryId}/options`}
                >
                  Options
                </Link>
              </li>
              <li>
                <Link
                  className="underline"
                  href={`/recovery/${params.recoveryId}/actions`}
                >
                  Actions
                </Link>
              </li>
              <li>
                <Link
                  className="underline"
                  href={`/recovery/${params.recoveryId}/receipts`}
                >
                  Receipts
                </Link>
              </li>
              <li>
                <Link
                  className="underline"
                  href={`/recovery/${params.recoveryId}/rights`}
                >
                  Rights
                </Link>
              </li>
              <li>
                <Link
                  className="underline"
                  href={`/recovery/${params.recoveryId}/outcome`}
                >
                  Outcome
                </Link>
              </li>
            </ul>
          </nav>
          <section className="space-y-3" aria-labelledby="options-heading">
            <h2 id="options-heading" className="text-lg font-semibold">
              Recovery options
            </h2>
            {recoveryCase.options.map((option) => (
              <RecoveryOptionCard
                key={option.id}
                optionKey={option.optionKey}
                label={option.label}
                description={option.description}
                availabilityState={option.availabilityState}
                preservesOriginalGoal={option.preservesOriginalGoal}
                hardRequirementsMet={option.hardRequirementsMet}
                excludedReason={option.excludedReason}
                selected={recoveryCase.selectedOptionId === option.id}
                costSummary={
                  option.costJson?.estimated
                    ? `Estimated — ${option.costJson.whoPays} (${option.costJson.fundingUncertainty})`
                    : undefined
                }
                onSelect={() => selectOption(option.id)}
              />
            ))}
          </section>
          <button
            type="button"
            onClick={prepareProposal}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Prepare proposal
          </button>
          {message ? <p className="text-sm text-slate-800">{message}</p> : null}
        </>
      ) : null}
    </main>
  );
}
