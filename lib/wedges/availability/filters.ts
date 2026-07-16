import type { AvailabilityFilters, ProviderAvailability } from "@/types/wedges";

type AvailabilityWithServiceArea = ProviderAvailability & {
  serviceAreaPostcodes?: string[];
};

/**
 * Check if provider has capacity to start within 7 days.
 */
export function isAvailableThisWeek(availability: ProviderAvailability): boolean {
  if (!availability.acceptingNewParticipants) return false;
  if (availability.waitlistStatus === "closed" || availability.waitlistStatus === "long") {
    return false;
  }
  if (!availability.earliestStartDate) return availability.waitlistStatus === "none";

  const earliest = new Date(availability.earliestStartDate);
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  return earliest <= weekFromNow;
}

export function waitlistLabel(status: ProviderAvailability["waitlistStatus"]): string {
  switch (status) {
    case "none":
      return "No waitlist";
    case "short":
      return "Short waitlist";
    case "medium":
      return "Medium waitlist";
    case "long":
      return "Long waitlist";
    case "closed":
      return "Not accepting new participants";
    case "unknown":
      return "Waitlist unknown";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function formatLastUpdated(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days < 7) return `Updated ${days} days ago`;
  if (days < 30) return `Updated ${Math.floor(days / 7)} weeks ago`;
  return `Updated ${date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Australia/Sydney",
  })}`;
}

function matchesLocation(
  availability: AvailabilityWithServiceArea,
  suburb?: string,
  postcode?: string,
): boolean {
  if (postcode) {
    const serviceAreaPostcodes = availability.serviceAreaPostcodes ?? [];
    if (
      serviceAreaPostcodes.length > 0 &&
      !serviceAreaPostcodes.includes(postcode.trim())
    ) {
      return false;
    }
  }

  if (suburb && availability.suburbsServed.length > 0) {
    const normalisedSuburb = suburb.trim().toLowerCase();
    return availability.suburbsServed.some(
      (servedSuburb) => servedSuburb.trim().toLowerCase() === normalisedSuburb,
    );
  }

  return true;
}

/**
 * Filter providers by availability criteria (W1, W8).
 */
export function filterProvidersByAvailability<
  T extends { availability: AvailabilityWithServiceArea },
>(providers: T[], filters: AvailabilityFilters): T[] {
  return providers.filter(({ availability }) => {
    if (filters.availableThisWeek && !isAvailableThisWeek(availability)) return false;
    if (filters.noWaitlist && availability.waitlistStatus !== "none") return false;
    if (
      filters.shortWaitlist &&
      availability.waitlistStatus !== "short" &&
      availability.waitlistStatus !== "none"
    ) {
      return false;
    }
    if (filters.mobileService && !availability.mobileServiceAvailable) return false;
    if (filters.telehealth && !availability.telehealthAvailable) return false;
    if (filters.weekend && !availability.weekendAvailable) return false;
    if (filters.urgentCapacity && !availability.urgentCapacity) return false;
    if (
      filters.fundingType &&
      !availability.fundingTypesAccepted.includes(filters.fundingType)
    ) {
      return false;
    }
    return matchesLocation(availability, filters.suburb, filters.postcode);
  });
}
