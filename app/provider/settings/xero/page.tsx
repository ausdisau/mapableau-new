import { XeroConnectionPanel } from "@/components/xero/XeroConnectionPanel";
import { Badge } from "@/components/ui/badge";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requirePermission } from "@/lib/auth/guards";
import { mapableEyebrowBadgeClass, mapablePageContainerClass } from "@/lib/brand/styles";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Xero settings | MapAble Provider",
};

export default async function ProviderXeroSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const user = await requirePermission("xero:manage");
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  const params = await searchParams;

  if (!organisationId) {
    return (
      <div className={mapablePageContainerClass}>
        <p className="py-8 text-muted-foreground">
          Link your account to a provider organisation to connect Xero.
        </p>
      </div>
    );
  }

  const connection = await prisma.xeroConnection.findUnique({
    where: { organisationId },
  });

  return (
    <div className={mapablePageContainerClass}>
      <div className="mx-auto max-w-lg py-8">
        <Badge variant="outline" className={mapableEyebrowBadgeClass}>
          Provider settings
        </Badge>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
          Xero <span className="text-primary">connection</span>
        </h1>
        {params.connected ? (
          <p className="mt-3 text-sm text-green-700 dark:text-green-400" role="status">
            Xero connected successfully.
          </p>
        ) : null}
        {params.error ? (
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-300" role="alert">
            Connection failed. Check your Xero app credentials and try again.
          </p>
        ) : null}
        <div className="mt-10">
          <XeroConnectionPanel
            organisationId={organisationId}
            connected={connection?.status === "active"}
            tenantName={connection?.tenantName}
          />
        </div>
      </div>
    </div>
  );
}
