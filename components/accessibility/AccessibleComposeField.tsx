"use client";

import { useEffect, useState } from "react";

import { AccessibleWordPredictionField } from "@/components/accessibility/AccessibleWordPredictionField";
import { VoiceInlineCapture } from "@/components/accessibility/VoiceInlineCapture";
import type { PredictionContext } from "@/types/word-prediction";
import type { VoiceDraftType } from "@/types/voice";
import type { DigitalPreferences } from "@/types/mapable";

export function AccessibleComposeField({
  id,
  label,
  value,
  onChange,
  predictionContext,
  voiceDraftType = "provider_message",
  rows = 4,
  placeholder,
  disabled,
  required,
  /** When omitted, loads from /api/accessibility-profile */
  wordPredictionEnabled,
  voiceControlEnabled,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  predictionContext: PredictionContext;
  voiceDraftType?: VoiceDraftType;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  wordPredictionEnabled?: boolean;
  voiceControlEnabled?: boolean;
}) {
  const [prefsLoaded, setPrefsLoaded] = useState(
    wordPredictionEnabled !== undefined && voiceControlEnabled !== undefined
  );
  const [predictionOn, setPredictionOn] = useState(wordPredictionEnabled ?? true);
  const [voiceOn, setVoiceOn] = useState(voiceControlEnabled ?? false);

  useEffect(() => {
    if (wordPredictionEnabled !== undefined && voiceControlEnabled !== undefined) {
      return;
    }
    void fetch("/api/accessibility-profile")
      .then((r) => r.json())
      .then((data) => {
        const digital = (data.profile?.digitalPreferences ?? {}) as DigitalPreferences & {
          wordPredictionEnabled?: boolean;
        };
        setPredictionOn(digital.wordPredictionEnabled !== false);
        setVoiceOn(Boolean(digital.voiceControlPreferred));
        setPrefsLoaded(true);
      })
      .catch(() => setPrefsLoaded(true));
  }, [voiceControlEnabled, wordPredictionEnabled]);

  function appendTranscript(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    onChange(value ? `${value.trimEnd()}\n${trimmed}` : trimmed);
  }

  if (!prefsLoaded) {
    return (
      <AccessibleWordPredictionField
        id={id}
        label={label}
        value={value}
        onChange={onChange}
        context={predictionContext}
        enabled={false}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      />
    );
  }

  return (
    <div className="space-y-3">
      <AccessibleWordPredictionField
        id={id}
        label={label}
        value={value}
        onChange={onChange}
        context={predictionContext}
        enabled={predictionOn}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      />
      <VoiceInlineCapture
        enabled={voiceOn}
        draftType={voiceDraftType}
        disabled={disabled}
        onTranscript={appendTranscript}
      />
    </div>
  );
}
