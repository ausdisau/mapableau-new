import Link from "next/link";
import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";
import { BUSINESS_RESOURCES_TRUST_NOTE } from "@/lib/resources/business-resources-data";

export function BusinessResourcesHero() {
  return (
    <header className="border-b border-slate-200 bg-[#F6FBFC]">
      <div className={`${mapablePublicPageContainerClass} py-14 sm:py-20`}>
        <p className={mapablePublicEyebrowClass}>Business Access Resources</p>
        <h1 className={`${mapablePublicTitleClass} mt-3`}>
          Reduce access barriers at your business
        </h1>
        <p className={mapablePublicLeadClass}>
          Practical MapAble resources to help businesses, venues, providers and
          employers make their spaces, services and information easier for
          people with disability to use.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/resources/business/access-barrier-self-check"
            className={`${mapablePublicPrimaryButtonClass} ${mapableCareFocusRing}`}
          >
            Start the 15-minute access self-check
          </Link>
          <Link
            href="/resources/business/accessibility-statement-generator"
            className={`${mapablePublicSecondaryButtonClass} ${mapableCareFocusRing}`}
          >
            Create an accessibility statement
          </Link>
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-600">
          {BUSINESS_RESOURCES_TRUST_NOTE}
        </p>
      </div>
    </header>
  );
}
