import type { Metadata } from "next";

import { MapAbleSearchHero } from "@/components/search/MapAbleSearchHero";
import { MapAbleSearchWorkspace } from "@/components/search/MapAbleSearchWorkspace";
import { canonicalAlternate } from "@/lib/config/canonical-url";
import { shouldPopulateStIvesDemo } from "@/lib/search/demo/st-ives-search-demo";
import { searchMapAble } from "@/lib/search/mapable-search-service";
import {
  parseSearchSelectionFromParams,
  resolveSearchUiStatus,
  categoryToVertical,
} from "@/lib/search/mapable-search-ui";

export const metadata: Metadata = {
  title: "MapAble Search | Find what works for you",
  description:
    "One search for an accessible Australia — places, providers, care, transport and jobs with source-labelled evidence.",
  alternates: canonicalAlternate("/search"),
};

type Params = {
  q?: string;
  vertical?: string;
  presentation?: string;
  view?: string;
  tier?: string;
  state?: string;
  postcode?: string;
  demo?: string;
};

export default async function MapAbleSearchPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const selection = parseSearchSelectionFromParams(params);
  const demoParam = typeof params.demo === "string" ? params.demo : null;
  const useWorkspace = selection.presentation === "conversation";
  const populateDemo = shouldPopulateStIvesDemo({
    demoParam,
    presentation: selection.presentation,
    query: selection.query,
  });

  const state =
    params.state &&
    ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"].includes(params.state)
      ? params.state
      : undefined;
  const postcode = /^\d{4}$/.test(params.postcode ?? "")
    ? params.postcode
    : undefined;

  // Public discovery only for Web mode — never send conversation transcripts here.
  let response = null;
  let httpStatus: number | null = null;
  let error: string | null = null;

  if (selection.presentation === "web") {
    try {
      response = await searchMapAble({
        q: selection.query,
        vertical: categoryToVertical(selection.category),
        state,
        postcode,
      });
    } catch {
      error = "unavailable";
      httpStatus = 503;
    }
  }

  const status = resolveSearchUiStatus({
    response,
    httpStatus,
    error,
  });

  return (
    <main
      id="main-content"
      className="mx-auto max-w-7xl space-y-8 px-3 py-6 sm:px-4 sm:py-10"
    >
      {useWorkspace ? (
        <MapAbleSearchWorkspace
          initialSelection={selection}
          populateDemo={populateDemo}
        />
      ) : (
        <MapAbleSearchHero
          initialSelection={selection}
          response={response}
          status={status}
        />
      )}
    </main>
  );
}
