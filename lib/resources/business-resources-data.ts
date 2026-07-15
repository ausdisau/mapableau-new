import type {
  BusinessBarrierType,
  BusinessResource,
  BusinessResourceAudience,
  BusinessResourceFormat,
} from "@/types/business-resource";
import {
  BUSINESS_RESOURCES_DISCLAIMER,
  BUSINESS_RESOURCES_TRUST_NOTE,
} from "@/types/business-resource";

export {
  BUSINESS_RESOURCES_DISCLAIMER,
  BUSINESS_RESOURCES_TRUST_NOTE,
};

export type BusinessBarrierCategory = {
  id: BusinessBarrierType;
  title: string;
  summary: string;
};

export const businessBarrierCategories: BusinessBarrierCategory[] = [
  {
    id: "physical",
    title: "Physical access",
    summary: "Entrances, steps, ramps, door width, paths and seating.",
  },
  {
    id: "toilet",
    title: "Toilet access",
    summary: "Location, signage, step-free entry and adult-change needs.",
  },
  {
    id: "sensory",
    title: "Sensory access",
    summary: "Noise, lighting, crowding and quieter times or spaces.",
  },
  {
    id: "communication",
    title: "Communication access",
    summary: "Clear language, alternate formats and staff responses.",
  },
  {
    id: "digital",
    title: "Digital access",
    summary: "Website, booking forms and published access information.",
  },
  {
    id: "transport",
    title: "Transport access",
    summary: "Drop-off, parking, public transport and arrival notes.",
  },
  {
    id: "attitudinal",
    title: "Attitudinal barriers",
    summary: "Assumptions, rushed service and unhelpful gatekeeping.",
  },
  {
    id: "employment",
    title: "Employment barriers",
    summary: "Hiring, adjustments and workplace access conversations.",
  },
  {
    id: "pricing",
    title: "Pricing barriers",
    summary: "Companion ticket, support-person and fee transparency.",
  },
  {
    id: "feedback",
    title: "Feedback barriers",
    summary: "How people report issues and how updates are shared.",
  },
];

function guideHref(slug: string) {
  return `/resources/business/${slug}`;
}

function section(
  id: string,
  title: string,
  paragraphs: string[],
  bullets?: string[],
) {
  return { id, title, paragraphs, bullets };
}

/**
 * Catalogue of Business Access Resources.
 * Template-driven pages read sections from this module.
 */
