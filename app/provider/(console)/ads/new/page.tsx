import Link from "next/link";

import { AdManagerPreRegisterForm } from "@/components/ads/manager/AdManagerPreRegisterForm";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { getProviderControlPanelSummaryForUser } from "@/lib/provider/provider-control-panel-service";

export const metadata = { title: "Pre-register advertiser | MapAble" };

export default async function ProviderAdsNewPage() {
  const user = await requireAuth();
  await requirePermission("care:manage:org");

  if (!adsFlagsConfig.isManagerEnabled()) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Ad Manager</h1>
        <p className="text-muted-foreground">Ad Manager is disabled.</p>
      </div>
    );
  }

  const summary = await getProviderControlPanelSummaryForUser(user);
  const org = summary.primaryOrganisation;
  if (!org) {
    return (
      <div className="space-y-4">
        <p>Organisation required.</p>
        <Link href="/provider/ads" className="underline">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/provider/ads" className="text-sm text-primary underline">
        ← Ad Manager
      </Link>
      <h1 className="font-heading text-2xl font-bold">
        Pre-register advertiser
      </h1>
      <AdManagerPreRegisterForm
        organisationId={org.organisationId}
        organisationName={org.organisationName}
      />
    </div>
  );
}
