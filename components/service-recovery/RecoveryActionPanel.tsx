"use client";

export function RecoveryActionPanel({
  caseId,
  status,
}: {
  caseId: string;
  status: string;
}) {
  async function escalate() {
    await fetch(`/api/service-recovery/cases/${caseId}/escalate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Participant requested help from support team." }),
    });
  }

  async function resolve() {
    await fetch(`/api/service-recovery/cases/${caseId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolutionSummary: "Resolved by participant." }),
    });
  }

  return (
    <section className="flex flex-wrap gap-2" aria-label="Recovery actions">
      <button
        type="button"
        onClick={() => void escalate()}
        className="min-h-11 rounded-lg border border-input px-4"
      >
        Ask support for help
      </button>
      {status !== "resolved" ? (
        <button
          type="button"
          onClick={() => void resolve()}
          className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground"
        >
          Mark resolved
        </button>
      ) : null}
    </section>
  );
}
