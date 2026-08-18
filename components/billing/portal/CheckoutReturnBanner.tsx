"use client";

import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";

export function CheckoutReturnBanner({
  checkout,
}: {
  checkout?: string | null;
}) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (checkout === "success") {
      setMessage(
        "Payment submitted. Your invoice will show as paid once Stripe confirms the payment."
      );
      return;
    }
    if (checkout === "cancelled") {
      setMessage("Checkout was cancelled. You can try again when ready.");
      return;
    }
    if (checkout === "returned") {
      setMessage("Returned from Stripe billing portal.");
    }
  }, [checkout]);

  if (!message) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4 text-sm" role="status" aria-live="polite">
        {message}
      </CardContent>
    </Card>
  );
}
