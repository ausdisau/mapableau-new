"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { InvoiceInbox } from "./InvoiceInbox";

type WorkbenchInvoice = Parameters<typeof InvoiceInbox>[0]["invoices"][number];

export function PlanManagerWorkbench({
  invoices,
}: {
  invoices: WorkbenchInvoice[];
}) {
  const router = useRouter();

  async function sendForApproval(invoiceId: string) {
    await fetch(`/api/abilitypay/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "awaiting_participant" }),
    });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan manager workbench</CardTitle>
        <CardDescription>
          Review invoices before sending them to participants for approval. This
          does not submit claims to NDIA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No invoices in review right now.
          </p>
        ) : (
          invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">
                  {invoice.invoiceNumber ?? "Draft"} ·{" "}
                  {invoice.provider?.legalName ?? "No provider"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {invoice.status}
                </p>
              </div>
              {invoice.status === "in_review" ? (
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  className="min-h-11"
                  onClick={() => sendForApproval(invoice.id)}
                >
                  Send to participant
                </Button>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
