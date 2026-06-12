import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ManagePaymentMethodsButton } from "./ManagePaymentMethodsButton";

export function PaymentMethodsPanel({
  showPortal,
  fundingLabel,
}: {
  showPortal: boolean;
  fundingLabel: string;
}) {
  if (!showPortal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment methods</CardTitle>
          <CardDescription>
            Saved cards are available for self-managed and private-pay plans.
            Your active plan uses {fundingLabel.toLowerCase()}.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment methods</CardTitle>
        <CardDescription>
          Add, update, or remove saved cards in Stripe&apos;s secure billing
          portal. Cards saved here can be reused when you pay AbilityPay
          invoices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ManagePaymentMethodsButton returnPath="/abilitypay/payment-methods" />
        <p className="text-sm text-muted-foreground">
          You will be redirected to Stripe to manage your payment methods. No
          card details are stored on MapAble.
        </p>
      </CardContent>
    </Card>
  );
}
