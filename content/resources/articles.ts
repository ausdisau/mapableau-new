export type ResourceArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  reviewedAt: string;
  cta?: { label: string; href: string };
  body: string[];
};

export const resourceArticles: ResourceArticle[] = [
  {
    slug: "how-to-check-venue-accessibility",
    title: "How to check whether a venue is actually accessible",
    excerpt: "Practical checks beyond a wheelchair icon on a website.",
    category: "Accessible places",
    author: "MapAble editorial",
    reviewedAt: "2026-06-01",
    cta: { label: "Browse the map", href: "/access/map" },
    body: [
      "Start with step-free entry, door width, and toilet access — not just parking availability.",
      "Look for recent community reports with dates. Access conditions change after renovations.",
      "Ask about sensory environment if noise, lighting, or crowds affect you.",
    ],
  },
  {
    slug: "planning-accessible-trip-care-transport",
    title: "Planning an accessible trip with care and transport together",
    excerpt: "Coordinate support shifts and pickup windows with less stress.",
    category: "Accessible transport",
    author: "MapAble editorial",
    reviewedAt: "2026-06-01",
    cta: { label: "Try the demo", href: "/demo/care-transport" },
    body: [
      "Confirm appointment start time, then work backwards for pickup buffers.",
      "Share vehicle access needs early — ramp width, power chair space, or low-sensory options.",
      "Keep a written summary you can edit before confirming with providers.",
    ],
  },
  {
    slug: "what-to-ask-before-booking-support-worker",
    title: "What to ask before booking a support worker",
    excerpt: "Questions that protect your choice and control.",
    category: "Finding support workers",
    author: "MapAble editorial",
    reviewedAt: "2026-06-01",
    cta: { label: "Register interest", href: "/early-access" },
    body: [
      "Ask about experience with your access needs, not just qualifications.",
      "Confirm cancellation, travel, and documentation processes up front.",
      "Use consent settings to control what is shared with providers.",
    ],
  },
  {
    slug: "inclusive-employers-accessible-interviews",
    title: "How inclusive employers can prepare for accessible interviews",
    excerpt: "Practical steps without tokenistic language.",
    category: "Inclusive employment",
    author: "MapAble editorial",
    reviewedAt: "2026-06-01",
    cta: { label: "Employer info", href: "/employers" },
    body: [
      "Publish how candidates can request adjustments before the interview.",
      "Confirm step-free access, quiet waiting areas, and communication supports.",
      "Only request health or disability details when necessary and with consent.",
    ],
  },
  {
    slug: "how-mapable-mapping-days-work",
    title: "How MapAble mapping days work",
    excerpt: "Community-powered access data with moderation and safety.",
    category: "MapAble mapping days",
    author: "MapAble editorial",
    reviewedAt: "2026-06-01",
    cta: { label: "Join early access", href: "/early-access" },
    body: [
      "Reviewers use structured forms for entries, toilets, sensory notes, and more.",
      "Reports are timestamped and moderated before they influence confidence scores.",
      "Venue owners can claim listings and submit updates for review.",
    ],
  },
  {
    slug: "understanding-access-needs",
    title: "Understanding access needs in plain English",
    excerpt: "Shared language for participants, carers, and providers.",
    category: "Venue accessibility guides",
    author: "MapAble editorial",
    reviewedAt: "2026-06-01",
    cta: { label: "Read accessibility statement", href: "/accessibility-statement" },
    body: [
      "Access needs describe what helps someone use a service or place — not a diagnosis.",
      "Needs can be mobility, sensory, communication, cognitive, or chronic illness related.",
      "Consent controls what is shared, when, and with whom.",
    ],
  },
];

export function getResourceBySlug(slug: string) {
  return resourceArticles.find((article) => article.slug === slug);
}
