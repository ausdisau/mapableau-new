import Link from "next/link";

import { DelegateConsentInfo } from "@/components/engagement/DelegateConsentInfo";
import { requireAuth } from "@/lib/auth/guards";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { listConsentsForParticipant } from "@/lib/consent/consent-service";
import { fieldCategoriesForConsentScope } from "@/lib/passport/disclosure-policy";
import type { ConsentScope } from "@/types/mapable";

import { DownloadConsentAuditButton } from "./DownloadConsentAuditButton";
import { RevokeConsentButton } from "./RevokeConsentButton";

function recipientLabel(consent: {
  grantedToOrganisation: { name: string } | null;
  grantedToUser: { name: string | null } | null;
  recipientType: string | null;
}) {
  if (consent.grantedToOrganisation?.name) {
    return consent.grantedToOrganisation.name;
  }
  if (consent.grantedToUser?.name) {
    return consent.grantedToUser.name;
  }
  if (consent.recipientType) {
    return consent.recipientType.replace(/_/g, " ");
  }
  return "Not specified — no ambient supporter access";
}

function fieldsLabel(consent: {
  scope: ConsentScope;
  dataScope: unknown;
}) {
  if (Array.isArray(consent.dataScope) && consent.dataScope.length > 0) {
    return consent.dataScope
      .map((f) => String(f).replace(/[._]/g, " "))
      .join(", ");
  }
  return fieldCategoriesForConsentScope(consent.scope)
    .map((f) => f.replace(/_/g, " "))
    .join(", ");
}

export default async function ConsentCenterPage() {
  const user = await requireAuth();
  const consents = await listConsentsForParticipant(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <header>
        <h1 className="font-heading text-2xl font-bold">Consent centre</h1>
        <p className="mt-2 text-muted-foreground">
          Purpose-bound grants only. You choose the recipient and fields. You
          can revoke access at any time — there is no ambient supporter access.
        </p>
      </header>

      <DownloadConsentAuditButton />

      {isEngagementPlatformEnabled() ? <DelegateConsentInfo /> : null}

      <p className="text-sm">
        <Link
          href="/dashboard/access-history"
          className="inline-flex min-h-11 items-center underline underline-offset-2"
        >
          View access history and evidence receipts
        </Link>
      </p>

      {consents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No consent grants yet. When you share information for a booking or
          coordination task, the purpose, recipient, and fields will appear
          here.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border" aria-label="Consent grants">
          {consents.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="space-y-1">
                <p className="font-medium">
                  <Link
                    href={`/dashboard/consent/${c.id}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {c.sourceAction ?? c.scopeLabel}
                  </Link>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Purpose: </span>
                  {c.purpose}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Recipient: </span>
                  {recipientLabel(c)}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Fields: </span>
                  {fieldsLabel(c)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: {c.status}
                  {c.shareMode ? ` · ${c.shareMode.replace(/_/g, " ")}` : ""}
                  {c.expiryDate
                    ? ` · expires ${c.expiryDate.toLocaleDateString("en-AU")}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/consent/${c.id}`}
                  className="inline-flex min-h-11 items-center rounded-md border px-4 text-sm"
                >
                  Details
                </Link>
                {c.status === "active" ? (
                  <RevokeConsentButton consentId={c.id} />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Revoking consent stops future sharing. Past actions already taken may
        remain in audit logs and access history for accountability.
      </p>
    </div>
  );
}
