import Link from "next/link";

import { PeopleWithAccess } from "@/components/authority/PeopleWithAccess";
import { listPeopleWithAccess } from "@/lib/authority/authority-decision-service";
import { identityAuthorityConfig } from "@/lib/config/identity-authority";
import { requirePersonalAgencyGate } from "@/lib/personal-agency/gates";

export const metadata = { title: "My people | My MapAble" };

export default async function MyPeoplePage() {
  const user = await requirePersonalAgencyGate();
  const grants = await listPeopleWithAccess(user.id).catch(() => []);

  const serializedGrants = grants.map((grant) => ({
    id: grant.id,
    domain: grant.domain,
    actions: grant.actions,
    consentScopes: grant.consentScopes,
    purpose: grant.purpose,
    recipientRole: grant.recipientRole,
    expiresAt: grant.expiresAt?.toISOString() ?? "",
    delegate: grant.delegate,
  }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">My people</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Human relationships and authority are separate. Inviting someone does not automatically
          grant access.
        </p>
      </header>

      {serializedGrants.length ? (
        <PeopleWithAccess grants={serializedGrants} />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8">
          <p className="text-lg font-semibold">No one else has access.</p>
          <p className="mt-2 text-sm text-slate-600">
            You stay in control of who can see or do things in My MapAble.
          </p>
        </div>
      )}

      {identityAuthorityConfig.delegateInvitesEnabled ? (
        <Link
          href="/participant/delegates"
          className="inline-flex min-h-11 items-center rounded-lg bg-[#005B7F] px-4 py-2 text-sm font-semibold text-white"
        >
          Invite someone
        </Link>
      ) : (
        <p className="text-sm text-slate-600">
          Delegate invites are in development. When enabled, you can invite someone from here.
        </p>
      )}
    </div>
  );
}
