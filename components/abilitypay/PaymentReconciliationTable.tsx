import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { formatCents } from "./utils";

const ATTEMPT_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  processing: "secondary",
  succeeded: "default",
  failed: "destructive",
  refunded: "outline",
};

export function PaymentReconciliationTable({
  attempts,
}: {
  attempts: {
    id: string;
    invoiceId: string;
    invoiceNumber: string | null;
    participantName: string | null;
    providerName: string | null;
    fundingModel: string;
    adapter: string;
    attemptStatus: string;
    paymentStatus: string;
    totalCents: number;
    externalRef: string | null;
    failureReason: string | null;
    updatedAt: string;
  }[];
}) {
  if (attempts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment attempts</CardTitle>
          <CardDescription>No payment attempts recorded yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment attempts</CardTitle>
        <CardDescription>
          Gateway execution ledger across funding adapters.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Invoice</th>
              <th className="py-2 pr-3 font-medium">Participant</th>
              <th className="py-2 pr-3 font-medium">Funding</th>
              <th className="py-2 pr-3 font-medium">Adapter</th>
              <th className="py-2 pr-3 font-medium">Attempt</th>
              <th className="py-2 pr-3 font-medium">Payment</th>
              <th className="py-2 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((row) => (
              <tr key={row.id} className="border-b border-border/50">
                <td className="py-3 pr-3">
                  <Link
                    href={`/abilitypay/invoices/${row.invoiceId}`}
                    className="font-medium hover:underline"
                  >
                    {row.invoiceNumber ?? row.invoiceId.slice(0, 8)}
                  </Link>
                  {row.failureReason ? (
                    <p className="text-xs text-destructive">{row.failureReason}</p>
                  ) : null}
                </td>
                <td className="py-3 pr-3">{row.participantName ?? "—"}</td>
                <td className="py-3 pr-3">{row.fundingModel}</td>
                <td className="py-3 pr-3">{row.adapter}</td>
                <td className="py-3 pr-3">
                  <Badge
                    variant={
                      ATTEMPT_STATUS_VARIANT[row.attemptStatus] ?? "outline"
                    }
                  >
                    {row.attemptStatus}
                  </Badge>
                </td>
                <td className="py-3 pr-3">{row.paymentStatus}</td>
                <td className="py-3">{formatCents(row.totalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
