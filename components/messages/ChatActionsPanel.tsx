"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { MessageReportDialog } from "@/components/messages/MessageReportDialog";

export function ChatActionsPanel({
  threadId,
  otherProfileId,
  canEscalateSafety,
}: {
  threadId: string;
  otherProfileId?: string;
  canEscalateSafety?: boolean;
}) {
  const [showReport, setShowReport] = useState(false);
  const [status, setStatus] = useState("");

  async function post(path: string, body?: object) {
    setStatus("");
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus((data as { error?: string }).error ?? "Action could not be completed.");
      return;
    }
    setStatus("Saved.");
  }

  return (
    <section aria-label="Chat actions" className="space-y-3 border-t border-border pt-4">
      <h3 className="text-sm font-semibold">Actions</h3>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="default"
          className="min-h-11 justify-start"
          onClick={() => post(`/api/messages/threads/${threadId}/mute`)}
        >
          Mute notifications
        </Button>
        {otherProfileId ? (
          <Button
            type="button"
            variant="outline"
            size="default"
            className="min-h-11 justify-start"
            onClick={() =>
              post("/api/messages/block-user", { blockedProfileId: otherProfileId })
            }
          >
            Block user
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="default"
          className="min-h-11 justify-start"
          onClick={() => setShowReport(true)}
        >
          Report
        </Button>
        <Button
          type="button"
          variant="outline"
          size="default"
          className="min-h-11 justify-start"
          onClick={() =>
            post(`/api/messages/threads/${threadId}/escalate/support-ticket`, {
              title: "Help from message thread",
            })
          }
        >
          Escalate to support desk
        </Button>
        {canEscalateSafety ? (
          <Button
            type="button"
            variant="destructive"
            size="default"
            className="min-h-11 justify-start"
            onClick={() =>
              post(`/api/messages/threads/${threadId}/escalate/incident`, {
                description: "Safety concern raised from Communication Centre.",
              })
            }
          >
            Safety escalation
          </Button>
        ) : null}
      </div>
      {status ? (
        <p role="status" className="text-sm text-muted-foreground">
          {status}
        </p>
      ) : null}
      {showReport ? (
        <MessageReportDialog threadId={threadId} onClose={() => setShowReport(false)} />
      ) : null}
    </section>
  );
}
