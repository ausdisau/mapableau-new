import { requireAuth } from "@/lib/auth/guards";
import { listOpenConflicts } from "@/lib/offline/conflict-resolution-service";

export const metadata = { title: "Sync conflicts" };

export default async function SyncConflictsPage() {
  const user = await requireAuth();
  const conflicts = await listOpenConflicts(user.id).catch(() => []);

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Sync conflicts</h1>
      <p className="text-sm text-muted-foreground">
        When your offline changes differ from the server, review them here. We will not overwrite server data without your confirmation.
      </p>
      <ul className="divide-y rounded-lg border">
        {conflicts.length === 0 ? (
          <li className="p-4 text-sm">No open conflicts.</li>
        ) : (
          conflicts.map((c) => (
            <li key={c.id} className="p-4">
              <div className="font-medium">{c.conflictType}</div>
              <div className="text-xs text-muted-foreground">{c.createdAt.toLocaleString()}</div>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
