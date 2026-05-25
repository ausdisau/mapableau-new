"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ConferenceMode } from "@/types/messages";

type DailyCallFrame = {
  join: (opts: { url: string; token?: string }) => Promise<void>;
  leave: () => void;
  destroy: () => void;
};

export function ConferenceRoom({
  roomUrl,
  token,
  mode,
  provider,
  onLeave,
}: {
  roomUrl: string;
  token?: string;
  mode: ConferenceMode;
  provider?: string;
  onLeave: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Connecting…");
  const isMock =
    provider === "mock" ||
    !token ||
    roomUrl.includes("mockConference");

  useEffect(() => {
    if (isMock) {
      setStatus("Mock call — no live audio or video.");
      return;
    }

    let destroyed = false;
    let callFrame: DailyCallFrame | null = null;

    (async () => {
      try {
        const Daily = (await import("@daily-co/daily-js")).default;
        if (!containerRef.current || destroyed) return;

        callFrame = Daily.createFrame(containerRef.current, {
          showLeaveButton: false,
          iframeStyle: {
            width: "100%",
            height: "100%",
            border: "0",
          },
        }) as unknown as DailyCallFrame;

        await callFrame.join({
          url: roomUrl,
          token,
        });

        if (!destroyed) setStatus("");
      } catch {
        if (!destroyed) {
          setStatus("Could not connect to the call. Check your connection and try again.");
        }
      }
    })();

    return () => {
      destroyed = true;
      callFrame?.leave();
      callFrame?.destroy();
    };
  }, [roomUrl, token, isMock]);

  if (isMock) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/40 p-8 text-center"
        role="region"
        aria-label={mode === "video" ? "Mock video call" : "Mock audio call"}
      >
        <p className="text-sm text-muted-foreground">
          {mode === "video" ? "Video" : "Audio"} call (practice mode). Configure{" "}
          <code className="text-xs">DAILY_API_KEY</code> and{" "}
          <code className="text-xs">CONFERENCE_PROVIDER=daily</code> for live calls.
        </p>
        <Button type="button" variant="outline" size="default" className="min-h-11" onClick={onLeave}>
          Leave call
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {status ? (
        <p className="text-sm text-muted-foreground" role="status">
          {status}
        </p>
      ) : null}
      <div
        ref={containerRef}
        className="h-[min(360px,50dvh)] w-full overflow-hidden rounded-xl border border-border bg-black/5"
        aria-label={mode === "video" ? "Video call" : "Audio call"}
      />
    </div>
  );
}
