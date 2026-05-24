import Link from "next/link";

import { formatStatusLabel, DISPUTE_TYPE_LABELS } from "@/lib/disputes/labels";
import { listDisputesForUser } from "@/lib/disputes/dispute-service";
import { requireAuth } from "@/lib/auth/guards";

export const metadata = { title: "Disputes | MapAble Core" };

export default async function DisputesListPage() {
  const user = await requireAuth();
  const disputes = await listDisputesForUser({ userId: user.id });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Your disputes</h1>
          <p className="text-muted-foreground">
            Track invoice, booking and service disputes. Status is shown in words,
            not colour alone.
          </p>
        </div>
        <Link
          href="/dashboard/disputes/new"
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-6 py-3 text-primary-foreground"
        >
          Raise a dispute
        </Link>
      </header>
      <ul className="space-y-3">
        {disputes.map((d) => (
          <li key={d.id} className="rounded-lg border p-4">
            <Link
              href={`/dashboard/disputes/${d.id}`}
              className="font-medium text-primary underline"
            >
              {d.title}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              {DISPUTE_TYPE_LABELS[d.type]} · Status: {formatStatusLabel(d.status)}
            </p>
          </li>
        ))}
      </ul>
      {disputes.length === 0 ? (
        <p className="text-sm text-muted-foreground">You have no disputes yet.</p>
      ) : null}
    </div>
  );
}
