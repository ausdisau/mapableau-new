import type { Metadata } from "next";

import { MapAbleSearchHero } from "@/components/search/MapAbleSearchHero";
import { canonicalAlternate } from "@/lib/config/canonical-url";
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
  tier?: string;
  state?: string;
  postcode?: string;
};

export default async function MapAbleSearchPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const selection = parseSearchSelectionFromParams(params);
  const state =
    params.state &&
    ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"].includes(params.state)
      ? params.state
      : undefined;
  const postcode = /^\d{4}$/.test(params.postcode ?? "")
    ? params.postcode
    : undefined;

  const shouldRunWebSearch =
    selection.presentation === "web" || Boolean(selection.query);

  let response = null;
  let httpStatus: number | null = null;
  let error: string | null = null;

  if (shouldRunWebSearch) {
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
      className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:py-14"
    >
      <MapAbleSearchHero
        initialSelection={selection}
        response={response}
        status={status}
      />
    </main>
  );
}
