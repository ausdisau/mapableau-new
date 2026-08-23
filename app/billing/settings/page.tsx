import {
  BillingEmptyState,
  BillingPageHeader,
} from "@/components/billing/BillingPageChrome";
import { CheckoutReturnBanner } from "@/components/billing/portal/CheckoutReturnBanner";
import { ManagePaymentMethodsButton } from "@/components/billing/portal/ManagePaymentMethodsButton";
import { requireAuth } from "@/lib/auth/guards";
import { listBillingPermissions } from "@/lib/billing/permissions";
import { mapableSectionCardClass } from "@/lib/brand/styles";

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ portal?: string }>;
}) {
  const user = await requireAuth();
  const { portal } = await searchParams;
  const permissions = listBillingPermissions(user.primaryRole);

  return (
    <div className="space-y-6">
      <BillingPageHeader
        title="Billing settings"
        description="Manage payment methods and billing details in Stripe. Card numbers never touch MapAble."
      />

      <CheckoutReturnBanner checkout={portal} />

      <section
        aria-labelledby="payment-methods-heading"
        className={`${mapableSectionCardClass} space-y-4 p-5`}
      >
        <h2
          id="payment-methods-heading"
          className="text-lg font-black text-[#0C1833]"
        >
          Payment methods and billing details
        </h2>
        <p className="text-sm text-slate-600">
          Update cards, billing email, and address in the Stripe customer
          portal. You return here when you are done.
        </p>
        <div className="flex flex-wrap gap-3">
          <ManagePaymentMethodsButton flow="payment_method_update" />
          <ManagePaymentMethodsButton label="Update billing details" />
        </div>
      </section>

      <section
        aria-labelledby="access-heading"
        className={`${mapableSectionCardClass} p-5`}
      >
        <h2 id="access-heading" className="text-lg font-black text-[#0C1833]">
          Your billing permissions
        </h2>
        {permissions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            No dedicated billing permissions on this role. Access may be via
            legacy invoice permissions.
          </p>
        ) : (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {permissions.map((p) => (
              <li key={p}>
                <code className="rounded bg-white px-1.5 py-0.5 text-xs">
                  {p}
                </code>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BillingEmptyState title="Organisation defaults">
        Currency is AUD. Notification and export preferences will be editable
        here once organisation billing settings are exposed.
      </BillingEmptyState>
    </div>
  );
}
