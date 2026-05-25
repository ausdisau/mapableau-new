"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { VoiceCaptureButton } from "@/components/voice/VoiceCaptureButton";
import type { VoiceDraftType } from "@/types/voice";

type Phase = "idle" | "recording" | "transcribing" | "error";

export function VoiceInlineCapture({
  onTranscript,
  draftType = "provider_message",
  enabled = true,
  disabled,
}: {
  onTranscript: (text: string) => void;
  draftType?: VoiceDraftType;
  enabled?: boolean;
  disabled?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [liveMessage, setLiveMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const announce = useCallback((msg: string) => setLiveMessage(msg), []);

  useEffect(() => {
    if (!liveMessage) return;
    const t = setTimeout(() => setLiveMessage(""), 6000);
    return () => clearTimeout(t);
  }, [liveMessage]);

  if (!enabled) return null;

  async function ensureSession() {
    if (sessionId) return sessionId;
    const res = await fetch("/api/voice/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intendedDraftType: draftType }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Could not start voice session");
    setSessionId(data.session.id);
    return data.session.id as string;
  }

  async function startRecording() {
    try {
      const sid = await ensureSession();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await uploadAudio(sid);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setPhase("recording");
      announce("Recording started");
    } catch (e) {
      setPhase("error");
      announce(
        e instanceof Error
          ? e.message
          : "Microphone unavailable. Type or paste your message instead."
      );
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setPhase("transcribing");
    announce("Transcribing");
  }

  async function uploadAudio(sid: string) {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const form = new FormData();
    form.append("sessionId", sid);
    form.append("audio", blob, "recording.webm");
    const res = await fetch("/api/voice/transcribe", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) {
      setPhase("error");
      announce(data.error ?? "Transcription failed");
      return;
    }
    const text =
      data.transcript.editedTranscript ?? data.transcript.rawTranscript ?? "";
    onTranscript(text);
    setPhase("idle");
    announce("Transcript added — review before sending");
  }

  return (
    <div className="space-y-2">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>
      <VoiceCaptureButton
        isRecording={phase === "recording"}
        disabled={disabled || phase === "transcribing"}
        onStart={() => void startRecording()}
        onStop={stopRecording}
      />
      {phase === "transcribing" ? (
        <p className="text-sm text-muted-foreground" role="status">
          Transcribing…
        </p>
      ) : null}
      {phase === "error" ? (
        <p className="text-sm text-amber-800 dark:text-amber-200" role="alert">
          {liveMessage}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Voice fills the text box only. Nothing is sent until you submit.
      </p>
    </div>
  );
}
