import { assessMentalHealthSafety } from "@/lib/ask-mapable";
import { isBookingServicesAgentConfigured } from "@/lib/config/booking-services-agent";

const BOOKING_LOOKUP =
  /\b(my\s+booking|my\s+bookings|next\s+visit|upcoming\s+(care|transport|booking)|booking\s+status|when\s+is\s+my|show\s+my\s+bookings|pending\s+bookings|service\s+log|missing\s+service\s+logs)\b/i;

export function isBookingLookupQuery(query: string): boolean {
  return BOOKING_LOOKUP.test(query.trim());
}

export function shouldRouteToBookingAgent(query: string): boolean {
  const safety = assessMentalHealthSafety(query);
  if (
    safety.state === "suicidal_concern" ||
    safety.state === "immediate_danger"
  ) {
    return false;
  }

  return isBookingServicesAgentConfigured() && isBookingLookupQuery(query);
}
