import { requireAuth } from "@/lib/auth/guards";

export const metadata = { title: "Access notes | MapAble Worker" };

export default async function WorkerNotesPage() {
  await requireAuth();

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-bold">Access notes</h1>
      <p className="text-sm text-muted-foreground">
        Plain-language summaries for participants you are assigned to support.
        Shown only with active consent.
      </p>
      <p className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
        No access notes to display. Notes appear when you have an active shift
        and consent allows sharing.
      </p>
    </div>
  );
}
