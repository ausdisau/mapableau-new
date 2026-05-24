import { requirePermission } from "@/lib/auth/guards";

export default async function MatchingDebugPage() {
  await requirePermission("matching:run");

  return (
    <div className="space-y-4 p-4">
      <h1 className="font-heading text-2xl font-bold">Matching debug</h1>
      <p className="max-w-2xl text-muted-foreground">
        Test deterministic matching outputs. Use POST /api/matching/support-workers
        or /api/matching/providers with a signed-in session.
      </p>
      <pre className="overflow-auto rounded border bg-muted p-4 text-xs">
        {`curl -X POST /api/matching/support-workers -H "Cookie: ..."`}
      </pre>
    </div>
  );
}
