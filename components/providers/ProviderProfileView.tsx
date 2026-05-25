import React from "react";
import Link from "next/link";
import { Clock, Globe, Mail, Phone } from "lucide-react";

import { ProviderAccessFeatures } from "@/components/providers/ProviderAccessFeatures";
import { ProviderLocationsMap } from "@/components/providers/ProviderLocationsMap";
import { ProviderProfileHeader } from "@/components/providers/ProviderProfileHeader";
import { ProviderRequestSupportButton } from "@/components/providers/ProviderRequestSupportButton";
import { ProviderReviews } from "@/components/providers/ProviderReviews";
import { ProviderServiceList } from "@/components/providers/ProviderServiceList";
import { ProviderVerificationPanel } from "@/components/providers/ProviderVerificationPanel";
import type { PublicProviderProfile } from "@/types/provider-profile";

type ProviderProfileViewProps = {
  profile: PublicProviderProfile;
};

export function ProviderProfileView({ profile }: ProviderProfileViewProps) {
  const { contact } = profile;

  return (
    <article className="space-y-10">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link
          href="/provider-finder"
          className="font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          ← Back to Provider Finder
        </Link>
      </nav>

      <ProviderProfileHeader profile={profile} />

      <ProviderVerificationPanel
        label={profile.verificationLabel}
        display={profile.verificationDisplay}
        ndisRegistered={profile.ndisRegistered}
        ndisNumber={profile.ndisNumber}
        showWarning={profile.showUnverifiedWarning}
      />

      {profile.canRequestSupport ? (
        <ProviderRequestSupportButton
          providerId={profile.id}
          providerName={profile.name}
          slug={profile.slug}
        />
      ) : null}

      <ProviderServiceList
        services={profile.services}
        categories={profile.categories}
      />

      <ProviderAccessFeatures
        accessFeatures={profile.accessFeatures}
        supports={profile.supports}
        languages={profile.languages}
      />

      <ProviderLocationsMap
        regions={profile.regions}
        latitude={profile.latitude}
        longitude={profile.longitude}
        providerName={profile.name}
      />

      {(contact.phone || contact.email || contact.website || contact.abn) && (
        <section aria-labelledby="contact-heading" className="space-y-3">
          <h2
            id="contact-heading"
            className="font-heading text-xl font-semibold text-foreground"
          >
            Contact
          </h2>
          <ul className="space-y-3 text-sm">
            {contact.phone ? (
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  {contact.phone}
                </a>
              </li>
            ) : null}
            {contact.email ? (
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <a
                  href={`mailto:${contact.email}`}
                  className="break-all text-primary underline-offset-2 hover:underline"
                >
                  {contact.email}
                </a>
              </li>
            ) : null}
            {contact.website ? (
              <li className="flex items-start gap-3">
                <Globe className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <a
                  href={
                    contact.website.startsWith("http")
                      ? contact.website
                      : `https://${contact.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-primary underline-offset-2 hover:underline"
                >
                  {contact.website}
                </a>
              </li>
            ) : null}
            {contact.abn ? (
              <li className="text-muted-foreground">
                <span className="font-medium text-foreground">ABN: </span>
                {contact.abn}
              </li>
            ) : null}
          </ul>
        </section>
      )}

      {profile.openingHours ? (
        <section aria-labelledby="hours-heading" className="space-y-3">
          <h2
            id="hours-heading"
            className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground"
          >
            <Clock className="h-5 w-5" aria-hidden />
            Opening hours
          </h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {profile.openingHours.replace(/,/g, "\n")}
          </p>
        </section>
      ) : null}

      <ProviderReviews
        rating={profile.rating}
        reviewCount={profile.reviewCount}
        reviews={profile.reviews}
      />
    </article>
  );
}
