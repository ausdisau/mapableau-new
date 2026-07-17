import React from "react";
import Link from "next/link";

import type { ParticipantSavedProviderItem } from "@/types/participant-dashboard";

type SavedProvidersPanelProps = {
  providers: ParticipantSavedProviderItem[];
};

export function SavedProvidersPanel({ providers }: SavedProvidersPanelProps) {
  return (
    <section aria-labelledby="saved-providers-heading" className="space-y-3">
      <h2
        id="saved-providers-heading"
        className="font-heading text-lg font-semibold text-foreground"
      >
        Saved providers
      </h2>
      {providers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          Save providers from Provider Finder to reach them quickly. Your saved
          list stays private to your account.
        </p>
      ) : (
        <ul className="space-y-2">
          {providers.map((provider) => (
            <li key={provider.id}>
              <Link
                href={provider.href}
                className="block rounded-xl border border-border/60 bg-card px-4 py-3 text-sm font-medium text-primary transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {provider.providerName}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/provider-finder"
        className="inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
      >
        Browse Provider Finder
      </Link>
    </section>
  );
}
