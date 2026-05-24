import { requireAdmin } from "@/lib/auth/guards";
import { ensureDefaultIntegrationSetting, runAdapterHealthCheck } from "@/lib/ndis/ndis-integration-service";
import { remainingSystemsConfig } from "@/lib/config/remaining-systems";

export const metadata = { title: "NDIS integration | Admin" };

export default async function NdisIntegrationPage() {
  await requireAdmin();
  await ensureDefaultIntegrationSetting();
  const health = await runAdapterHealthCheck().catch(() => ({
    healthy: false,
    adapterType: remainingSystemsConfig.ndisAdapterType,
    message: "Health check unavailable",
  }));

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">NDIS integration</h1>
      <p className="text-sm text-muted-foreground">
        Adapter: {remainingSystemsConfig.ndisAdapterType}. Credentials are server-side only.
      </p>
      <div className="rounded-lg border p-4">
        <div className="font-medium">Sync health</div>
        <div className="text-sm">{health.message ?? (health.healthy ? "Healthy" : "Unhealthy")}</div>
      </div>
    </div>
  );
}
