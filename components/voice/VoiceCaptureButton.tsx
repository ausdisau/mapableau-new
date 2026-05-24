"use client";

import { Button } from "@/components/ui/button";

export function VoiceCaptureButton({
  isRecording,
  disabled,
  onStart,
  onStop,
}: {
  isRecording: boolean;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        type="button"
        variant={isRecording ? "destructive" : "default"}
        size="default"
        className="min-h-14 min-w-14 rounded-full px-8 text-base"
        disabled={disabled}
        aria-pressed={isRecording}
        aria-label={isRecording ? "Stop recording" : "Start voice recording"}
        onClick={isRecording ? onStop : onStart}
      >
        <span aria-hidden="true">{isRecording ? "■" : "●"}</span>
        <span className="ml-2">{isRecording ? "Stop" : "Record"}</span>
      </Button>
      <span className="text-sm text-muted-foreground" id="voice-record-state">
        {isRecording ? "Recording… speak clearly" : "Press to record"}
      </span>
    </div>
  );
}
