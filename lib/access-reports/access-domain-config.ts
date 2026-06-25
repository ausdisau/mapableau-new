import type { AccessDomain, AccessRatingCategory } from "@prisma/client";

export const CATEGORY_TO_DOMAIN: Record<AccessRatingCategory, AccessDomain> = {
  accessible_parking: "mobility",
  public_transport_dropoff: "mobility",
  path_to_entrance: "mobility",
  main_entrance: "mobility",
  doorway: "mobility",
  internal_movement: "mobility",
  ramps_lifts: "mobility",
  accessible_toilet: "mobility",
  ambulant_toilet: "mobility",
  seating_furniture: "mobility",
  lighting_acoustics: "sensory",
  signage: "cognitive",
  hearing_access: "communication",
  online_information: "communication",
  service_counter: "service",
  staff_training: "service",
  service_access: "service",
};

export const ALL_ACCESS_DOMAINS: AccessDomain[] = [
  "mobility",
  "sensory",
  "communication",
  "cognitive",
  "service",
];

export const DOMAIN_LABELS: Record<AccessDomain, string> = {
  mobility: "Mobility access",
  sensory: "Sensory access",
  communication: "Communication access",
  cognitive: "Cognitive access",
  service: "Service and staff access",
};

export const DOMAIN_QUESTIONS: Record<AccessDomain, string> = {
  mobility:
    "How easy was it to move around this place with a mobility aid or wheelchair?",
  sensory:
    "How comfortable was the lighting, noise, and overall sensory environment?",
  communication:
    "How well could you communicate and receive information here?",
  cognitive:
    "How clear and easy to follow were signs, layouts, and instructions?",
  service:
    "How helpful and aware of access needs were staff and services?",
};
