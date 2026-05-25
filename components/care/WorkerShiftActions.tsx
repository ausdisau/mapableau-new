"use client";

import { useState } from "react";

export function WorkerShiftActions({ shiftId }: { shiftId: string }) {
  const [message, setMessage] = useState<string | null>(null);

  async function post(action: "check-in" | "check-out") {
    setMessage(null);
    const res = await fetch(`/api/care/shifts/${shiftId}/${action}`, {
      method: "POST",
    });
    setMessage(res.ok ? "Updated" : "Unable to update shift");
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button className="rounded-lg bg-primary px-4 py-3 text-primary-foreground" onClick={() => post("check-in")}>
        Check in
      </button>
      <button className="rounded-lg border px-4 py-3" onClick={() => post("check-out")}>
        Check out
      </button>
      {message ? <p className="col-span-2 text-sm">{message}</p> : null}
    </div>
  );
}
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function WorkerShiftActions({ shiftId }: { shiftId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function post(action: "check-in" | "check-out") {
    setError(null);
    const response = await fetch(`/api/care/shifts/${shiftId}/${action}`, {
      method: "POST",
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Shift update failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="default" size="default" onClick={() => post("check-in")}>
          Check in
        </Button>
        <Button type="button" variant="outline" size="default" onClick={() => post("check-out")}>
          Check out
        </Button>
      </div>
    </div>
  );
}
