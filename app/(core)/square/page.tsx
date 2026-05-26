import Link from "next/link";

import { CorePageHeader } from "@/components/core/CorePageHeader";
import { SquareContrastTable } from "@/components/mapable-square/SquareContrastTable";
import { SquareHeritage } from "@/components/mapable-square/SquareHeritage";
import { SquarePrincipleList } from "@/components/mapable-square/SquarePrincipleList";
import { SquareRelatedLinks } from "@/components/mapable-square/SquareRelatedLinks";
import { SquareRoomGrid } from "@/components/mapable-square/SquareRoomGrid";
import {
  SQUARE_DESCRIPTION,
  SQUARE_TAGLINE,
} from "@/lib/mapable-square/copy";
import { SQUARE_ROOMS } from "@/lib/mapable-square/rooms";

export const metadata = {
  title: "MapAble Square",
  description: SQUARE_TAGLINE,
};

export default function MapAbleSquarePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
      <CorePageHeader
        eyebrow="Community"
        title={
          <>
            MapAble <span className="text-primary">Square</span>
          </>
        }
        description={SQUARE_DESCRIPTION}
      >
        <p className="max-w-2xl text-sm font-medium text-foreground">{SQUARE_TAGLINE}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/square/principles"
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Read the principles
          </Link>
          <Link
            href="/square/rooms/introduce-yourself"
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            Enter a room
          </Link>
        </div>
      </CorePageHeader>

      <section aria-labelledby="square-contrast-heading" className="space-y-4">
        <h2 id="square-contrast-heading" className="font-heading text-xl font-semibold">
          Against additive feeds posing as community
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Many platforms sort disability discussion by engagement predictions. Square refuses that
          trade: the same room order for everyone, moderation in the open, and algorithms only where
          MapAble publishes them elsewhere.
        </p>
        <SquareContrastTable />
      </section>

      <section aria-labelledby="square-principles-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="square-principles-heading" className="font-heading text-xl font-semibold">
            How Square works
          </h2>
          <Link href="/square/principles" className="text-sm font-medium text-primary hover:underline">
            Full principles →
          </Link>
        </div>
        <SquarePrincipleList />
      </section>

      <section aria-labelledby="square-rooms-heading" className="space-y-4">
        <h2 id="square-rooms-heading" className="font-heading text-xl font-semibold">
          Rooms
        </h2>
        <p className="text-sm text-muted-foreground">
          Pick a room by purpose — not by what an algorithm thinks you will engage with.
        </p>
        <SquareRoomGrid rooms={SQUARE_ROOMS} />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(16rem,22rem)]">
        <SquareHeritage />
        <SquareRelatedLinks />
      </div>
    </div>
  );
}
