"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CreateInvoiceButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    const res = await fetch(`/api/invoices/from-booking/${bookingId}`, {
      method: "POST",
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      window.location.href = `/provider/invoices/${data.invoice.id}`;
    }
  }

  return (
    <Button type="button" variant="default" size="default" onClick={create} disabled={loading}>
      {loading ? "Creating…" : "Create invoice from booking"}
    </Button>
  );
}
