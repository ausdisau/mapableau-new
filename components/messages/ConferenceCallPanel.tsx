"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";

import { ConferenceRoom } from "@/components/messages/ConferenceRoom";
import { AacButtonBar } from "@/components/messages/AacButtonBar";
import { Button } from "@/components/ui/button";
import { useConferenceSession } from "@/hooks/useConferenceSession";
import { useAacPreferences } from "@/hooks/useAacPreferences";
import type { ConferenceMode } from "@/types/messages";

export function ConferenceCallPanel({
  threadId,
  mode,
}: {
  threadId: string;
  mode: ConferenceMode;
}) {
  const { session, loading, error, start, end } = useConferenceSession(threadId);
  const { phrases, showAacByDefault } = useAacPreferences();
  const [showAac, setShowAac] = useState(false);

  useEffect(() => {
    setShowAac(showAacByDefault);
  }, [showAacByDefault]);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(mode === "audio");

  const active = session?.status === "active";
  const inCall = active && session?.token && session?.roomUrl;
  const sessionMode = session?.mode ?? mode;

  return (
    <div className="flex h-full min-h-[320px] flex-col p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" role="status">
          {loading
            ? "Checking call status…"
            : inCall
              ? `${sessionMode === "video" ? "Video" : "Audio"} call in progress`
              : `Start a ${mode === "video" ? "video" : "voice"} call with everyone in this thread`}
        </p>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-border px-3 text-sm font-medium"
          aria-pressed={showAac}
          onClick={() => setShowAac((v) => !v)}
        >
          {showAac ? "Hide AAC buttons" : "Show AAC buttons"}
        </button>
      </div>

      {error ? (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {showAac ? (
        <div className="mb-4">
          <AacButtonBar threadId={threadId} phrases={phrases} compact />
        </div>
      ) : null}

      {inCall && session ? (
        <>
          <ConferenceRoom
            roomUrl={session.roomUrl!}
            token={session.token}
            mode={sessionMode}
            provider={session.provider}
            onLeave={() => void end()}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              className="min-h-11"
              aria-pressed={muted}
              onClick={() => setMuted((m) => !m)}
            >
              {muted ? (
                <MicOff className="mr-2 h-4 w-4" aria-hidden />
              ) : (
                <Mic className="mr-2 h-4 w-4" aria-hidden />
              )}
              {muted ? "Unmute" : "Mute"}
            </Button>
            {sessionMode === "video" ? (
              <Button
                type="button"
                variant="outline"
                size="default"
                className="min-h-11"
                aria-pressed={cameraOff}
                onClick={() => setCameraOff((c) => !c)}
              >
                {cameraOff ? (
                  <VideoOff className="mr-2 h-4 w-4" aria-hidden />
                ) : (
                  <Video className="mr-2 h-4 w-4" aria-hidden />
                )}
                {cameraOff ? "Turn camera on" : "Turn camera off"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="destructive"
              size="default"
              className="min-h-11"
              loading={loading}
              onClick={() => void end()}
            >
              <PhoneOff className="mr-2 h-4 w-4" aria-hidden />
              End call
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Mute and camera controls apply when using Daily.co. In mock mode, use End call to finish.
          </p>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-border bg-muted/20 p-8 text-center">
          <p className="max-w-md text-sm text-muted-foreground">
            Only people in this conversation can join. Calls are not recorded by default.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {mode === "audio" ? (
              <Button
                type="button"
                variant="default"
                size="default"
                className="min-h-11"
                loading={loading}
                onClick={() => void start("audio")}
              >
                <Mic className="mr-2 h-4 w-4" aria-hidden />
                Start audio call
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                size="default"
                className="min-h-11"
                loading={loading}
                onClick={() => void start("video")}
              >
                <Video className="mr-2 h-4 w-4" aria-hidden />
                Start video call
              </Button>
            )}
          </div>
          {active && session && !session.token ? (
            <Button
              type="button"
              variant="outline"
              size="default"
              className="min-h-11"
              loading={loading}
              onClick={() => void start(sessionMode)}
            >
              Join active call
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
