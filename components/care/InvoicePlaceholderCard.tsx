"use client";

import { useState } from "react";

export function InvoicePlaceholderCard({ bookingId }: { bookingId: string }) {
  const [message, setMessage] = useState<string | null>(null);

  async function createPlaceholder() {
    const res = await fetch(`/api/care/bookings/${bookingId}/invoice-placeholder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setMessage(res.ok ? "Invoice placeholder created" : "Confirmed service log required");
  }

  return (
    <div className="rounded-xl border p-4">
      <h2 className="font-medium">Invoice placeholder</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Creates a billing placeholder only after a participant-confirmed service log.
      </p>
      <button className="mt-3 rounded-lg border px-4 py-3" onClick={createPlaceholder}>
        Create placeholder
      </button>
      {message ? <p className="mt-2 text-sm">{message}</p> : null}
    </div>
  );
}
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InvoicePlaceholderCard({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice placeholder</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setMessage(null);
            const form = new FormData(event.currentTarget);
            const response = await fetch(`/api/care/bookings/${bookingId}/invoice-placeholder`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                pricingPlaceholder: form.get("pricingPlaceholder") || undefined,
                ndisLineItemCodePlaceholder:
                  form.get("ndisLineItemCodePlaceholder") || undefined,
              }),
            });
            const data = await response.json();
            setMessage(response.ok ? "Placeholder created." : data.error);
            router.refresh();
          }}
        >
          <p className="text-sm text-muted-foreground">
            Pricing is a placeholder until a confirmed service log exists.
          </p>
          <input
            name="pricingPlaceholder"
            className={formInputClass}
            placeholder="Pricing placeholder"
          />
          <input
            name="ndisLineItemCodePlaceholder"
            className={formInputClass}
            placeholder="NDIS line item placeholder"
          />
          <Button type="submit" variant="outline" size="default">
            Create placeholder
          </Button>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
