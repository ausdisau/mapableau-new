"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function DeliveryHandoverChecklist({ deliveryId }: { deliveryId: string }) {
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch(`/api/driver/food-deliveries/${deliveryId}/handover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checklist: {
          idVerified: fd.get("idVerified") === "on",
          itemsComplete: fd.get("itemsComplete") === "on",
          temperatureOk: fd.get("temperatureOk") === "on",
        },
        notes: fd.get("notes"),
      }),
    });
    router.push(`/driver/food-deliveries/${deliveryId}`);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Handover checklist</h1>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="idVerified" /> Recipient identity confirmed
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="itemsComplete" /> All items delivered
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="temperatureOk" /> Temperature acceptable
      </label>
      <label htmlFor="notes" className="text-sm font-medium">
        Notes
      </label>
      <textarea id="notes" name="notes" rows={3} className="w-full rounded border p-2" />
      <Button type="submit" variant="default" size="default">
        Complete handover
      </Button>
    </form>
  );
}
