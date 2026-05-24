import React from "react";

import type { PublicProviderService } from "@/types/provider-profile";

type ProviderServiceListProps = {
  services: PublicProviderService[];
  categories: string[];
};

export function ProviderServiceList({
  services,
  categories,
}: ProviderServiceListProps) {
  const items: PublicProviderService[] =
    services.length > 0
      ? services
      : categories.map((name, i) => ({ id: `cat-${i}`, name }));

  if (items.length === 0) {
    return (
      <section aria-labelledby="services-heading" className="space-y-2">
        <h2
          id="services-heading"
          className="font-heading text-xl font-semibold text-foreground"
        >
          Services
        </h2>
        <p className="text-sm text-muted-foreground">
          Service details have not been published yet. Contact the provider to
          ask what they offer.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="services-heading" className="space-y-3">
      <h2
        id="services-heading"
        className="font-heading text-xl font-semibold text-foreground"
      >
        Services offered
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((service) => (
          <li
            key={service.id}
            className="rounded-lg border border-border/60 bg-card px-4 py-3 text-sm"
          >
            <span className="font-medium text-foreground">{service.name}</span>
            {service.description ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {service.description}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
