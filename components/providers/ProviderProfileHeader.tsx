import React from "react";
import { MapPin, Star } from "lucide-react";

import type { PublicProviderProfile } from "@/types/provider-profile";

type ProviderProfileHeaderProps = {
  profile: PublicProviderProfile;
};

export function ProviderProfileHeader({ profile }: ProviderProfileHeaderProps) {
  const primaryRegion = profile.regions[0]?.label;
  const showRating = profile.rating > 0 || profile.reviewCount > 0;

  return (
    <header className="space-y-4">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {profile.name}
      </h1>
      {primaryRegion ? (
        <p className="flex flex-wrap items-center gap-2 text-base text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          {primaryRegion}
        </p>
      ) : null}
      {showRating ? (
        <p className="flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
          <span className="font-medium text-foreground">
            {profile.rating.toFixed(1)}
          </span>
          <span className="text-muted-foreground">
            ({profile.reviewCount} review
            {profile.reviewCount === 1 ? "" : "s"})
          </span>
        </p>
      ) : null}
      {profile.description ? (
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
          {profile.description}
        </p>
      ) : null}
    </header>
  );
}
