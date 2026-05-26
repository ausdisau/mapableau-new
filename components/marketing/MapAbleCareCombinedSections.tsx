import Link from "next/link";

import { cn } from "@/app/lib/utils";
import { MapAbleWavyText } from "@/components/brand/MapAbleWavyText";
import { Button } from "@/components/ui/button";
import { mapableSectionCardClass } from "@/lib/brand/styles";

const VALUE_STATS = [
  {
    value: "4",
    label: "funding pathways visible before enquiry",
  },
  {
    value: "5",
    label: "access filters designed around real support needs",
  },
  {
    value: "1",
    label: "combined list, map and guidance experience",
  },
] as const;

const JOURNEY_STEPS = [
  {
    step: "1",
    title: "Search with context",
    description:
      "Tell us what support you need, where you are, and any access or funding requirements up front.",
  },
  {
    step: "2",
    title: "Compare with confidence",
    description:
      "See availability signals, response times, and NDIS registration before you reach out.",
  },
  {
    step: "3",
    title: "Take the next step",
    description:
      "View profiles, compare providers, or ask MapAble for guidance on your options.",
  },
] as const;

export function MapAbleCareCombinedSections() {
  return (
    <>
      <section
        className="container mx-auto max-w-7xl px-4 py-12 sm:px-5 lg:px-8"
        aria-labelledby="value-stats"
      >
        <h2 id="value-stats" className="sr-only">
          Why MapAble Provider Finder
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {VALUE_STATS.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                mapableSectionCardClass,
                "flex flex-col items-start gap-2 p-6 sm:p-8",
              )}
            >
              <span className="mapable-display text-5xl font-black text-primary sm:text-6xl">
                {stat.value}
              </span>
              <p className="text-sm font-semibold leading-relaxed text-muted-foreground sm:text-base">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-slate-200 bg-slate-50/70 py-14"
        aria-labelledby="guided-journey-heading"
      >
        <div className="container mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">
              Guided support journey
            </p>
            <h2
              id="guided-journey-heading"
              className="mt-3 text-3xl font-black leading-[1.08] tracking-[-0.04em] sm:text-5xl"
            >
              <MapAbleWavyText text="One place to start, many ways to be supported." />
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              Built for participants, families and coordinators who need clear
              comparison, practical next steps and support that understands
              access needs.
            </p>
          </div>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {JOURNEY_STEPS.map((item) => (
              <li
                key={item.step}
                className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--mapable-yellow))]/25 text-sm font-black text-primary">
                  {item.step}
                </span>
                <h3 className="mapable-display mt-4 text-xl font-black tracking-[-0.045em]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button
              variant="default"
              asChild
              size="lg"
              className="rounded-2xl font-black"
            >
              <Link href="/ask">Ask MapAble</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-2xl border-2 border-foreground font-black"
            >
              <Link href="/register">List your service</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
