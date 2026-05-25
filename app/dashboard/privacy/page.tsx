import Link from "next/link";

import { HIPAA_DISCLAIMER } from "@/lib/compliance/security-risk-review-service";
import { requireAuth } from "@/lib/auth/guards";
import { getPrivacyConsentsForUser } from "@/lib/privacy/privacy-consent-service";
import { listVendorComplianceRecords } from "@/lib/privacy/vendor-compliance-service";

export const metadata = { title: "Privacy & consent | MapAble" };

export default async function DashboardPrivacyPage() {
  const user = await requireAuth();
  const consents = await getPrivacyConsentsForUser(user.id);
  const vendors = await listVendorComplianceRecords();

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Privacy and consent</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage how MapAble uses your information under the Australian Privacy
          Principles (APP).
        </p>
      </header>

      <section aria-labelledby="consents-heading">
        <h2 id="consents-heading" className="text-lg font-semibold">
          Your consents
        </h2>
        {consents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active consent records.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {consents.map((c) => (
              <li key={c.id} className="rounded-md border border-border p-3">
                <span className="font-medium">{c.grantType}</span> — {c.purpose}
                <span className="block text-xs text-muted-foreground">
                  Granted {c.grantedAt.toLocaleDateString("en-AU")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="vendors-heading">
        <h2 id="vendors-heading" className="text-lg font-semibold">
          Service providers
        </h2>
        <ul className="mt-2 space-y-2 text-sm">
          {vendors.map((v) => (
            <li key={v.id} className="rounded-md border border-border p-3">
              <span className="font-medium">
                {v.vendorName} — {v.serviceName}
              </span>
              {v.baaRequired && (
                <span className="block text-xs">
                  BAA required: {v.baaSigned ? "signed" : "pending review"}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-muted-foreground">{HIPAA_DISCLAIMER}</p>

      <Link href="/dashboard" className="text-sm underline">
        Back to dashboard
      </Link>
    </div>
  );
}
