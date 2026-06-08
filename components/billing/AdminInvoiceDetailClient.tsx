"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BillingStatusBadge } from "@/components/billing/BillingStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type AdminInvoiceDetail = {
  id: string;
  status: string;
  adminApprovalStatus: string;
  serviceType: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  dueAt: string | null;
  disputeReason: string | null;
  disputedAt: string | null;
  anomalyFlags: unknown;
  user: { id: string; name: string | null; email: string | null };
  provider: { id: string; name: string | null } | null;
  lineItems: {
    id: string;
    description: string;
    quantity: number;
    unitAmountCents: number;
    totalCents: number;
  }[];
};

function formatAud(cents: number, currency: string) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function AdminInvoiceDetailClient({
  invoice,
}: {
  invoice: AdminInvoiceDetail;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const canApprove =
    invoice.adminApprovalStatus === "pending_approval" ||
    invoice.adminApprovalStatus === "draft";

  async function approve() {
    setBusy(true);
    setMessage(null);
    const res = await fetch(
      `/api/admin/billing/invoices/${invoice.id}/approve`,
      { method: "POST" },
    );
    const data = await res.json();
    if (res.ok) {
      setMessage("Invoice approved and issued.");
      router.refresh();
    } else {
      setMessage(data.error ?? "Approval failed");
    }
    setBusy(false);
  }

  async function dispute() {
    if (disputeReason.trim().length < 10) {
      setMessage("Dispute reason must be at least 10 characters.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const res = await fetch(
      `/api/admin/billing/invoices/${invoice.id}/dispute`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: disputeReason.trim() }),
      },
    );
    const data = await res.json();
    if (res.ok) {
      setMessage("Invoice marked as disputed.");
      setShowDisputeForm(false);
      setDisputeReason("");
      router.refresh();
    } else {
      setMessage(data.error ?? "Dispute failed");
    }
    setBusy(false);
  }

  const flags = Array.isArray(invoice.anomalyFlags)
    ? (invoice.anomalyFlags as { code?: string; message?: string }[])
    : [];

  return (
    <div className="space-y-6">
      <p>
        <Link
          href="/admin/billing"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to billing operations
        </Link>
      </p>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <BillingStatusBadge status={invoice.status} />
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">
              approval: {invoice.adminApprovalStatus.replace(/_/g, " ")}
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold capitalize">
            {invoice.serviceType} invoice
          </h1>
          <p className="text-2xl font-bold text-primary">
            {formatAud(invoice.totalCents, invoice.currency)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canApprove ? (
            <Button
              type="button"
              variant="default"
              size="lg"
              onClick={() => void approve()}
              disabled={busy}
            >
              Approve invoice
            </Button>
          ) : null}
          {invoice.adminApprovalStatus !== "disputed" ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setShowDisputeForm((v) => !v)}
              disabled={busy}
            >
              Mark disputed
            </Button>
          ) : null}
        </div>
      </header>

      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}

      {showDisputeForm ? (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Admin dispute</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <label htmlFor="dispute-reason" className="block text-sm font-medium">
              Reason
            </label>
            <textarea
              id="dispute-reason"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              rows={4}
              minLength={10}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Explain why this invoice is being disputed…"
            />
            <Button
              type="button"
              variant="destructive"
              size="lg"
              onClick={() => void dispute()}
              disabled={busy}
            >
              Submit dispute
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {invoice.disputeReason ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <h2 className="font-semibold text-destructive">Dispute</h2>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{invoice.disputeReason}</p>
            {invoice.disputedAt ? (
              <p className="mt-2 text-muted-foreground">
                Disputed {format(new Date(invoice.disputedAt), "d MMM yyyy HH:mm")}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {flags.length > 0 ? (
        <Card className="border-amber-300/50">
          <CardHeader>
            <h2 className="font-semibold">Anomaly flags</h2>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {flags.map((f, i) => (
                <li key={f.code ?? i}>{f.message ?? String(f)}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Summary</h2>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="font-medium text-muted-foreground">Participant</span>
            <p>{invoice.user.name ?? invoice.user.email ?? invoice.user.id}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Provider</span>
            <p>{invoice.provider?.name ?? "—"}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Due</span>
            <p>
              {invoice.dueAt
                ? format(new Date(invoice.dueAt), "d MMM yyyy")
                : "—"}
            </p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Created</span>
            <p>{format(new Date(invoice.createdAt), "d MMM yyyy HH:mm")}</p>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="font-semibold">Line items</h2>
        <ul className="mt-3 space-y-2">
          {invoice.lineItems.map((line) => (
            <li key={line.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{line.description}</p>
              <p className="text-muted-foreground">
                {line.quantity} × {formatAud(line.unitAmountCents, invoice.currency)} ={" "}
                {formatAud(line.totalCents, invoice.currency)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
