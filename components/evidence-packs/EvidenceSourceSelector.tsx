"use client";

export function EvidenceSourceSelector({ packId }: { packId: string }) {
  async function addGoal() {
    await fetch(`/api/evidence-packs/${packId}/add-item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceType: "participant_goals",
        label: "Participant goals snapshot",
      }),
    });
  }

  return (
    <section className="space-y-2">
      <h2 className="font-heading text-lg font-semibold">Add evidence</h2>
      <button type="button" onClick={() => void addGoal()} className="min-h-11 rounded-lg border px-4">
        Include goals
      </button>
    </section>
  );
}
