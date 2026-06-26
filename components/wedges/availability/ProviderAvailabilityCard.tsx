"use client";

import { Calendar, Clock, MapPin, Phone } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatLastUpdated,
  waitlistLabel,
} from "@/lib/wedges/availability/filters";
import { AVAILABILITY_DISCLAIMER, type ProviderAvailability } from "@/types/wedges";

type ProviderAvailabilityCardProps = {
  availability: ProviderAvailability;
  providerName?: string;
  compact?: boolean;
};

export function ProviderAvailabilityCard({
  availability,
  providerName,
  compact = false,
}: ProviderAvailabilityCardProps) {
  const accepting = availability.acceptingNewParticipants;

  return (
    <Card variant="outlined" className={compact ? "p-3" : "p-4"}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          {providerName ? (
            <h3 className="font-medium">{providerName}</h3>
          ) : null}
          <p className="text-sm font-medium">
            {accepting ? "Accepting new participants" : "Not accepting new participants"}
          </p>
          <p className="text-sm text-muted-foreground">
            {waitlistLabel(availability.waitlistStatus)}
          </p>
        </div>
        <Badge variant={accepting ? "default" : "secondary"}>
          {availability.availabilityConfidence === "high"
            ? "High confidence"
            : availability.availabilityConfidence === "medium"
              ? "Medium confidence"
              : availability.availabilityConfidence === "low"
                ? "Low confidence"
                : "Unverified"}
        </Badge>
      </div>

      {!compact ? (
        <ul className="mt-3 space-y-1.5 text-sm" aria-label="Availability details">
          {availability.earliestStartDate ? (
            <li className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              Earliest start:{" "}
              {new Date(availability.earliestStartDate).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </li>
          ) : null}
          <li className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            {formatLastUpdated(availability.lastAvailabilityUpdated)}
          </li>
          {availability.suburbsServed.length > 0 ? (
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              Serves: {availability.suburbsServed.join(", ")}
            </li>
          ) : null}
        </ul>
      ) : null}

      <ul className="mt-2 flex flex-wrap gap-2 text-xs" aria-label="Service modes">
        {availability.telehealthAvailable ? (
          <li>
            <Badge variant="outline">Telehealth</Badge>
          </li>
        ) : null}
        {availability.mobileServiceAvailable ? (
          <li>
            <Badge variant="outline">Mobile service</Badge>
          </li>
        ) : null}
        {availability.weekendAvailable ? (
          <li>
            <Badge variant="outline">Weekends</Badge>
          </li>
        ) : null}
        {availability.urgentCapacity ? (
          <li>
            <Badge variant="outline">Urgent capacity</Badge>
          </li>
        ) : null}
      </ul>

      {availability.fundingTypesAccepted.length > 0 && !compact ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Funding accepted: {availability.fundingTypesAccepted.join(", ").replace(/-/g, " ")}
        </p>
      ) : null}

      <p className="mt-3 text-xs text-muted-foreground" role="note">
        {AVAILABILITY_DISCLAIMER}
      </p>
    </Card>
  );
}

export function AvailabilityLastUpdated({ isoDate }: { isoDate: string }) {
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <Phone className="h-3 w-3" aria-hidden />
      {formatLastUpdated(isoDate)}. Availability may change.
    </p>
  );
}
