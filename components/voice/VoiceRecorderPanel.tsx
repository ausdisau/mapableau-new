"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { TranscriptReviewEditor } from "@/components/voice/TranscriptReviewEditor";
import { VoiceCaptureButton } from "@/components/voice/VoiceCaptureButton";
import { VoiceDraftConfirmation } from "@/components/voice/VoiceDraftConfirmation";
import { VoicePrivacyNotice } from "@/components/voice/VoicePrivacyNotice";
import {
  VOICE_DRAFT_TYPE_LABELS,
  type VoiceDraftType,
} from "@/types/voice";

type Phase = "idle" | "recording" | "transcribing" | "review" | "done" | "error";

export function VoiceRecorderPanel({
  defaultDraftType = "care_request",
}: {
  defaultDraftType?: VoiceDraftType;
}) {
  const [draftType, setDraftType] = useState<VoiceDraftType>(defaultDraftType);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcriptId, setTranscriptId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [liveMessage, setLiveMessage] = useState("");
  const [pasteFallback, setPasteFallback] = useState("");
  const [draftPayload, setDraftPayload] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const announce = useCallback((msg: string) => {
    setLiveMessage(msg);
  }, []);

  useEffect(() => {
    if (!liveMessage) return;
    const t = setTimeout(() => setLiveMessage(""), 8000);
    return () => clearTimeout(t);
  }, [liveMessage]);

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
          : "Could not access microphone. Use text or paste instead."
      );
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setPhase("transcribing");
    announce("Transcribing your recording");
  }

  async function uploadAudio(sid: string) {
    setLoading(true);
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const form = new FormData();
    form.append("sessionId", sid);
    form.append("audio", blob, "recording.webm");
    const res = await fetch("/api/voice/transcribe", { method: "POST", body: form });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setPhase("error");
      announce(data.error ?? "Transcription failed");
      return;
    }
    setTranscriptId(data.transcript.id);
    setTranscript(data.transcript.editedTranscript ?? data.transcript.rawTranscript);
    setConfidence(data.transcript.confidence);
    setPhase("review");
    announce("Transcript ready for your review");
  }

  async function usePasteFallback() {
    if (!pasteFallback.trim()) return;
    setLoading(true);
    try {
      const sid = await ensureSession();
      const res = await fetch(`/api/voice/sessions/${sid}/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteFallback.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setTranscriptId(data.transcript.id);
        setTranscript(data.transcript.editedTranscript ?? pasteFallback.trim());
        setConfidence(data.transcript.confidence);
        setPhase("review");
        announce("Pasted text loaded for review");
      } else {
        announce(data.error ?? "Could not save text");
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveTranscriptEdit() {
    if (!transcriptId) return;
    setLoading(true);
    const res = await fetch(`/api/voice/transcripts/${transcriptId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editedTranscript: transcript }),
    });
    setLoading(false);
    if (res.ok) announce("Transcript saved");
  }

  async function confirmTranscript() {
    if (!transcriptId) return;
    setLoading(true);
    await saveTranscriptEdit();
    const res = await fetch(`/api/voice/transcripts/${transcriptId}/confirm`, {
      method: "POST",
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      announce("Transcript confirmed");
      setDraftPayload({ preview: transcript, type: draftType });
    }
  }

  async function createDraft() {
    if (!transcriptId) return;
    setLoading(true);
    const res = await fetch(`/api/voice/transcripts/${transcriptId}/create-draft`, {
      method: "POST",
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setDraftPayload(data.draft.draftPayloadJson as Record<string, unknown>);
      setPhase("done");
      announce("Draft created. Submit manually when ready.");
    }
  }

  async function discardAll() {
    if (!transcriptId) {
      setPhase("idle");
      setTranscript("");
      return;
    }
    setLoading(true);
    await fetch(`/api/voice/transcripts/${transcriptId}/discard`, { method: "POST" });
    setLoading(false);
    setSessionId(null);
    setTranscriptId(null);
    setTranscript("");
    setPhase("idle");
    announce("Voice session discarded");
  }

  return (
    <div className="space-y-6">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>
      {phase !== "idle" ? (
        <p role="status" className="text-sm font-medium">
          Status: {phase}
        </p>
      ) : null}

      <VoicePrivacyNotice />

      <div>
        <label htmlFor="voice-draft-type" className="block text-sm font-medium">
          I want to draft a
        </label>
        <select
          id="voice-draft-type"
          className={formInputClass}
          value={draftType}
          disabled={phase === "recording" || phase === "transcribing"}
          onChange={(e) => setDraftType(e.target.value as VoiceDraftType)}
        >
          {(Object.keys(VOICE_DRAFT_TYPE_LABELS) as VoiceDraftType[]).map((k) => (
            <option key={k} value={k}>
              {VOICE_DRAFT_TYPE_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      <VoiceCaptureButton
        isRecording={phase === "recording"}
        disabled={loading || phase === "transcribing"}
        onStart={startRecording}
        onStop={stopRecording}
      />

      <section className="rounded-lg border border-dashed border-border p-4 space-y-2">
        <h3 className="text-sm font-semibold">Type or paste instead</h3>
        <textarea
          className={`${formInputClass} min-h-[80px]`}
          value={pasteFallback}
          onChange={(e) => setPasteFallback(e.target.value)}
          placeholder="Type or paste your message here (AAC friendly)"
          aria-label="Text fallback for voice input"
        />
        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={!pasteFallback.trim() || loading}
          onClick={usePasteFallback}
        >
          Use this text
        </Button>
      </section>

      {(phase === "review" || phase === "done") && transcript ? (
        <>
          <TranscriptReviewEditor
            value={transcript}
            onChange={setTranscript}
            confidence={confidence}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              loading={loading}
              onClick={saveTranscriptEdit}
            >
              Save edits
            </Button>
            <Button
              type="button"
              variant="default"
              size="default"
              loading={loading}
              onClick={confirmTranscript}
            >
              Confirm transcript
            </Button>
          </div>
          {draftPayload ? (
            <VoiceDraftConfirmation
              draftType={draftType}
              payload={draftPayload}
              loading={loading}
              onCreateDraft={createDraft}
              onDiscard={discardAll}
            />
          ) : null}
        </>
      ) : null}

      {phase === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {liveMessage}
        </p>
      ) : null}

      <Button type="button" variant="outline" size="sm" onClick={discardAll}>
        Discard session
      </Button>
    </div>
  );
}
