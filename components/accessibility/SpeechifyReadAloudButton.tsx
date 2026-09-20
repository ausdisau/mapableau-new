"use client";

import { Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type PlaybackState = "idle" | "loading" | "playing" | "paused" | "error";

export function SpeechifyReadAloudButton({
  text,
  label = "Listen",
}: {
  text: string;
  label?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [state, setState] = useState<PlaybackState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  async function startPlayback() {
    if (state === "playing") {
      audioRef.current?.pause();
      setState("paused");
      return;
    }

    if (state === "paused" && audioRef.current) {
      await audioRef.current.play();
      setState("playing");
      return;
    }

    setState("loading");
    setMessage("");

    try {
      const response = await fetch("/api/speechify/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("tts_unavailable");

      const blob = await response.blob();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);

      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;

      const audio = new Audio(objectUrl);
      audioRef.current = audio;

      audio.addEventListener(
        "ended",
        () => {
          setState("idle");
          setMessage("Read aloud finished.");
        },
        { once: true },
      );

      audio.addEventListener(
        "error",
        () => {
          setState("error");
          setMessage("Audio playback failed.");
        },
        { once: true },
      );

      await audio.play();
      setState("playing");
      setMessage("Read aloud started.");
    } catch {
      setState("error");
      setMessage("Read aloud is temporarily unavailable.");
    }
  }

  const busy = state === "loading";
  const active = state === "playing";
  const Icon = active ? Pause : state === "paused" ? Play : Volume2;

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={startPlayback}
        disabled={busy}
        aria-busy={busy}
        aria-pressed={active}
        className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/50 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20 disabled:cursor-wait disabled:opacity-70 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#F8C51C] motion-reduce:transition-none"
      >
        <Icon size={18} aria-hidden="true" />
        {busy
          ? "Preparing audio…"
          : active
            ? "Pause"
            : state === "paused"
              ? "Resume"
              : label}
      </button>
      <span className="sr-only" aria-live="polite">
        {message}
      </span>
    </div>
  );
}
