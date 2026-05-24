import React from "react";

import {
  MAPABLE_ABN_DISPLAY,
  MAPABLE_LOCATION,
  MAPABLE_NDIS_REGISTRATION,
  MAPABLE_SUPPORT_EMAIL,
  MAPABLE_SUPPORT_PHONE,
  MAPABLE_SUPPORT_PHONE_HREF,
} from "@/lib/brand/constants";

export function FooterRegistrationDetails() {
  return (
    <dl className="mapable-soft space-y-2 text-sm text-slate-600">
      <div>
        <dt className="sr-only">Australian Business Number</dt>
        <dd>{MAPABLE_ABN_DISPLAY}</dd>
      </div>
      <div>
        <dt className="font-medium text-mapable-navy">NDIS Registration Number</dt>
        <dd>{MAPABLE_NDIS_REGISTRATION}</dd>
      </div>
      <div>
        <dt className="sr-only">Email</dt>
        <dd>
          <a
            href={`mailto:${MAPABLE_SUPPORT_EMAIL}`}
            className="mapable-focus-ring rounded text-mapable-blue hover:underline"
          >
            {MAPABLE_SUPPORT_EMAIL}
          </a>
        </dd>
      </div>
      <div>
        <dt className="sr-only">Phone</dt>
        <dd>
          <a
            href={MAPABLE_SUPPORT_PHONE_HREF}
            className="mapable-focus-ring rounded text-mapable-blue hover:underline"
          >
            {MAPABLE_SUPPORT_PHONE}
          </a>
        </dd>
      </div>
      <div>
        <dt className="sr-only">Location</dt>
        <dd>{MAPABLE_LOCATION}</dd>
      </div>
    </dl>
  );
}
