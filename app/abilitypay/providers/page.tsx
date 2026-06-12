import { ProviderPaymentStatus } from "@/components/abilitypay/ProviderPaymentStatus";
import { listProviders } from "@/lib/abilitypay/provider-service";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/guards";

export default async function AbilityPayProvidersPage() {
  await requirePermission("abilitypay:read");
  const providers = await listProviders();

  const withInvoices = await Promise.all(
    providers.map(async (provider) => {
      const invoices = await prisma.abilityPayInvoice.findMany({
        where: { providerId: provider.id },
        select: { id: true, paymentStatus: true, totalCents: true },
        take: 5,
        orderBy: { updatedAt: "desc" },
      });
      return { ...provider, invoices };
    })
  );

  return (
    <div className="space-y-6 p-4">
      <header>
        <h1 className="font-heading text-2xl font-bold">Providers</h1>
        <p className="text-muted-foreground">
          See your support providers and live payment status from AbilityPay.
        </p>
      </header>
      <ProviderPaymentStatus providers={withInvoices} />
    </div>
  );
}
