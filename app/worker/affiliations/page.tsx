import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { listWorkerAffiliationsForUser } from "@/lib/workers/worker-profile-service";

export default async function WorkerAffiliationsPage() {
  const user = await requirePermission("profile:read:self");
  const affiliations = await listWorkerAffiliationsForUser(user.id);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">Your affiliations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Providers and organisations you are linked to as a support worker.
        </p>
      </div>

      {affiliations.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          You are not affiliated with a provider yet. If a provider invited you,
          accept the invitation when it arrives, or complete{" "}
          <Link href="/worker/onboarding" className="underline">
            onboarding
          </Link>{" "}
          for your independent profile.
        </p>
      ) : (
        <ul className="space-y-4">
          {affiliations.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-border p-4 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">
                  {a.providers[0]?.name ?? a.organisation.name}
                </h2>
                <span
                  className="text-xs uppercase tracking-wide rounded-full px-2 py-0.5 bg-muted"
                  data-status={a.affiliationStatus}
                >
                  {a.affiliationStatus}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Organisation: {a.organisation.name}
                {a.organisation.organisationType === "independent_support_worker"
                  ? " (personal)"
                  : ""}
              </p>
              <p className="text-sm">Profile name: {a.displayName}</p>
              {a.affiliatedAt && (
                <p className="text-xs text-muted-foreground">
                  Affiliated{" "}
                  {new Date(a.affiliatedAt).toLocaleDateString("en-AU")}
                </p>
              )}
              {a.affiliationStatus !== "ended" && (
                <Link
                  href="/worker/profile/edit"
                  className="text-sm underline inline-block"
                >
                  Edit profile
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
