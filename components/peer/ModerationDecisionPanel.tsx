"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ModerationDecisionPanel({ queueId }: { queueId: string }) {
  const [decision, setDecision] = useState("approve");

  async function apply() {
    await fetch(`/api/admin/peer/moderation/${queueId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    window.location.reload();
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <label htmlFor={`decision-${queueId}`} className="sr-only">
        Moderation decision
      </label>
      <select
        id={`decision-${queueId}`}
        className="min-h-11 rounded-md border px-3"
        value={decision}
        onChange={(e) => setDecision(e.target.value)}
      >
        <option value="approve">Approve</option>
        <option value="hide">Hide</option>
        <option value="request_edit">Request edit</option>
        <option value="warn_user">Warn user</option>
        <option value="pause_account">Pause account</option>
        <option value="escalate_safeguarding">Escalate safeguarding</option>
      </select>
      <Button type="button" variant="default" size="default" className="min-h-11" onClick={() => void apply()}>
        Apply
      </Button>
    </div>
  );
}
