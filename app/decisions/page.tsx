import { listPublicDecisions } from "@/lib/public-decision-register/decision-service";

export default async function PublicDecisionsPage() {
  const decisions = await listPublicDecisions();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Public decision register</h1>
      <p className="text-muted-foreground">
        Recorded governance and policy decisions — not legal advice.
      </p>
      <ul className="space-y-4">
        {decisions.map((d) => (
          <li key={d.id} className="rounded-lg border p-4">
            <h2 className="font-semibold">{d.title}</h2>
            <p className="text-sm">{d.summary}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {d.decisionType}
              {d.publishedAt
                ? ` — ${d.publishedAt.toLocaleDateString("en-AU")}`
                : ""}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
