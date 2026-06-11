"use client";

import React from "react";

import { cn } from "@/app/lib/utils";
import { Badge } from "@/components/ui/badge";
import { mapableEyebrowBadgeClass } from "@/lib/brand/styles";

export function ProviderFinderHero() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[#F6FBFC] py-10 sm:py-12 lg:py-14">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl motion-reduce:blur-none"
        aria-hidden
      />
      <div className="container relative mx-auto max-w-5xl px-4">
        <Badge variant="outline" className={cn("mb-4", mapableEyebrowBadgeClass)}>
          Provider Finder
        </Badge>
        <h1 className="mapable-display text-3xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-4xl lg:text-5xl">
          Find support that fits your life.
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">
          Describe what you need in chat — we will set your filters and show
          matching providers on the map and list beside you.
        </p>
      </div>
    </section>
  );
}
