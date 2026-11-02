"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_CARE_AAC_PHRASES,
  type AacPhrase,
} from "@mapable/adtunis-aac";
import {
  BrowserCaptureError,
  pickRecorderMimeType,
  requestMicrophoneStream,
} from "@mapable/adtunis-asr";
import type { AdtunisWorkspace, Recognition } from "@mapable/adtunis-core";
import { AdtunisClient } from "@mapable/adtunis-mapable-sdk";
import { CareComposer } from "@mapable/adtunis-ui";

export function CareCommunicateClient({
  initialPhrases,
}: {
  initialPhrases?: AacPhrase[];
}) {
  const client = useMemo(() => new AdtunisClient(), []);
  const [workspace, setWorkspace] = useState<AdtunisWorkspace | null>(null);
  const [draft, setDraft] = useState("");
  const [candidate, setCandidate] = useState<Recognition | null>(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryLabel, setDeliveryLabel] = useState<string | null>(null);
  const [speechDetail, setSpeechDetail] = useState(
    "Checking speech recognition readiness…",
  );
  const [recognitionReady, setRecognitionReady] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const refresh = useCallback(async () => {
    const [next, status] = await Promise.all([
      client.workspace(),
      client.speechStatus(),
    ]);
    setWorkspace(next);
    setSpeechDetail(status.detail);
    setRecognitionReady(status.recognitionReady);
    if (next.lastDelivery) setDeliveryLabel(next.lastDelivery.label);
  }, [client]);

  useEffect(() => {
    void refresh().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load Adtunis"),
    );
  }, [refresh]);

  const onStartRecording = useCallback(async () => {
    setError(null);
    setDeliveryLabel(null);
    try {
      await client.performAction({ type: "startCapture" });
      const stream = await requestMicrophoneStream();
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = pickRecorderMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start(250);
      setRecording(true);
    } catch (err) {
      if (err instanceof BrowserCaptureError) {
        setError(err.message);
      } else {
        setError(
          err instanceof Error ? err.message : "Unable to start recording.",
        );
      }
      setRecording(false);
      try {
        await client.performAction({ type: "stopCapture" });
      } catch {
        /* ignore */
      }
    }
  }, [client]);

  const onStopRecording = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state === "inactive") {
          resolve(null);
          return;
        }
        recorder.onstop = () => {
          resolve(
            new Blob(chunksRef.current, {
              type: recorder.mimeType || "audio/webm",
            }),
          );
        };
        recorder.stop();
      });
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setRecording(false);
      await client.performAction({ type: "stopCapture" });
      if (!blob || blob.size === 0) {
        setError("No audio was captured. You can type or use AAC instead.");
        return;
      }
      const next = await client.recognize(blob);
      setWorkspace(next);
      const latest = next.recognitions[0] ?? null;
      setCandidate(latest);
      setDraft(latest?.raw ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recognition failed.");
    } finally {
      setBusy(false);
    }
  }, [client]);

  const onSelectAac = useCallback((phrase: AacPhrase) => {
    setCandidate(null);
    setDraft(phrase.text);
    setError(null);
  }, []);

  const onConfirm = useCallback(async () => {
    if (!draft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await client.confirmIntent({
        recognitionId: candidate?.id,
        expression: draft.trim(),
        idempotencyKey: crypto.randomUUID(),
        confirmed: true,
      });
      setWorkspace(result.workspace);
      setDeliveryLabel(result.delivery.label);
      setCandidate(
        result.workspace.recognitions.find(
          (item) => item.confirmed === draft.trim(),
        ) ?? null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delivery failed.");
    } finally {
      setBusy(false);
    }
  }, [candidate?.id, client, draft]);

  const onRetry = useCallback(() => {
    setCandidate(null);
    setDraft("");
    setDeliveryLabel(null);
    setError(null);
  }, []);

  const onCancel = useCallback(() => {
    setCandidate(null);
    setDraft("");
    setDeliveryLabel(null);
    setError(null);
    setRecording(false);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const phrases = initialPhrases?.length
    ? initialPhrases
    : DEFAULT_CARE_AAC_PHRASES;

  const enableTranscription = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await client.performAction({
        type: "saveConsent",
        consent: {
          transcription: true,
          personalisation: workspace?.consent.personalisation ?? false,
          research: workspace?.consent.research ?? false,
        },
      });
      setWorkspace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save consent.");
    } finally {
      setBusy(false);
    }
  }, [client, workspace?.consent.personalisation, workspace?.consent.research]);

  return (
    <div className="space-y-4">
      <section
        aria-labelledby="adtunis-consent-heading"
        className="space-y-2 rounded-xl border p-4"
      >
        <h2 id="adtunis-consent-heading" className="font-semibold">
          Communication consent
        </h2>
        <p className="text-sm opacity-80">
          Transcription consent is only required for speech. Typing and AAC work
          without it. Personalisation and research stay independent and off by
          default.
        </p>
        <p className="text-sm" role="status">
          Transcription:{" "}
          {workspace?.consent.transcription ? "granted" : "not granted"}
        </p>
        {!workspace?.consent.transcription ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-md border px-4"
            onClick={() => void enableTranscription()}
            disabled={busy}
          >
            Allow transcription for this session
          </button>
        ) : null}
      </section>
      <CareComposer
        fontScale={workspace?.accessibility.fontScale}
        reducedMotion={workspace?.accessibility.reducedMotion}
        highContrast={workspace?.accessibility.highContrast}
        recording={recording}
        recognitionReady={recognitionReady}
        speechStatusDetail={speechDetail}
        candidate={candidate}
        draft={draft}
        aacPhrases={phrases}
        deliveryLabel={deliveryLabel}
        error={error}
        busy={busy}
        onDraftChange={setDraft}
        onStartRecording={() => void onStartRecording()}
        onStopRecording={() => void onStopRecording()}
        onSelectAac={onSelectAac}
        onConfirm={() => void onConfirm()}
        onRetry={onRetry}
        onCancel={onCancel}
      />
    </div>
  );
}
