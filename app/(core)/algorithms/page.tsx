import { listPublishedAlgorithms } from "@/lib/algorithm-register/register-service";

export default async function AlgorithmsPage() {
  const algorithms = await listPublishedAlgorithms();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Public algorithm register</h1>
      <p className="text-muted-foreground">
        Algorithms used in MapAble — transparency, not legal certification of fairness.{" "}
        <a href="/square" className="font-medium text-primary hover:underline">
          MapAble Square
        </a>{" "}
        does not use additive feed ranking; discussion rooms stay chronological.
      </p>
      <ul className="space-y-4">
        {algorithms.map((a) => (
          <li key={a.id} className="rounded-lg border p-4">
            <h2 className="font-semibold">
              {a.name} <span className="text-sm font-normal">v{a.version}</span>
            </h2>
            <p className="text-sm">{a.purpose}</p>
            {a.fairnessNotes ? (
              <p className="mt-2 text-xs text-muted-foreground">{a.fairnessNotes}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
