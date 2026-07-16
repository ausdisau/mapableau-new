import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Missions | Support coordinator",
  description: "Participant-authorised coordination missions.",
};

export default function SupportCoordinatorMissionsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Coordination missions</h1>
      <p className="mt-3 text-slate-700">
        Mission console foundations for multi-module goals. Requires participant
        consent; writes need approval. Chat is never the only workflow — use this
        structured view and the participant mission page.
      </p>
      <p className="mt-3">
        Enable <code>ACCESS_INTELLIGENCE_MISSION_CONSOLE=true</code>.
      </p>
    </main>
  );
}
