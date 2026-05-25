"use client";

import { Button } from "@/components/ui/button";

export function FoodSafetyIssueReport({ orderId }: { orderId?: string }) {
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const url = orderId
          ? `/api/foods/orders/${orderId}/report-issue`
          : "/api/foods/report-issue";
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: fd.get("description"),
            severity: fd.get("severity"),
          }),
        });
      }}
    >
      <h2 className="text-lg font-semibold">Report a food safety issue</h2>
      <textarea
        name="description"
        required
        rows={4}
        className="w-full rounded border p-2"
        placeholder="Describe the issue in plain language"
      />
      <select name="severity" className="w-full rounded border p-2" defaultValue="medium">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
      <Button type="submit" variant="default" size="default">
        Submit report
      </Button>
    </form>
  );
}
