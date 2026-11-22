"use client";

import { useSession } from "next-auth/react";
import { useCallback, useState } from "react";

import { isAskMapAbleEmbeddedEnabled, isAskMapAbleGuestEnabled } from "@/lib/ask-mapable";

import { AskMapAbleActionsTab } from "./AskMapAbleActionsTab";
import { AskMapAbleChatTab } from "./AskMapAbleChatTab";
import { AskMapAbleHistoryTab } from "./AskMapAbleHistoryTab";
import { AskMapAbleLauncher } from "./AskMapAbleLauncher";
import { AskMapAblePanel } from "./AskMapAblePanel";
import { GuestAccessAssistant } from "./GuestAccessAssistant";
import { useAskInteractionPreferences } from "./useAskInteractionPreferences";
import { useAskLocalSessions } from "./useAskLocalSessions";
import { useAskWidgetState } from "./useAskWidgetState";

/**
 * Reuses the original authenticated widget for signed-in users.
 * Optional guest Access Assistant is an entirely separate, read-only public
 * route and NEVER inherits authenticated session state or private actions.
 */
export function AskMapAbleWidget() {
  const authenticatedEnabled = isAskMapAbleEmbeddedEnabled();
  const guestEnabled = isAskMapAbleGuestEnabled();
  const { data: session, status } = useSession();
  if (status === "loading") return null;
  if (authenticatedEnabled && session?.user) return <AuthenticatedAskMapAbleWidget />;
  if (guestEnabled) return <GuestAccessAssistant />;
  return null;
}

function AuthenticatedAskMapAbleWidget() {
  const enabled = isAskMapAbleEmbeddedEnabled();
  const { data: session, status } = useSession();
  const {
    open,
    setOpen,
    toggle,
    activeTab,
    setActiveTab,
    activeSessionId,
    setActiveSessionId,
    hydrated,
  } = useAskWidgetState("chat");
  const { sessions, ensureSession, appendMessages, activeSession } =
    useAskLocalSessions(activeSessionId);
  const canReadPreferences =
    enabled && hydrated && status === "authenticated" && Boolean(session?.user);
  const { maxVisibleChoices } = useAskInteractionPreferences(canReadPreferences);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const onEnsureSession = useCallback(
    (title?: string) => {
      const sessionLocal = ensureSession(title);
      setActiveSessionId(sessionLocal.id);
      return sessionLocal.id;
    },
    [ensureSession, setActiveSessionId],
  );

  if (!enabled || !hydrated) return null;
  if (status === "loading") return null;
  if (!session?.user) return null;

  return (
    <>
      <AskMapAbleLauncher open={open} onToggle={toggle} />
      <AskMapAblePanel
        open={open}
        onClose={() => setOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        chat={
          <AskMapAbleChatTab
            sessionId={activeSessionId}
            onEnsureSession={onEnsureSession}
            messages={activeSession?.messages ?? []}
            onAppend={appendMessages}
            seedMessage={seedMessage}
            onSeedConsumed={() => setSeedMessage(null)}
            maxVisibleChoices={maxVisibleChoices}
          />
        }
        actions={
          <AskMapAbleActionsTab
            onSeed={(message) => {
              setSeedMessage(message);
              setActiveTab("chat");
            }}
          />
        }
        history={
          <AskMapAbleHistoryTab
            sessions={sessions}
            onOpen={(id) => {
              setActiveSessionId(id);
              setActiveTab("chat");
            }}
            onNew={() => {
              setActiveSessionId(null);
              setActiveTab("chat");
            }}
          />
        }
      />
    </>
  );
}

export default AskMapAbleWidget;
