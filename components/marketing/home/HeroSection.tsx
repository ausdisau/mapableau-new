import Link from "next/link";
import React from "react";

import { TrustStrip } from "@/components/marketing/home/TrustStrip";
import { ArrowIcon } from "@/components/marketing/mapable-care-icons";
import { WavyText } from "@/components/marketing/MapAbleCareTypography";
import {
  homepageHeroCopy,
  homepageHeroCtas,
} from "@/lib/marketing/mapable-care-combined-data";
import { Button, Eyebrow } from "@mapable/ui";

const ctaVariants = ["brandYellow", "brand", "brandOutline"] as const;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#F6FBFC]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(248,197,28,0.32),_transparent_52%),radial-gradient(ellipse_at_bottom_left,_rgba(0,91,127,0.22),_transparent_48%)]"
      />
      <div
        aria-hidden="true"
        className="absolute right-[-10rem] top-[-6rem] h-[28rem] w-[28rem] animate-[pulse_9s_ease-in-out_infinite] rounded-full bg-[#F8C51C]/22 blur-3xl motion-reduce:animate-none motion-reduce:blur-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-12rem] left-[-8rem] h-[30rem] w-[30rem] animate-[pulse_11s_ease-in-out_infinite] rounded-full bg-[#005B7F]/16 blur-3xl motion-reduce:animate-none motion-reduce:blur-none"
      />
      <div className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <Eyebrow className="mb-4 border-none bg-transparent px-0 text-sm tracking-[0.18em]">
          MapAble Australia
        </Eyebrow>
        <h1
          aria-label={homepageHeroCopy.headline}
          className="max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-[#0C1833] md:text-6xl lg:text-7xl"
        >
          <WavyText text={homepageHeroCopy.headline} />
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          {homepageHeroCopy.subheading}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {homepageHeroCtas.map((cta, index) => (
            <Button
              key={cta.href}
              variant={ctaVariants[index] ?? "brandOutline"}
              size="lg"
              asChild
            >
              <Link href={cta.href}>
                {cta.label}
                {index === 0 ? <ArrowIcon /> : null}
              </Link>
            </Button>
          ))}
        </div>
        <TrustStrip />
      </div>
    </section>
  );
}
