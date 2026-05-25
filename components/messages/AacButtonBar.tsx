"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { AacPhrase } from "@/types/messages";

export function AacButtonBar({
  threadId,
  phrases,
  onPhraseSelect,
  insertOnly,
  compact,
}: {
  threadId?: string;
  phrases: AacPhrase[];
  onPhraseSelect?: (phrase: AacPhrase) => void;
  insertOnly?: boolean;
  compact?: boolean;
}) {
  const [status, setStatus] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);

  const grouped = phrases.reduce<Record<string, AacPhrase[]>>((acc, p) => {
    const key = p.category || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  async function sendPhrase(phrase: AacPhrase) {
    if (onPhraseSelect) {
      onPhraseSelect(phrase);
      return;
    }
    if (!threadId || insertOnly) return;

    setSendingId(phrase.id);
    setStatus("");
    try {
      const res = await fetch(`/api/messages/threads/${threadId}/aac-speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phraseId: phrase.id }),
      });
      if (!res.ok) {
        setStatus("Could not send phrase. Try again.");
        return;
      }
      setStatus(`Sent: ${phrase.label}`);
    } catch {
      setStatus("Could not send phrase. Try again.");
    } finally {
      setSendingId(null);
    }
  }

  if (!phrases.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No quick phrases yet. Add them in accessibility settings.
      </p>
    );
  }

  return (
    <section aria-label="AAC quick phrases" className={compact ? "space-y-2" : "space-y-4"}>
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          {!compact ? (
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {category.replace(/_/g, " ")}
            </h3>
          ) : null}
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={`${category.replace(/_/g, " ")} phrases`}
          >
            {items.map((phrase) => (
              <Button
                key={phrase.id}
                type="button"
                variant="outline"
                size="default"
                className="min-h-11 min-w-[4.5rem] px-4 text-base font-medium"
                disabled={sendingId === phrase.id}
                onClick={() => void sendPhrase(phrase)}
              >
                {phrase.label}
              </Button>
            ))}
          </div>
        </div>
      ))}
      {status ? (
        <p className="text-sm text-muted-foreground" role="status">
          {status}
        </p>
      ) : null}
    </section>
  );
}
