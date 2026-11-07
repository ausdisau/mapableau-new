"use client";

import { useId } from "react";

export function Composer({
  value,
  disabled,
  onChange,
  onSend,
  onStop,
  onClear,
  onRetry,
  processing,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  onClear: () => void;
  onRetry: () => void;
  processing: boolean;
}) {
  const inputId = useId();
  const helpId = useId();

  return (
    <form
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!processing) onSend();
      }}
      aria-labelledby="vp-composer-heading"
    >
      <h2 id="vp-composer-heading" className="text-base font-bold text-[#0C1833]">
        Your message
      </h2>
      <p id={helpId} className="text-sm text-slate-600">
        Compatible with keyboard, switch, and AAC text entry. No automatic
        timeout. Press Send when you are ready.
      </p>
      <label htmlFor={inputId} className="sr-only">
        Message to MapAble Guide
      </label>
      <textarea
        id={inputId}
        name="personaMessage"
        rows={4}
        value={value}
        disabled={disabled}
        aria-describedby={helpId}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-h-[6rem] rounded-lg border border-slate-300 px-3 py-2 text-base text-[#0C1833] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/50 disabled:bg-slate-100"
        placeholder="Type your question or request…"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={disabled || processing || value.trim().length === 0}
          className="min-h-11 min-w-[5.5rem] rounded-lg bg-[#005B7F] px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
        <button
          type="button"
          onClick={onStop}
          disabled={disabled}
          className="min-h-11 min-w-[5.5rem] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0C1833] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/50 disabled:opacity-50"
        >
          Stop
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="min-h-11 min-w-[5.5rem] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0C1833] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/50 disabled:opacity-50"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onRetry}
          disabled={disabled || processing}
          className="min-h-11 min-w-[5.5rem] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0C1833] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/50 disabled:opacity-50"
        >
          Retry
        </button>
      </div>
    </form>
  );
}
