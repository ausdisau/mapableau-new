import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { listParticipantAppeals } from "@/lib/public-interest-governance/governance-service";

export const dynamic = "force-dynamic";

export default async function ParticipantAppealsPage() {
  const user = await requireAuth();
  const appeals = await listParticipantAppeals({ participantUserId: user.id });

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">My appeals</h1>
        <p className="text-sm text-muted-foreground">
          Challenge consequential decisions without retaliation. Service access
          continues where it is safe and lawful while an appeal is reviewed.
        </p>
      </header>
      <section className="rounded border border-dashed border-neutral-400 bg-neutral-50 p-4 text-sm">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Use the appeal link in a decision notice to start a new appeal.
          </li>
          <li>You can add evidence or request an accessible format.</li>
          <li>The original decision-maker cannot decide your appeal.</li>
          <li>No appeal content is published on public transparency pages.</li>
        </ul>
      </section>
      {appeals.length === 0 ? (
        <p className="rounded border border-dashed p-4 text-sm">
          No appeals yet. Review your{" "}
          <Link href="/participant/vault/disputes" className="underline">
            dispute and appeal options
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-3">
          {appeals.map((appeal) => (
            <li key={appeal.id} className="rounded border p-4 text-sm">
              <p className="font-semibold">{appeal.decision.title}</p>
              <p>
                {appeal.status} · service continued:{" "}
                {appeal.serviceAccessContinued ? "yes" : "no"}
              </p>
              <p className="text-muted-foreground">
                Grounds: {appeal.grounds.length} · Evidence submissions:{" "}
                {appeal.submissions.length}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
