import { getOversightPortalSummary } from "@/lib/oversight-board/oversight-service";

export default async function OversightPage() {
  const data = await getOversightPortalSummary();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Oversight board</h1>
      {data.disabled ? (
        <p>Oversight board portal is not enabled in this environment.</p>
      ) : (
        <>
          <section>
            <h2 className="font-medium">Meetings</h2>
            <ul className="mt-2 space-y-2">
              {data.meetings.map((m) => (
                <li key={m.id} className="rounded border p-3 text-sm">
                  {m.title} — {m.status}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="font-medium">Published decisions</h2>
            <ul className="mt-2 space-y-2">
              {data.decisions.map((d) => (
                <li key={d.id} className="rounded border p-3 text-sm">
                  {d.title}
                  <p className="text-muted-foreground">{d.summary}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
