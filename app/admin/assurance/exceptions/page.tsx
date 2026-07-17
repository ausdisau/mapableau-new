import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { listExceptions } from "@/lib/assurance/exceptions/exception-service";

export default async function AssuranceExceptionsPage() {
  await requireAdmin();
  const exceptions = await listExceptions();

  return (
    <div className="space-y-6">
      <p>
        <Link className="underline" href="/admin/assurance">
          Back to assurance
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Assurance exceptions</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        Only approved, non-expired exceptions are usable. Empty or expired exceptions
        never support approval.
      </p>
      {exceptions.length === 0 ? (
        <p>No exceptions recorded.</p>
      ) : (
        <ul className="space-y-3">
          {exceptions.map((exception) => (
            <li key={exception.id} className="rounded-lg border p-4">
              <div className="font-medium">{exception.title}</div>
              <div className="text-sm">
                Status {exception.status} · usable:{" "}
                {exception.usability.usable ? "yes" : "no"} ({exception.usability.reason})
              </div>
              {exception.expiresAt ? (
                <div className="text-sm text-muted-foreground">
                  Expires {exception.expiresAt.toISOString().slice(0, 10)}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
