"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function InvoiceLifecycleActions({
  invoiceId,
  canIssue,
  canSend,
  canVoid,
  defaultRecipient,
}: {
  invoiceId: string;
  canIssue: boolean;
  canSend: boolean;
  canVoid: boolean;
  defaultRecipient?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!canIssue && !canSend && !canVoid) return null;

  async function post(path: string, body: Record<string, string>) {
    setBusy(true);
    setMessage(null);
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(data.error ?? "Action failed.");
      setBusy(false);
      return;
    }
    setMessage("Invoice updated.");
    setBusy(false);
    router.refresh();
  }

  return (
    <section
      aria-labelledby="invoice-lifecycle-heading"
      className="space-y-3"
    >
      <h2 id="invoice-lifecycle-heading" className="text-lg font-black text-[#0C1833]">
        Invoice actions
      </h2>
      <div className="flex flex-wrap gap-2">
        {canIssue ? (
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              void post(`/api/billing/invoices/${invoiceId}/issue`, {})
            }
          >
            Issue invoice
          </Button>
        ) : null}
        {canSend ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() =>
              void post(`/api/billing/invoices/${invoiceId}/send`, {
                channel: "email",
                recipient: defaultRecipient ?? "",
                reason: "Invoice sent",
              })
            }
          >
            Send invoice
          </Button>
        ) : null}
        {canVoid ? (
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={() => {
              const reason = window.prompt(
                "Reason for voiding this invoice (required):"
              );
              if (!reason?.trim()) return;
              void post(`/api/billing/invoices/${invoiceId}/void`, { reason });
            }}
          >
            Void invoice
          </Button>
        ) : null}
      </div>
      {message ? (
        <p role="status" className="text-sm text-slate-600">
          {message}
        </p>
      ) : null}
    </section>
  );
}
