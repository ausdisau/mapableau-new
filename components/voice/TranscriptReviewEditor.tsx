"use client";

import { AccessibleWordPredictionField } from "@/components/accessibility/AccessibleWordPredictionField";
import { VoiceConfidenceNotice } from "@/components/voice/VoiceConfidenceNotice";

export function TranscriptReviewEditor({
  value,
  onChange,
  confidence,
  label = "Edit transcript before confirming",
  wordPredictionEnabled = true,
}: {
  value: string;
  onChange: (value: string) => void;
  confidence?: number | null;
  label?: string;
  wordPredictionEnabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <VoiceConfidenceNotice confidence={confidence} />
      <AccessibleWordPredictionField
        id="voice-transcript-editor"
        label={label}
        value={value}
        onChange={onChange}
        context="general"
        enabled={wordPredictionEnabled}
        rows={5}
        describedBy="voice-transcript-hint"
      />
      <p id="voice-transcript-hint" className="text-sm text-muted-foreground">
        You can also paste text from another app (AAC) into this box.
      </p>
    </div>
  );
}
