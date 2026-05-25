"use client";

import { useState } from "react";

import { AccessibleComposeField } from "@/components/accessibility/AccessibleComposeField";
import { Button } from "@/components/ui/button";

export function MessageComposer({
  onSend,
}: {
  onSend: (body: string) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-2 border-t border-border pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus("");
        try {
          await onSend(body);
          setBody("");
          setStatus("Message sent.");
        } catch {
          setStatus("Could not send message. Try again.");
        }
        setLoading(false);
      }}
    >
      <AccessibleComposeField
        id="message-body"
        label="Your message"
        value={body}
        onChange={setBody}
        predictionContext="message"
        voiceDraftType="provider_message"
        rows={4}
        required={true}
      />
      <p className="text-xs text-muted-foreground">
        Only people in this conversation can see your message.
      </p>
      {status ? (
        <p role="status" className="text-sm">
          {status}
        </p>
      ) : null}
      <Button type="submit" variant="default" size="default" loading={loading}>
        Send message
      </Button>
    </form>
  );
}
