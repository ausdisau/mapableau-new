import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PAYMENT_LABELS: Record<string, string> = {
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  ready_to_pay: "Ready to pay",
  paid_mock: "Paid (mock)",
  on_hold: "On hold",
};

export function ProviderPaymentStatus({
  providers,
}: {
  providers: {
    id: string;
    legalName: string;
    abn: string | null;
    invoices?: { id: string; paymentStatus: string; totalCents: number }[];
  }[];
}) {
  return (
    <div className="space-y-4">
      {providers.map((provider) => (
        <Card key={provider.id}>
          <CardHeader>
            <CardTitle className="text-base">{provider.legalName}</CardTitle>
            <CardDescription>
              {provider.abn ? `ABN ${provider.abn}` : "No ABN on file"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {provider.invoices && provider.invoices.length > 0 ? (
              <ul className="space-y-2">
                {provider.invoices.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <span>Invoice {inv.id.slice(0, 8)}…</span>
                    <Badge variant="outline">
                      {PAYMENT_LABELS[inv.paymentStatus] ?? inv.paymentStatus}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No invoices linked to this provider yet.
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
