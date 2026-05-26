import Link from "next/link";

import { CorePageHeader } from "@/components/core/CorePageHeader";
import { SquareContrastTable } from "@/components/mapable-square/SquareContrastTable";
import { SquarePrincipleList } from "@/components/mapable-square/SquarePrincipleList";
import { SQUARE_TAGLINE } from "@/lib/mapable-square/copy";

export const metadata = {
  title: "MapAble Square — Principles",
  description:
    "Design principles for MapAble Square: genuine disability community without additive feed algorithms.",
};

export default function SquarePrinciplesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      <CorePageHeader
        eyebrow="MapAble Square"
        title="Principles"
        description="Square is intentionally boring in the right ways: predictable order, clear rooms, and no hidden ranking inside discussion."
      />

      <SquarePrincipleList />

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">Contrast with feed logic</h2>
        <SquareContrastTable />
      </section>

      <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-sm">
        <h2 className="font-heading text-lg font-semibold">Commitment</h2>
        <p className="mt-2 text-muted-foreground">
          MapAble Square will not ship “For you”, “Trending”, or engagement-weighted discussion
          ordering. If we ever propose a different sort, it will be explicit, opt-in, and listed in
          the{" "}
          <Link href="/algorithms" className="font-medium text-primary hover:underline">
            algorithm register
          </Link>{" "}
          — and never the default.
        </p>
        <p className="mt-4 font-medium">{SQUARE_TAGLINE}</p>
      </section>

      <p>
        <Link href="/square" className="text-sm font-medium text-primary hover:underline">
          ← Back to Square
        </Link>
      </p>
    </div>
  );
}
