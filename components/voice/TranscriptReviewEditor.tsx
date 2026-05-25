"use client";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { VoiceConfidenceNotice } from "@/components/voice/VoiceConfidenceNotice";

export function TranscriptReviewEditor({
  value,
  onChange,
  confidence,
  label = "Edit transcript before confirming",
}: {
  value: string;
  onChange: (value: string) => void;
  confidence?: number | null;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor="voice-transcript-editor" className="block text-sm font-medium">
        {label}
      </label>
      <VoiceConfidenceNotice confidence={confidence} />
      <textarea
        id="voice-transcript-editor"
        className={`${formInputClass} min-h-[120px]`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby="voice-transcript-hint"
      />
      <p id="voice-transcript-hint" className="text-sm text-muted-foreground">
        You can also paste text from another app (AAC) into this box.
      </p>
    </div>
  );
}
