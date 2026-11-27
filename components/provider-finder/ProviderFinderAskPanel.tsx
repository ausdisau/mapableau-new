"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/app/lib/utils";
import { GuidedSearchDialogue } from "@/components/guided-search/GuidedSearchDialogue";
import type { GuidedSearchSessionFields } from "@/components/guided-search/types";
import type {
  FinderAgentData,
  FinderInterpretationData,
} from "@/types/provider-finder-chat";

type Props = {
  id?: string;
  session: GuidedSearchSessionFields;
  onInterpretation: (data: FinderInterpretationData) => void;
  onAgentMeta?: (data: FinderAgentData) => void;
  onSessionChange?: (session: GuidedSearchSessionFields) => void;
  onShowResults?: () => void;
  stayOnPage?: boolean;
  initialProviderName?: string;
  className?: string;
  modelLabel?: string;
};

export function ProviderFinderAskPanel({
  id = "ask-panel",
  session,
  onInterpretation,
  onAgentMeta,
  onSessionChange,
  onShowResults,
  stayOnPage = false,
  initialProviderName,
  className,
  modelLabel,
}: Props) {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";
  const [dialogueSession, setDialogueSession] = useState(session);

  useEffect(() => {
    setDialogueSession(session);
  }, [
    session.query,
    session.location,
    session.providerName,
    session.serviceQuery,
    session.accessQuery,
    session.skippedSlots,
  ]);

  const handleInterpretation = useCallback(
    (data: FinderInterpretationData) => {
      setDialogueSession((prev) => ({
        ...prev,
        query: data.applied.query,
        location: data.applied.location,
        providerName: data.applied.providerName,
        serviceQuery: data.applied.serviceQuery,
        accessQuery: data.applied.accessQuery,
      }));
      onInterpretation(data);
    },
    [onInterpretation],
  );

  return (
    <div id={id} className={cn("flex flex-col", className)}>
      {!isSignedIn ? (
        <p className="mb-3 text-xs text-muted-foreground">
          <Link href="/login" className="underline focus-visible:ring-2">
            Sign in
          </Link>{" "}
          to draft care, transport, or plan requests from your participant record.
        </p>
      ) : null}
      {initialProviderName ? (
        <p className="mb-2 text-xs font-medium text-foreground" role="status">
          Asking about: {initialProviderName}
        </p>
      ) : null}
      <GuidedSearchDialogue
        variant="full"
        session={{
          ...dialogueSession,
          providerName:
            initialProviderName || dialogueSession.providerName,
        }}
        onSessionChange={(next) => {
          setDialogueSession(next);
          onSessionChange?.(next);
        }}
        onInterpretation={handleInterpretation}
        onAgentMeta={onAgentMeta}
        onShowResults={onShowResults}
        stayOnPage={stayOnPage}
        className="min-h-0 flex-1"
        modelLabel={modelLabel}
      />
    </div>
  );
}
