"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { GuidedSearchDialogue } from "@/components/guided-search/GuidedSearchDialogue";
import type { GuidedSearchSessionFields } from "@/components/guided-search/types";

export function AssistantShell({
  initialPrompt,
  lifeIntentId,
}: {
  initialPrompt?: string;
  lifeIntentId?: string;
}) {
  const router = useRouter();
  const [session, setSession] = useState<GuidedSearchSessionFields>({
    query: initialPrompt ?? "",
    location: "",
    providerName: "",
    serviceQuery: "",
    accessQuery: "",
  });
  const savedRef = useRef(false);

  const onExplorationSaved = useCallback(async () => {
    if (!lifeIntentId || savedRef.current) return;
    savedRef.current = true;
    await fetch(`/api/my/life-intents/${lifeIntentId}/explore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: "Explored options with MapAble Assistant",
      }),
    });
    router.refresh();
  }, [lifeIntentId, router]);

  return (
    <section aria-labelledby="assistant-heading" className="space-y-4">
      <header>
        <h1
          id="assistant-heading"
          className="text-2xl font-bold text-[#0C1833]"
        >
          MapAble Assistant
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          MapAble can suggest and organise options using existing search tools.
          You make decisions about what happens next. Nothing is booked, shared,
          or spent from here.
        </p>
      </header>
      <GuidedSearchDialogue
        session={session}
        onSessionChange={setSession}
        onInterpretation={() => {
          void onExplorationSaved();
        }}
        initialMessage={initialPrompt}
        variant="compact"
        showHeader={false}
        starterPrompts={[
          "Accessible pools near me",
          "Support to try swimming",
          "Transport options for recreation",
        ]}
      />
      {lifeIntentId ? (
        <p className="text-sm text-slate-600">
          Exploring for{" "}
          <Link
            href={`/my/life/${lifeIntentId}`}
            className="font-semibold text-[#005B7F]"
          >
            your life intent
          </Link>
          . Save steps from the intent page to see them in Agency activity.
        </p>
      ) : null}
    </section>
  );
}
