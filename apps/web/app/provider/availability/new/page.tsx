"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default function NewAvailabilityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const fd = new FormData(e.currentTarget);
        await fetch("/api/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organisationId: fd.get("organisationId"),
            dayOfWeek: fd.get("dayOfWeek"),
            startTime: fd.get("startTime"),
            endTime: fd.get("endTime"),
          }),
        });
        setLoading(false);
        router.push("/provider/availability");
      }}
    >
      <h1 className="font-heading text-2xl font-bold">New availability window</h1>
      <label htmlFor="organisationId" className="text-sm font-medium">Organisation ID</label>
      <input id="organisationId" name="organisationId" className={formInputClass} required />
      <label htmlFor="dayOfWeek" className="text-sm font-medium">Day</label>
      <select id="dayOfWeek" name="dayOfWeek" className={formInputClass}>
        {DAYS.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <label htmlFor="startTime" className="text-sm font-medium">Start</label>
      <input id="startTime" name="startTime" type="time" className={formInputClass} required />
      <label htmlFor="endTime" className="text-sm font-medium">End</label>
      <input id="endTime" name="endTime" type="time" className={formInputClass} required />
      <Button type="submit" variant="default" size="default" loading={loading}>Save</Button>
    </form>
  );
}
