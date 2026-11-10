import { ProviderCenterHome } from "@/components/provider/ProviderCenterHome";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { isBusinessHostRequest } from "@/lib/provider/business-request";
import { getEnterpriseWorkspaceSummaryV2 } from "@/lib/provider/enterprise/workspace-v2-service";
import { getProviderControlPanelSummaryForUser } from "@/lib/provider/provider-control-panel-service";

export async function generateMetadata() {
  const onBusinessHost = await isBusinessHostRequest();
  return {
    title: onBusinessHost
      ? "Provider Center | MapAble"
      : "Provider control panel | MapAble",
  };
}

export default async function ProviderControlPanelPage() {
  const user = await requireAuth();
  await requirePermission("care:read:org");
  const onBusinessHost = await isBusinessHostRequest();

  const panelSummary = await getProviderControlPanelSummaryForUser(user);
  const primary = panelSummary.primaryOrganisation;

  const enterprise =
    hasPermission(user.primaryRole, "enterprise:console") &&
    primary?.organisationId
      ? await getEnterpriseWorkspaceSummaryV2(primary.organisationId, user)
      : null;

  return (
    <ProviderCenterHome
      primaryRole={user.primaryRole}
      primary={primary}
      enterprise={
        enterprise && "openRecoveries" in enterprise ? enterprise : null
      }
      onBusinessHost={onBusinessHost}
    />
  );
}