export const businessResources: BusinessResource[] = [
  {
    id: "access-barrier-self-check",
    slug: "access-barrier-self-check",
    title: "15-Minute Access Barrier Self-Check",
    summary:
      "A short self-check of entrance, path, toilet, sensory and digital access features — plus low-cost fixes and next steps.",
    audience: ["businesses", "venues", "providers", "employers"],
    category: "Self-check",
    format: "self-check",
    barrierTypes: [
      "physical",
      "toilet",
      "sensory",
      "digital",
      "communication",
      "feedback",
    ],
    cta: "Start the self-check",
    href: guideHref("access-barrier-self-check"),
    status: "available",
    featured: true,
    sections: [
      section(
        "how-it-works",
        "How this self-check works",
        [
          "Answer practical questions about your space and service. You will get strengths, top barriers to reduce, low-cost fixes and next steps.",
          "This is a readiness and planning tool. It is not a formal assessment or legal compliance certificate.",
        ],
      ),
    ],
  },
  {
    id: "venue-accessibility-self-check",
    slug: "venue-accessibility-self-check",
    title: "Venue Accessibility Self-Check",
    summary:
      "A venue-focused walkthrough for arrivals, movement, toilets, seating and published access notes.",
    audience: ["venues", "businesses", "event-organisers"],
    category: "Self-check",
    format: "self-check",
    barrierTypes: ["physical", "toilet", "sensory", "transport", "digital"],
    cta: "Open venue self-check",
    href: guideHref("venue-accessibility-self-check"),
    status: "available",
    featured: true,
    sections: [
      section(
        "walkthrough",
        "What to walk through",
        [
          "Treat this as a short observational walk with a colleague. Note what is known, what is uncertain, and what guests still need to ask for on the day.",
        ],
        [
          "From parking or drop-off to the main entrance",
          "Door, threshold and reception path",
          "Accessible toilet route and signage",
          "Seating, counter height and queueing",
          "Where access information is published online",
        ],
      ),
      section(
        "publish",
        "Publish what you know",
        [
          "Honest access notes help people plan. Avoid “fully accessible” claims. Describe features, limits and who to contact for updates.",
        ],
      ),
    ],
  },
  {
    id: "accessible-entrance-and-path",
    slug: "accessible-entrance-and-path",
    title: "Accessible Entrance & Path Guide",
    summary:
      "Practical notes for entrances, thresholds, door widths, ramps and clear paths of travel.",
    audience: ["venues", "businesses", "providers"],
    category: "Physical access",
    format: "guide",
    barrierTypes: ["physical", "transport"],
    cta: "Read entrance guide",
    href: guideHref("accessible-entrance-and-path"),
    status: "available",
    featured: false,
    sections: [
      section(
        "entrance",
        "Entrance basics",
        [
          "People often decide whether to enter based on the first few metres. Steps, steep thresholds, heavy doors and unclear alternate entries are common barriers.",
        ],
        [
          "Describe the main entrance and any step-free entrance clearly",
          "Note doorbell, intercom or staff assistance options",
          "Keep temporary stock and sandwich boards out of clear paths",
          "If a portable ramp is used, document who sets it up and how to request it",
        ],
      ),
      section(
        "path",
        "Path of travel",
        [
          "A usable path stays clear, well lit and predictable. Sudden level changes, loose mats and narrow aisles create avoidable friction.",
        ],
      ),
    ],
  },
  {
    id: "accessible-toilet-information",
    slug: "accessible-toilet-information",
    title: "Accessible Toilet Information Guide",
    summary:
      "How to describe toilet location, step-free entry, fixtures and Changing Places needs without overclaiming.",
    audience: ["venues", "businesses", "event-organisers"],
    category: "Toilet access",
    format: "guide",
    barrierTypes: ["toilet", "communication", "digital"],
    cta: "Read toilet guide",
    href: guideHref("accessible-toilet-information"),
    status: "available",
    featured: false,
    sections: [
      section(
        "describe",
        "Describe toilets clearly",
        [
          "People plan visits around reliable toilet access. Publish location, hours, keypad notes and whether staff can unlock a facility.",
        ],
        [
          "Distance or directions from reception",
          "Step-free route notes",
          "Adult change or Changing Places availability if known",
          "What is unverified and how to ask for an update",
        ],
      ),
      section(
        "avoid",
        "Avoid overclaiming",
        [
          "Do not say a toilet is “compliant” unless a qualified assessment supports that wording. Practical features and limitations are more useful than marketing labels.",
        ],
      ),
    ],
  },
  {
    id: "sensory-friendly-business",
    slug: "sensory-friendly-business",
    title: "Sensory-Friendly Business Guide",
    summary:
      "Low-cost ideas for quieter times, lighting choices, wait-management and calm customer journeys.",
    audience: ["businesses", "venues", "providers", "event-organisers"],
    category: "Sensory access",
    format: "guide",
    barrierTypes: ["sensory", "communication", "attitudinal"],
    cta: "Read sensory guide",
    href: guideHref("sensory-friendly-business"),
    status: "available",
    featured: true,
    sections: [
      section(
        "quick-wins",
        "Quick sensory wins",
        [
          "Sensory load often rises from noise, glare, strong smells, unpredictable queues and crowded spaces. Small operational changes can help.",
        ],
        [
          "Offer a quieter visiting window when possible",
          "Reduce simultaneous music, screens and announcements",
          "Provide a calmer waiting option away from the main queue",
          "Let people request lower lighting or seating with a wall behind them",
        ],
      ),
      section(
        "language",
        "Careful language",
        [
          "“Sensory-friendly” should describe specific practices. It does not mean everyone will find the space calm, and it is not a medical claim.",
        ],
      ),
    ],
  },
  {
    id: "accessible-customer-service",
    slug: "accessible-customer-service",
    title: "Accessible Customer Service Guide",
    summary:
      "Plain-language service habits that reduce attitudinal and communication barriers at the counter.",
    audience: ["businesses", "venues", "providers", "employers"],
    category: "Customer service",
    format: "guide",
    barrierTypes: ["communication", "attitudinal", "feedback"],
    cta: "Read service guide",
    href: guideHref("accessible-customer-service"),
    status: "available",
    featured: false,
    sections: [
      section(
        "habits",
        "Service habits that help",
        [
          "Accessible service is mostly about pace, clarity and respect. Ask, listen, adapt and follow through.",
        ],
        [
          "Speak to the customer directly, not only to a support person",
          "Offer written or verbal options when useful",
          "Allow more time without treating someone as a problem",
          "Do not touch mobility aids without permission",
          "Escalate access issues to a named contact when needed",
        ],
      ),
    ],
  },
  {
    id: "digital-access-checklist",
    slug: "digital-access-checklist",
    title: "Digital Access Checklist",
    summary:
      "A practical checklist for websites, booking flows and publishing access information people can use.",
    audience: ["businesses", "venues", "providers", "employers"],
    category: "Digital access",
    format: "checklist",
    barrierTypes: ["digital", "communication", "feedback"],
    cta: "Open digital checklist",
    href: guideHref("digital-access-checklist"),
    status: "available",
    featured: false,
    sections: [
      section(
        "checklist",
        "Digital access checklist",
        ["Use this as a self-check for your public site and booking tools."],
        [
          "Access information is easy to find from the home page or visit page",
          "Photos or short notes describe entrance, toilet and parking when known",
          "Forms can be completed with keyboard and screen-reader-friendly labels",
          "Colour contrast and text size are readable",
          "Contact or feedback options are visible and monitored",
          "PDF-only critical info is also available as HTML where possible",
        ],
      ),
    ],
  },
  {
    id: "accessibility-statement-generator",
    slug: "accessibility-statement-generator",
    title: "Access Statement Generator",
    summary:
      "Draft a plain-language accessibility statement that describes what is known, what is limited and who to contact.",
    audience: ["businesses", "venues", "providers", "employers"],
    category: "Communication",
    format: "generator",
    barrierTypes: ["communication", "digital", "feedback"],
    cta: "Create a statement",
    href: guideHref("accessibility-statement-generator"),
    status: "available",
    featured: true,
    sections: [
      section(
        "purpose",
        "What a useful statement does",
        [
          "A useful accessibility statement helps people plan. It should be honest, specific and easy to update — not a claim of legal compliance.",
        ],
      ),
    ],
  },
  {
    id: "accessible-events",
    slug: "accessible-events",
    title: "Accessible Events Checklist",
    summary:
      "Planning prompts for venues, flow, toilets, sensory load, communication and staff briefing.",
    audience: ["event-organisers", "venues", "businesses"],
    category: "Events",
    format: "checklist",
    barrierTypes: [
      "physical",
      "toilet",
      "sensory",
      "communication",
      "transport",
      "pricing",
      "feedback",
    ],
    cta: "Open events checklist",
    href: guideHref("accessible-events"),
    status: "available",
    featured: false,
    sections: [
      section(
        "before",
        "Before the event",
        [
          "Publish access notes early, then keep a feedback channel open during and after the event.",
        ],
        [
          "Step-free routes and temporary obstacle plans",
          "Accessible toilets and adult-change options",
          "Quiet or lower-sensory areas if offered",
          "Companion or support-person ticketing clarity",
          "Staff briefing on assistance requests",
        ],
      ),
    ],
  },
  {
    id: "inclusive-hiring",
    slug: "inclusive-hiring",
    title: "Inclusive Hiring Starter Kit",
    summary:
      "Practical hiring prompts to reduce employment barriers without turning hiring into medical gatekeeping.",
    audience: ["employers", "businesses", "providers"],
    category: "Employment",
    format: "kit",
    barrierTypes: ["employment", "communication", "attitudinal", "digital"],
    cta: "Open hiring kit",
    href: guideHref("inclusive-hiring"),
    status: "available",
    featured: false,
    sections: [
      section(
        "hiring",
        "Inclusive hiring starters",
        [
          "Focus on the inherent requirements of the role and how adjustments can be discussed safely. Avoid fishing for medical detail.",
        ],
        [
          "Write job ads in plain language",
          "Offer alternate application formats when reasonable",
          "Describe interview access options early",
          "Separate merit assessment from adjustment conversations",
          "Keep records minimal and role-relevant",
        ],
      ),
    ],
  },
  {
    id: "workplace-adjustments",
    slug: "workplace-adjustments",
    title: "Workplace Adjustments Conversation Guide",
    summary:
      "A calm structure for discussing workplace adjustments with staff and managers.",
    audience: ["employers", "businesses", "providers"],
    category: "Employment",
    format: "guide",
    barrierTypes: ["employment", "communication", "attitudinal"],
    cta: "Open conversation guide",
    href: guideHref("workplace-adjustments"),
    status: "available",
    featured: false,
    sections: [
      section(
        "conversation",
        "Conversation structure",
        [
          "Keep the conversation practical: what helps, what is needed for the work, who owns follow-up, and when to review.",
        ],
        [
          "Ask what is getting in the way of the work",
          "Explore adjustments before assuming an outcome",
          "Agree a review date",
          "Document only what is needed to implement the change",
        ],
      ),
    ],
  },
  {
    id: "complaints-and-access-feedback",
    slug: "complaints-and-access-feedback",
    title: "Complaint & Access Update Playbook",
    summary:
      "A simple process for receiving access feedback, fixing issues and telling customers what changed.",
    audience: ["businesses", "venues", "providers", "employers", "event-organisers"],
    category: "Feedback",
    format: "playbook",
    barrierTypes: ["feedback", "communication", "attitudinal"],
    cta: "Open playbook",
    href: guideHref("complaints-and-access-feedback"),
    status: "available",
    featured: false,
    sections: [
      section(
        "playbook",
        "Feedback playbook",
        [
          "Access feedback is valuable operational data. Make it easy to report, acknowledge quickly and close the loop.",
        ],
        [
          "Publish one clear feedback channel",
          "Acknowledge receipt within a stated timeframe",
          "Separate urgent safety issues from general access notes",
          "Update public access information when a fix lands",
          "Thank reporters without requiring them to educate staff at length",
        ],
      ),
    ],
  },
  {
    id: "accreditation-readiness",
    slug: "accreditation-readiness",
    title: "MapAble Accreditation Readiness Guide",
    summary:
      "How to prepare evidence and access notes for MapAble Accreditation conversations — readiness, not a legal certificate.",
    audience: ["businesses", "venues", "providers"],
    category: "Accreditation",
    format: "guide",
    barrierTypes: ["physical", "toilet", "sensory", "digital", "feedback"],
    cta: "Read readiness guide",
    href: guideHref("accreditation-readiness"),
    status: "available",
    featured: false,
    sections: [
      section(
        "readiness",
        "What readiness means",
        [
          "MapAble Accreditation readiness is about organised access information, honest gaps and improvement actions. It is not a legal compliance certificate and does not replace building, safety or professional advice.",
        ],
        [
          "Up-to-date entrance, toilet and transport notes",
          "Photos or diagrams where they genuinely help planning",
          "A named feedback contact",
          "Evidence of recent improvements or open mapping missions",
          "Staff briefing notes for common access requests",
        ],
      ),
    ],
  },
];

