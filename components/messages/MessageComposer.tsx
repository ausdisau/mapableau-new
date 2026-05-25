"use client";

import { useState } from "react";

import { AacButtonBar } from "@/components/messages/AacButtonBar";
import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import type { AacPhrase } from "@/types/messages";

export function MessageComposer({
  onSend,
  onTyping,
  attachmentDocumentIds,
  onAttachmentsChange,
  showAacBar,
  aacPhrases = [],
  aacSendImmediately,
  threadId,
}: {
  onSend: (body: string, attachmentIds?: string[]) => Promise<void>;
  onTyping?: () => void;
  attachmentDocumentIds?: string[];
  onAttachmentsChange?: (ids: string[]) => void;
  showAacBar?: boolean;
  aacPhrases?: AacPhrase[];
  aacSendImmediately?: boolean;
  threadId?: string;
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
          await onSend(body, attachmentDocumentIds);
          setBody("");
          setStatus("Message sent.");
        } catch {
          setStatus("Could not send message. Try again.");
        }
        setLoading(false);
      }}
    >
      {showAacBar && aacPhrases.length ? (
        <div className="pb-2">
          <AacButtonBar
            threadId={threadId}
            phrases={aacPhrases}
            compact
            insertOnly={!aacSendImmediately}
            onPhraseSelect={
              aacSendImmediately
                ? undefined
                : (p) => {
                    setBody(p.phrase);
                    onTyping?.();
                  }
            }
          />
        </div>
      ) : null}
      <label htmlFor="message-body" className="font-medium text-sm">
        Your message
      </label>
      <textarea
        id="message-body"
        className={formInputClass}
        rows={4}
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          onTyping?.();
        }}
        required
        maxLength={10000}
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
