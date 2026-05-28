import { WixConnectionPanel } from "@/components/identity/WixConnectionPanel";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminWixPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Wix identity</h1>
      <p className="text-sm text-muted-foreground">
        <a href="/admin/identity/keycloak" className="underline">
          Keycloak bridge
        </a>
      </p>
      <WixConnectionPanel />
      <p className="text-sm text-muted-foreground">
        Setup steps are documented in docs/wix-authentication-bridge.md in the
        repository.
      </p>
    </div>
  );
}
