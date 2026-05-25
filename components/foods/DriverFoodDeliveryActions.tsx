"use client";

import { useRouter } from "next/navigation";

export function DriverFoodDeliveryScreen({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  async function update(status: string) {
    await fetch(`/api/driver/food-deliveries/${assignmentId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {["picked_up", "out_for_delivery", "arrived", "delivered"].map((status) => (
        <button key={status} onClick={() => update(status)} className="min-h-11 rounded-lg border px-4">
          {status.replace(/_/g, " ")}
        </button>
      ))}
    </div>
  );
}

export function DeliveryHandoverChecklist({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  async function record() {
    await fetch(`/api/driver/food-deliveries/${assignmentId}/handover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist: { deliveredToPerson: true } }),
    });
    router.refresh();
  }
  return (
    <button onClick={record} className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground">
      Record handover
    </button>
  );
}
