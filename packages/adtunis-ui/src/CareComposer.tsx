import type { AacPhrase } from "@mapable/adtunis-aac";
import type { Recognition } from "@mapable/adtunis-core";
import clsx from "clsx";
import { useMemo, useState } from "react";

export type CareComposerProps = {
  fontScale?: number;
  reducedMotion?: boolean;
  highContrast?: boolean;
  recording: boolean;
  recognitionReady: boolean;
  speechStatusDetail: string;
  candidate: Recognition | null;
  draft: string;
  aacPhrases: AacPhrase[];
  deliveryLabel?: string | null;
  error?: string | null;
  busy?: boolean;
  onDraftChange: (value: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSelectAac: (phrase: AacPhrase) => void;
  onConfirm: () => void;
  onRetry: () => void;
  onCancel: () => void;
};

export function CareComposer(props: CareComposerProps) {
  const [showAac, setShowAac] = useState(true);
  const scaleStyle = useMemo(
    () => ({ fontSize: `${(props.fontScale ?? 1) * 100}%` }),
    [props.fontScale],
  );

  const statusText = props.recording
    ? "Recording. Speak a short message, then stop."
    : props.busy
      ? "Working…"
      : props.candidate
        ? "Review the candidate. Edit if needed, then confirm to prepare delivery."
        : "Type, pick an AAC phrase, or start recording. Voice is optional.";

  return (
    <div
      className={clsx(
        "space-y-4 rounded-xl border p-4",
        props.highContrast && "border-black bg-white text-black",
        props.reducedMotion && "motion-reduce:transition-none",
      )}
      style={scaleStyle}
    >
      <header className="space-y-1">
        <h2 id="adtunis-composer-heading" className="text-xl font-semibold">
          Care message composer
        </h2>
        <p className="text-sm opacity-80">
          Speech recognition never sends a message by itself. Confirm before
          delivery.
        </p>
      </header>

      <p
        role="status"
        aria-live="polite"
        className="rounded-md border border-dashed px-3 py-2 text-sm"
      >
        {statusText}
      </p>

      {!props.recognitionReady ? (
        <p className="text-sm opacity-80" role="note">
          {props.speechStatusDetail}
        </p>
      ) : null}

      {props.error ? (
        <p role="alert" className="rounded-md border border-red-600 px-3 py-2 text-sm">
          {props.error}
        </p>
      ) : null}

      {props.candidate?.raw ? (
        <section aria-labelledby="raw-candidate-heading" className="space-y-2">
          <h3 id="raw-candidate-heading" className="font-medium">
            Immutable raw candidate
          </h3>
          <p className="rounded-md bg-black/5 px-3 py-2">{props.candidate.raw}</p>
          {props.candidate.alternatives.length > 1 ? (
            <ul className="list-disc pl-5 text-sm">
              {props.candidate.alternatives.map((alt) => (
                <li key={alt}>
                  <button
                    type="button"
                    className="min-h-11 underline"
                    onClick={() => props.onDraftChange(alt)}
                  >
                    Use alternative: {alt}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <label className="block space-y-2" htmlFor="adtunis-draft">
        <span className="font-medium">Editable message</span>
        <textarea
          id="adtunis-draft"
          className="min-h-28 w-full rounded-md border px-3 py-2"
          value={props.draft}
          onChange={(event) => props.onDraftChange(event.target.value)}
          aria-describedby="adtunis-composer-heading"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        {!props.recording ? (
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-4"
            onClick={props.onStartRecording}
            disabled={props.busy}
          >
            Start recording
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-red-700 px-4 text-white"
            onClick={props.onStopRecording}
          >
            Stop recording
          </button>
        )}
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-4"
          onClick={props.onRetry}
          disabled={props.busy || props.recording}
        >
          Retry
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-4"
          onClick={props.onCancel}
          disabled={props.busy || props.recording}
        >
          Cancel
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-neutral-900 px-4 text-white"
          onClick={props.onConfirm}
          disabled={props.busy || props.recording || !props.draft.trim()}
        >
          Confirm and send
        </button>
      </div>

      <section aria-labelledby="aac-heading" className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h3 id="aac-heading" className="font-medium">
            AAC / phrase board
          </h3>
          <button
            type="button"
            className="min-h-11 text-sm underline"
            onClick={() => setShowAac((value) => !value)}
            aria-expanded={showAac}
          >
            {showAac ? "Hide phrases" : "Show phrases"}
          </button>
        </div>
        {showAac ? (
          <ul className="flex flex-wrap gap-2">
            {props.aacPhrases.map((phrase) => (
              <li key={phrase.id}>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-md border px-3"
                  onClick={() => props.onSelectAac(phrase)}
                >
                  {phrase.text}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {props.deliveryLabel ? (
        <p role="status" className="rounded-md border px-3 py-2 text-sm">
          {props.deliveryLabel}
        </p>
      ) : null}
    </div>
  );
}
