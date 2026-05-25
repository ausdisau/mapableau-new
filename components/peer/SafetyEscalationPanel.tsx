"use client";

import { CRISIS_RESOURCES } from "@/lib/peer/crisis-resources";

import { Button } from "@/components/ui/button";

export function SafetyEscalationPanel() {
  async function escalate() {
    await fetch("/api/admin/peer/safety/escalate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "moderator_escalation",
        description: "Manual escalation from admin safety panel",
      }),
    });
  }

  return (
    <section aria-labelledby="safety-escalation-heading" className="space-y-4">
      <h2 id="safety-escalation-heading" className="text-lg font-semibold">
        Safety escalation
      </h2>
      <ul className="space-y-2 text-sm">
        {CRISIS_RESOURCES.map((r) => (
          <li key={r.name}>
            <span className="font-medium">{r.name}</span> - {r.detail}
            {"phone" in r && r.phone ? ` ?? ${r.phone}` : ""}
            {"url" in r && r.url ? (
              <>
                {" "}
                <a href={r.url} className="underline">
                  Website
                </a>
              </>
            ) : null}
          </li>
        ))}
      </ul>
      <Button type="button" variant="default" size="default" className="min-h-11" onClick={() => void escalate()}>
        Escalate to support desk
      </Button>
      <p className="text-xs text-muted-foreground">
        Human moderators review escalations. AI is not the sole decision-maker.
      </p>
    </section>
  );
}
