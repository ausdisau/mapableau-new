import {
  EmptyState,
  TransparencyDisclaimer,
} from "@/app/transparency/_components";
import { listPublicRegisterChangeLog } from "@/lib/public-interest-governance/governance-service";

export const dynamic = "force-dynamic";

export default async function TransparencyChangeLogPage() {
  const changes = await listPublicRegisterChangeLog();

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Register change log</h1>
        <p className="text-sm text-muted-foreground">
          Append-only publication events for public register entries. Payload
          hashes support audit without exposing private payload content.
        </p>
      </header>
      <TransparencyDisclaimer />
      {changes.length === 0 ? (
        <EmptyState>
          No public register publication events are currently available.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {changes.map((change) => (
            <li key={change.id} className="rounded border p-4 text-sm">
              <p className="font-semibold">
                {change.publicTitle ?? change.kind}
              </p>
              <dl className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                <dt className="font-medium">Kind</dt>
                <dd>{change.kind}</dd>
                <dt className="font-medium">System key</dt>
                <dd>{change.systemKey ?? "Not linked"}</dd>
                <dt className="font-medium">Published</dt>
                <dd>{change.publishedAt ?? "Unknown"}</dd>
                <dt className="font-medium">Payload hash</dt>
                <dd className="break-all">{change.payloadHash}</dd>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
