"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { EvidenceBadge } from "@/components/tourism/EvidenceBadge";
import { Card, CardContent } from "@/components/ui/card";
import type { TourismPlace } from "@/lib/tourism/types";

export function PlaceCard({
  place,
  action,
}: {
  place: TourismPlace;
  action?: ReactNode;
}) {
  const photo = place.photos[0];
  return (
    <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm">
      <div className="relative h-40 bg-[#005B7F]">
        {photo ? (
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            unoptimized
            className="object-cover"
          />
        ) : null}
      </div>
      <CardContent className="space-y-3 p-5">
        <p className="text-xs font-black uppercase tracking-widest text-[#005B7F]">
          {place.neighbourhood} · {place.category}
        </p>
        <h3 className="text-xl font-bold leading-snug text-[#0C1833]">
          <Link
            className="hover:underline focus-visible:outline-4 focus-visible:outline-offset-2"
            href={`/tourism/places/${place.id}`}
          >
            {place.name}
          </Link>
        </h3>
        <p className="text-sm leading-relaxed text-slate-600">{place.description}</p>
        <div className="flex flex-wrap gap-2">
          <EvidenceBadge status={place.features.stepFree.status} />
          <EvidenceBadge status={place.features.toilets.status} />
        </div>
        <p className="text-xs text-slate-600">Source checked: {place.checkedOn}</p>
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
          <Link
            className="text-sm font-bold text-[#005B7F] underline underline-offset-4"
            href={`/tourism/places/${place.id}`}
          >
            View access evidence
          </Link>
          {action}
        </div>
      </CardContent>
    </Card>
  );
}
