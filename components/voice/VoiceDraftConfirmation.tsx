"use client";

import { Button } from "@/components/ui/button";

export function VoiceDraftConfirmation({
  draftType,
  payload,
  loading,
  onCreateDraft,
  onDiscard,
}: {
  draftType: string;
  payload: Record<string, unknown> | null;
  loading?: boolean;
  onCreateDraft: () => void;
  onDiscard: () => void;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border p-4" aria-labelledby="voice-draft-confirm">
      <h3 id="voice-draft-confirm" className="font-semibold">
        Create draft ({draftType.replace(/_/g, " ")})
      </h3>
      <p className="text-sm text-muted-foreground">
        This saves a draft you can copy into a form. Nothing is submitted until you confirm in the booking or message screen.
      </p>
      {payload ? (
        <pre className="max-h-40 overflow-auto rounded bg-muted p-3 text-xs">
          {JSON.stringify(payload, null, 2)}
        </pre>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="default"
          size="default"
          loading={loading}
          onClick={onCreateDraft}
        >
          Create draft
        </Button>
        <Button type="button" variant="outline" size="default" onClick={onDiscard}>
          Discard
        </Button>
      </div>
    </section>
  );
}
