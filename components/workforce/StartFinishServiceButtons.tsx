"use client";

import { useState } from "react";

export function StartFinishServiceButtons({ shiftId }: { shiftId: string }) {
  const [status, setStatus] = useState<string | null>(null);

  async function post(path: string) {
    setStatus("Working…");
    const res = await fetch(path, { method: "POST" });
    setStatus(res.ok ? "Saved." : "Something went wrong. Try again.");
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => post(`/api/workforce/shifts/${shiftId}/start`)}
        className="min-h-14 rounded-lg bg-primary text-lg font-medium text-primary-foreground"
      >
        Start service
      </button>
      <button
        type="button"
        onClick={() => post(`/api/workforce/shifts/${shiftId}/complete`)}
        className="min-h-14 rounded-lg border text-lg font-medium"
      >
        Finish service
      </button>
      {status ? (
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}
    </div>
  );
}
