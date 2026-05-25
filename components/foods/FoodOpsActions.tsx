"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProviderFoodOrderActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(status: string) {
    setLoading(true);
    await fetch(`/api/provider/foods/orders/${orderId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Food order actions">
      {["confirmed", "preparing", "packed"].map((status) => (
        <button
          key={status}
          type="button"
          disabled={loading}
          onClick={() => setStatus(status)}
          className="min-h-11 rounded-lg border px-4"
        >
          {status.replace(/_/g, " ")}
        </button>
      ))}
    </div>
  );
}

export function FoodDeliveryAssignmentPanel({ orderId }: { orderId: string }) {
  const router = useRouter();
  async function assign() {
    await fetch(`/api/provider/foods/orders/${orderId}/assign-delivery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverDisplayName: "Assigned driver" }),
    });
    router.refresh();
  }
  return (
    <button type="button" onClick={assign} className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground">
      Assign delivery
    </button>
  );
}

export function FoodDisputeForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  async function resolve() {
    await fetch(`/api/admin/foods/orders/${orderId}/resolve-dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolution: "Resolved from admin console" }),
    });
    router.refresh();
  }
  return (
    <button type="button" onClick={resolve} className="min-h-11 rounded-lg border px-4">
      Resolve dispute
    </button>
  );
}

export function FoodSafetyIssueReport({ orderId }: { orderId: string }) {
  return (
    <form action={`/api/foods/orders/${orderId}/report-issue`} method="post" className="rounded-xl border p-4">
      <p className="font-medium">Report food safety issue</p>
      <p className="text-sm text-muted-foreground">
        Use the API endpoint to create a safety event or dispute.
      </p>
    </form>
  );
}
