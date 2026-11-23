"use client";

import { cn } from "@/app/lib/utils";
import { MapAbleSearchConversation } from "@/components/search/MapAbleSearchConversation";
import { MapAbleSearchDisclosure } from "@/components/search/MapAbleSearchDisclosure";
import { MapAbleSearchForm } from "@/components/search/MapAbleSearchForm";
import { MapAbleSearchMedia } from "@/components/search/MapAbleSearchMedia";
import { MapAbleSearchResults } from "@/components/search/MapAbleSearchResults";
import { MapAbleStreamingWorkspace } from "@/components/search/MapAbleStreamingWorkspace";
import type { MapAbleSearchResponse } from "@/lib/search/mapable-search-core";
import {
  deepSearchAvailable,
  type SearchSelection,
  type SearchUiStatus,
} from "@/lib/search/mapable-search-ui";


type Props = {
  initialSelection: SearchSelection;
  response?: MapAbleSearchResponse | null;
  status: SearchUiStatus;
  className?: string;
};

export function MapAbleSearchHero({
  initialSelection,
  response,
  status,
  className,
}: Props) {
  const showConversation = initialSelection.presentation === "conversation";
  const showDeepNotice =
    initialSelection.tier === "deep" && !deepSearchAvailable;

  // Default-off streaming preview; existing Web and guided conversation stay intact.
  if (
    showConversation &&
    process.env.NEXT_PUBLIC_MAPABLE_SEARCH_STREAM_UI_ENABLED === "true"
  ) {
    return <MapAbleStreamingWorkspace initialSelection={initialSelection} />;
  }

  return (
    <div className={cn("space-y-10", className)}>
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-6">
          <header className="space-y-3">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#005B7F]">
              MapAble Search
            </p>
            <h1 className="font-heading text-4xl font-bold leading-tight text-[#0C1833] sm:text-5xl">
              Find what works for you.
            </h1>
            <p className="max-w-xl text-lg font-medium italic text-[#0C1833]">
              One search. An accessible Australia.
            </p>
          </header>

          <MapAbleSearchForm initialSelection={initialSelection} />

          {showDeepNotice ? (
            <MapAbleSearchDisclosure showDeepNotice status={status} />
          ) : null}

          {showConversation ? <MapAbleSearchConversation /> : null}
        </div>

        <div className="order-last lg:order-none">
          <MapAbleSearchMedia />
        </div>
      </div>

      {!showConversation || initialSelection.tier === "quick" ? (
        <MapAbleSearchResults response={response} status={status} />
      ) : null}

      <MapAbleSearchDisclosure
        status={status}
        warnings={response?.warnings}
        showDeepNotice={false}
      />
    </div>
  );
}
