import { PaymentMethodsPanel } from "@/components/abilitypay/PaymentMethodsPanel";
import {
  fundingModelLabel,
  resolveFundingModel,
  supportsStripeSavedPaymentMethods,
} from "@/lib/abilitypay/funding-model";
import { listPlansForUser } from "@/lib/abilitypay/plan-service";
import { requirePermission } from "@/lib/auth/guards";

export default async function AbilityPayPaymentMethodsPage() {
  const user = await requirePermission("abilitypay:read");
  const plans = await listPlansForUser(user.id, user.primaryRole);
  const plan = plans.find((p) => p.status === "active") ?? plans[0];

  const model = resolveFundingModel({
    planFundingModel: plan?.fundingModel,
  });
  const showPortal = supportsStripeSavedPaymentMethods(model);

  return (
    <div className="space-y-6 p-4">
      <header>
        <h1 className="font-heading text-2xl font-bold">Payment methods</h1>
        <p className="text-muted-foreground">
          Manage saved cards for AbilityPay invoice payments.
        </p>
      </header>
      <PaymentMethodsPanel
        showPortal={showPortal}
        fundingLabel={fundingModelLabel(model)}
      />
    </div>
  );
}