export function getBusinessResourceBySlug(
  slug: string,
): BusinessResource | undefined {
  return businessResources.find((resource) => resource.slug === slug);
}

export function getFeaturedBusinessResources(): BusinessResource[] {
  return businessResources.filter((resource) => resource.featured);
}

export type BusinessResourceFilterInput = {
  query?: string;
  audience?: BusinessResourceAudience | null;
  format?: BusinessResourceFormat | null;
  barrier?: BusinessBarrierType | null;
};

export function filterBusinessResources(
  input: BusinessResourceFilterInput = {},
): BusinessResource[] {
  const query = input.query?.trim().toLowerCase() ?? "";
  return businessResources.filter((resource) => {
    if (input.audience && !resource.audience.includes(input.audience)) {
      return false;
    }
    if (input.format && resource.format !== input.format) return false;
    if (input.barrier && !resource.barrierTypes.includes(input.barrier)) {
      return false;
    }
    if (!query) return true;
    const haystack = [
      resource.title,
      resource.summary,
      resource.category,
      ...resource.audience,
      ...resource.barrierTypes,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

export function formatBusinessAudience(
  audience: BusinessResourceAudience,
): string {
  switch (audience) {
    case "businesses":
      return "Businesses";
    case "venues":
      return "Venues";
    case "providers":
      return "Providers";
    case "employers":
      return "Employers";
    case "event-organisers":
      return "Event organisers";
    default: {
      const _exhaustive: never = audience;
      return _exhaustive;
    }
  }
}

export function formatBusinessBarrier(barrier: BusinessBarrierType): string {
  const match = businessBarrierCategories.find((item) => item.id === barrier);
  return match?.title ?? barrier;
}

export function formatBusinessFormat(format: BusinessResourceFormat): string {
  switch (format) {
    case "self-check":
      return "Self-check";
    case "guide":
      return "Guide";
    case "checklist":
      return "Checklist";
    case "generator":
      return "Generator";
    case "playbook":
      return "Playbook";
    case "kit":
      return "Starter kit";
    default: {
      const _exhaustive: never = format;
      return _exhaustive;
    }
  }
}

export const businessResourceExternalLinks = [
  {
    id: "for-providers",
    label: "For providers",
    href: "/for-providers",
    note: "Register interest and review MapAble provider pathways.",
  },
  {
    id: "guides",
    label: "Access Guides",
    href: "/guides",
    note: "City and town access planning guides for visitors and locals.",
  },
  {
    id: "access",
    label: "MapAble Access",
    href: "/access",
    note: "Participant-controlled access notes and venue context.",
  },
  {
    id: "employment",
    label: "MapAble Employment",
    href: "/employment",
    note: "Workplace access context and employment support pathways.",
  },
];
