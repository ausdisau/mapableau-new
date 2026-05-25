"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";

export function DeliveryWindowSelector() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = tomorrow.toISOString().slice(0, 10);
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="block text-sm font-medium">
        Date
        <input name="deliveryDate" type="date" defaultValue={date} className={formInputClass} required />
      </label>
      <label className="block text-sm font-medium">
        Start
        <input name="startTime" type="time" defaultValue="10:00" className={formInputClass} required />
      </label>
      <label className="block text-sm font-medium">
        End
        <input name="endTime" type="time" defaultValue="12:00" className={formInputClass} required />
      </label>
    </div>
  );
}

export function DeliveryHandoverInstructions() {
  return (
    <fieldset className="space-y-3 rounded-xl border p-4">
      <legend className="px-1 font-semibold">Handover instructions</legend>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="leaveAtDoor" className="h-5 w-5" />
        Leave at door if safe
      </label>
      <label className="block text-sm font-medium">
        Notes for driver
        <textarea name="handoverNotes" className={`${formInputClass} min-h-20`} />
      </label>
    </fieldset>
  );
}

export function FoodCheckoutForm({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(event.currentTarget);
    const deliveryDate = String(fd.get("deliveryDate"));
    const start = new Date(`${deliveryDate}T${String(fd.get("startTime"))}`).toISOString();
    const end = new Date(`${deliveryDate}T${String(fd.get("endTime"))}`).toISOString();
    const res = await fetch("/api/foods/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorId,
        deliveryAddressFull: fd.get("deliveryAddressFull"),
        deliveryAddressSuburb: fd.get("deliveryAddressSuburb") || undefined,
        deliveryAddressState: fd.get("deliveryAddressState") || undefined,
        deliveryAddressPostcode: fd.get("deliveryAddressPostcode") || undefined,
        deliveryInstructions: fd.get("deliveryInstructions") || undefined,
        deliveryWindowStart: start,
        deliveryWindowEnd: end,
        substitutionPolicy: fd.get("substitutionPolicy"),
        allergenAcknowledged: fd.get("allergenAcknowledged") === "on",
        handoverInstructions: {
          leaveAtDoor: fd.get("leaveAtDoor") === "on",
          notes: fd.get("handoverNotes") || undefined,
        },
      }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Checkout failed");
      return;
    }
    router.push(`/foods/orders/${data.orderId}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      {error ? <p role="alert" className="rounded-lg border border-destructive p-3">{error}</p> : null}
      <label className="block text-sm font-medium">
        Delivery address
        <input name="deliveryAddressFull" className={formInputClass} required />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <input name="deliveryAddressSuburb" placeholder="Suburb" className={formInputClass} />
        <input name="deliveryAddressState" placeholder="State" className={formInputClass} />
        <input name="deliveryAddressPostcode" placeholder="Postcode" className={formInputClass} />
      </div>
      <label className="block text-sm font-medium">
        Delivery instructions
        <textarea name="deliveryInstructions" className={`${formInputClass} min-h-20`} />
      </label>
      <DeliveryWindowSelector />
      <label className="block text-sm font-medium">
        Substitution policy
        <select name="substitutionPolicy" defaultValue="contact_me" className={formInputClass}>
          <option value="no_substitutions">No substitutions</option>
          <option value="contact_me">Contact me first</option>
          <option value="closest_match">Closest safe match</option>
          <option value="provider_choice">Provider choice</option>
        </select>
      </label>
      <DeliveryHandoverInstructions />
      <label className="flex min-h-11 items-start gap-2 text-sm">
        <input name="allergenAcknowledged" type="checkbox" className="mt-1 h-5 w-5" required />
        I have reviewed allergy and dietary information for this order.
      </label>
      <button disabled={loading} className="min-h-11 rounded-lg bg-orange-600 px-6 font-semibold text-white">
        {loading ? "Checking out..." : "Checkout"}
      </button>
    </form>
  );
}
