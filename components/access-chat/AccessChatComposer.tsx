"use client";

import { useId } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  /** Optional hook for future voice input — not wired to SpeechRecognition in v1. */
  onVoiceStart?: () => void;
};

export function AccessChatComposer({
  value,
  onChange,
  onSubmit,
  disabled,
  onVoiceStart,
}: Props) {
  const inputId = useId();
  const hintId = useId();

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && value.trim()) onSubmit();
      }}
    >
      <label htmlFor={inputId} className="block text-sm font-semibold text-[#0C1833]">
        Ask about accessible places
      </label>
      <p id={hintId} className="text-sm text-slate-600">
        Describe where you want to go and what access features you need.
      </p>
      <div className="flex flex-wrap gap-2">
        <textarea
          id={inputId}
          name="access-chat-message"
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-describedby={hintId}
          className="min-h-11 w-full flex-1 rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-base text-[#0C1833] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F] motion-reduce:transition-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!disabled && value.trim()) onSubmit();
            }
          }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="min-h-11 rounded-xl bg-[#005B7F] px-5 font-bold text-white hover:bg-[#004a66] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F] disabled:opacity-60"
        >
          {disabled ? "Searching…" : "Send"}
        </button>
        {onVoiceStart ? (
          <button
            type="button"
            className="min-h-11 rounded-xl border-2 border-slate-300 bg-white px-4 font-semibold text-[#0C1833] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F]"
            onClick={onVoiceStart}
            aria-label="Start voice input"
          >
            Voice input
          </button>
        ) : null}
      </div>
    </form>
  );
}
