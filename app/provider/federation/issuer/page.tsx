import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ProviderFederationIssuerPage() {
  await requirePermission("provider:federation:read");
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Issuer</h1>
      <p className="text-sm">
        This surface is a lean shell for Wave 9. Actions here are simulator
        only until federation is activated by the operator.
      </p>
    </div>
  );
}
