"use client";

import { Button } from "@/components/ui/button";

export function FoodDisputeForm({ orderId }: { orderId: string }) {
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await fetch(`/api/foods/orders/${orderId}/dispute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: fd.get("reason") }),
        });
      }}
    >
      <h2 className="text-lg font-semibold">Dispute order</h2>
      <label htmlFor="reason" className="text-sm font-medium">
        Reason
      </label>
      <textarea id="reason" name="reason" required rows={4} className="w-full rounded border p-2" />
      <Button type="submit" variant="outline" size="default">
        Submit dispute
      </Button>
    </form>
  );
}
