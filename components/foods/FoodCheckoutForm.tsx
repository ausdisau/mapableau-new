"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

import { AllergyProfileNotice } from "./AllergyProfileNotice";
import { DeliveryHandoverInstructions } from "./DeliveryHandoverInstructions";
import { DeliveryWindowSelector } from "./DeliveryWindowSelector";

export function FoodCheckoutForm({
  profileAllergens = [],
}: {
  profileAllergens?: string[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const start = fd.get("deliveryWindowStart") as string;
    const end = fd.get("deliveryWindowEnd") as string;
    const handoverNotes = fd.get("handoverNotes") as string;

    const res = await fetch("/api/foods/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliveryAddressFull: fd.get("deliveryAddressFull"),
        deliveryAddressSuburb: fd.get("deliveryAddressSuburb"),
        deliveryWindowStart: new Date(start).toISOString(),
        deliveryWindowEnd: new Date(end).toISOString(),
        handoverInstructions: handoverNotes
          ? { notes: handoverNotes }
          : undefined,
        allergenAcknowledged: fd.get("allergenAck") === "on",
        deliveryFeeAmount: 500,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Checkout failed");
      return;
    }
    router.push(`/foods/orders/${data.order.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <AllergyProfileNotice allergens={profileAllergens} />
      <div>
        <label htmlFor="deliveryAddressFull" className="text-sm font-medium">
          Delivery address
        </label>
        <input
          id="deliveryAddressFull"
          name="deliveryAddressFull"
          required
          autoComplete="street-address"
          className={formInputClass}
        />
      </div>
      <div>
        <label htmlFor="deliveryAddressSuburb" className="text-sm font-medium">
          Suburb
        </label>
        <input
          id="deliveryAddressSuburb"
          name="deliveryAddressSuburb"
          required
          className={formInputClass}
        />
      </div>
      <DeliveryWindowSelector />
      <DeliveryHandoverInstructions />
      <div className="flex items-start gap-2">
        <input id="allergenAck" name="allergenAck" type="checkbox" required className="mt-1" />
        <label htmlFor="allergenAck" className="text-sm">
          I have reviewed allergen information for items in my order and understand substitution
          policies.
        </label>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="default" size="default" loading={busy} className="min-h-11">
        Place order
      </Button>
    </form>
  );
}
