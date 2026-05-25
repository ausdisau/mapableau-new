export type BotMode = "support" | "transport" | "resume";

export type Citation = {
  id: string;
  title: string;
  category: string;
  snippet: string;
};

export type BookingSummary = {
  origin: string;
  destination: string;
  date: string;
  time: string;
  passengers: string;
  accessibility: string;
  contact: string;
  reference: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "bot";
  content: string;
  citations?: Citation[];
  suggestions?: string[];
  booking?: BookingSummary;
  resumeMarkdown?: string;
};

export type TransportState = {
  origin?: string;
  destination?: string;
  date?: string;
  time?: string;
  passengers?: string;
  accessibility?: string;
  contact?: string;
};

export type ResumeState = {
  targetRole?: string;
  experience?: string;
  skills?: string;
  achievements?: string;
  education?: string;
  tone?: string;
};

type SupportArticle = Citation & {
  keywords: string[];
  answer: string;
  followUps: string[];
};

const supportArticles: SupportArticle[] = [
  {
    id: "SUP-101",
    title: "Resetting a locked account",
    category: "Account access",
    snippet:
      "Locked accounts can be restored with password reset, MFA verification, and a fresh trusted-device check.",
    keywords: ["locked", "password", "reset", "login", "mfa", "account"],
    answer:
      "Start with a password reset, then complete the MFA challenge from a trusted device. If the MFA device is unavailable, collect the account email and last successful login date before escalating to identity verification.",
    followUps: [
      "What if the user lost their MFA device?",
      "How long does account unlock take?",
      "Can I reset a password for a teammate?",
    ],
  },
  {
    id: "SUP-204",
    title: "Troubleshooting failed payments",
    category: "Billing",
    snippet:
      "Payment failures are usually caused by expired cards, bank declines, postal-code mismatch, or retry limits.",
    keywords: ["payment", "billing", "invoice", "card", "declined", "charge"],
    answer:
      "Check whether the card is expired, confirm the billing postal code, and ask the customer to authorize the charge with their bank. If two retries fail, generate a new invoice link instead of repeatedly charging the same card.",
    followUps: [
      "How do I resend an invoice link?",
      "What decline codes should be escalated?",
      "Can the customer switch payment methods?",
    ],
  },
  {
    id: "SUP-316",
    title: "Order status and delivery delays",
    category: "Orders",
    snippet:
      "Delivery status should be checked against carrier scans, promised delivery date, and weather-service advisories.",
    keywords: ["order", "delivery", "shipping", "delayed", "carrier", "tracking"],
    answer:
      "Use the carrier tracking number first, then compare the latest scan with the promised delivery date. If the carrier has no scan for 48 hours after pickup, open a missing-package investigation and offer proactive updates.",
    followUps: [
      "When can we refund shipping?",
      "How do missing-package claims work?",
      "What should I say about weather delays?",
    ],
  },
  {
    id: "SUP-427",
    title: "Changing or cancelling a booking",
    category: "Scheduling",
    snippet:
      "Bookings can be changed up to 2 hours before pickup; cancellations inside that window may carry a fee.",
    keywords: ["booking", "cancel", "reschedule", "change", "pickup", "fee"],
    answer:
      "Confirm the booking reference, requested new time, and contact number. Changes are allowed until 2 hours before pickup. Inside the 2-hour window, flag the request as urgent and warn that cancellation fees may apply.",
    followUps: [
      "What details are needed to reschedule?",
      "Can accessibility needs be changed?",
      "How are cancellation fees calculated?",
    ],
  },
];

export function welcomeMessage(mode: BotMode, username: string): ChatMessage {
  const firstName = username.trim().split(/\s+/)[0] || "there";
  const contentByMode: Record<BotMode, string> = {
    support:
      `Hi ${firstName}. Ask me about account access, billing, orders, or booking changes and I will answer from the local support knowledge base with citations.`,
    transport:
      `Hi ${firstName}. I can book a mock transport trip. Tell me the pickup point, destination, date, time, passenger count, accessibility needs, and contact info.`,
    resume:
      `Hi ${firstName}. I can turn your details into copy-ready resume markdown. Start with the target role you want, then I will ask for experience, skills, achievements, education, and tone.`,
  };

  return {
    id: crypto.randomUUID(),
    role: "bot",
    content: contentByMode[mode],
    suggestions: suggestionsForMode(mode),
  };
}

export function suggestionsForMode(mode: BotMode) {
  if (mode === "support") {
    return [
      "My payment was declined",
      "Customer cannot log in with MFA",
      "Order has no carrier scan",
    ];
  }

  if (mode === "transport") {
    return [
      "From Central Station to City Hospital tomorrow at 9am for 2 passengers. Wheelchair access. Contact sam@example.com.",
      "Pickup at Terminal 2, drop off at Harbour Hotel, Friday 18:30, 1 passenger, no accessibility needs, 555-0134.",
    ];
  }

  return [
    "Product Manager",
    "5 years in SaaS support operations",
    "Clear, confident, metric-driven tone",
  ];
}

export function respondToSupport(input: string): ChatMessage {
  const query = input.toLowerCase();
  const ranked = supportArticles
    .map((article) => ({
      article,
      score: article.keywords.reduce(
        (total, keyword) => total + (query.includes(keyword) ? 1 : 0),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score);

  const matches = ranked.filter((entry) => entry.score > 0).slice(0, 3);
  const selected = matches.length > 0 ? matches : ranked.slice(0, 2);
  const lead = selected[0].article;

  return {
    id: crypto.randomUUID(),
    role: "bot",
    content:
      matches.length > 0
        ? `${lead.answer}\n\nI found ${selected.length} relevant local article${selected.length === 1 ? "" : "s"} below.`
        : "I did not find an exact match, but these local articles are the closest starting points. Try adding words like account, payment, order, delivery, or booking.",
    citations: selected.map(({ article }) => ({
      id: article.id,
      title: article.title,
      category: article.category,
      snippet: article.snippet,
    })),
    suggestions: lead.followUps,
  };
}

export function respondToTransport(
  input: string,
  current: TransportState,
): { message: ChatMessage; state: TransportState } {
  const state = { ...current };
  const text = input.trim();

  state.origin ||= extract(text, /(?:from|pickup(?: at)?|origin(?: is)?)\s+([^,.]+?)(?=\s+(?:to|drop|destination)|[,.]|$)/i);
  state.destination ||= extract(text, /(?:to|destination(?: is)?|drop(?: off)?(?: at)?)\s+([^,.]+?)(?=\s+(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|on|at|for|with)|[,.]|$)/i);
  state.date ||= extract(text, /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/i);
  state.time ||= extract(text, /\b(\d{1,2}(?::\d{2})?\s?(?:am|pm)|\d{1,2}:\d{2})\b/i);
  state.passengers ||= extractPassenger(text);
  state.accessibility ||= detectAccessibility(text);
  state.contact ||= extract(text, /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|\+?\d[\d\s().-]{6,}\d)/i);

  const missing = nextMissingTransportField(state);

  if (!missing) {
    const booking = makeBookingSummary(state as Required<TransportState>);
    return {
      state,
      message: {
        id: crypto.randomUUID(),
        role: "bot",
        content:
          "Great, I have everything needed. Here is the mock booking summary and reference.",
        booking,
        suggestions: [
          "Change the pickup time",
          "Book another trip",
          "What accessibility options are available?",
        ],
      },
    };
  }

  return {
    state,
    message: {
      id: crypto.randomUUID(),
      role: "bot",
      content: transportPromptFor(missing, state),
      suggestions: transportSuggestionsFor(missing),
    },
  };
}

export function respondToResume(
  input: string,
  current: ResumeState,
): { message: ChatMessage; state: ResumeState } {
  const state = { ...current };
  const text = input.trim();

  state.targetRole ||= extractLabel(text, ["target role", "role"]) || nextValue(text, state, "targetRole");
  state.experience ||= extractLabel(text, ["experience", "background"]) || nextValue(text, state, "experience");
  state.skills ||= extractLabel(text, ["skills", "tools"]) || nextValue(text, state, "skills");
  state.achievements ||= extractLabel(text, ["achievements", "wins", "impact"]) || nextValue(text, state, "achievements");
  state.education ||= extractLabel(text, ["education", "degree", "certifications"]) || nextValue(text, state, "education");
  state.tone ||= extractLabel(text, ["tone", "style"]) || nextValue(text, state, "tone");

  const missing = nextMissingResumeField(state);

  if (!missing) {
    const resumeMarkdown = generateResumeMarkdown(state as Required<ResumeState>);
    return {
      state,
      message: {
        id: crypto.randomUUID(),
        role: "bot",
        content:
          "Here is a copy-friendly resume draft generated from your answers.",
        resumeMarkdown,
        suggestions: [
          "Make the tone more executive",
          "Add stronger metrics",
          "Create another version for a startup",
        ],
      },
    };
  }

  return {
    state,
    message: {
      id: crypto.randomUUID(),
      role: "bot",
      content: resumePromptFor(missing),
      suggestions: resumeSuggestionsFor(missing),
    },
  };
}

function extract(text: string, pattern: RegExp) {
  return text.match(pattern)?.[1]?.trim().replace(/\s+/g, " ");
}

function extractPassenger(text: string) {
  const explicit = text.match(/\b(\d{1,2})\s*(?:passengers?|people|riders|pax)\b/i);
  if (explicit?.[1]) return explicit[1];

  return text.match(/\bfor\s+(\d{1,2})\b/i)?.[1];
}

function detectAccessibility(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("wheelchair")) return "Wheelchair accessible vehicle";
  if (lower.includes("service animal")) return "Service animal supported";
  if (lower.includes("child seat") || lower.includes("booster")) {
    return "Child seat requested";
  }
  if (lower.includes("no accessibility") || lower.includes("none")) {
    return "No accessibility needs";
  }
  if (lower.includes("accessibility") || lower.includes("accessible")) {
    return "Accessibility support requested";
  }
}

function nextMissingTransportField(state: TransportState) {
  return (
    (["origin", "destination", "date", "time", "passengers", "accessibility", "contact"] as const).find(
      (field) => !state[field],
    ) ?? null
  );
}

function transportPromptFor(
  field: NonNullable<ReturnType<typeof nextMissingTransportField>>,
  state: TransportState,
) {
  const known = Object.entries(state)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
  const prefix = known ? `Captured so far: ${known}.\n\n` : "";
  const prompts: Record<typeof field, string> = {
    origin: "Where should the driver pick you up?",
    destination: "What is the destination?",
    date: "What date should I book for? Today, tomorrow, a weekday, or a numeric date all work.",
    time: "What pickup time should I use?",
    passengers: "How many passengers will ride?",
    accessibility:
      "Any accessibility needs, such as wheelchair access, child seat, service animal support, or none?",
    contact: "What phone number or email should be attached to the booking?",
  };

  return `${prefix}${prompts[field]}`;
}

function transportSuggestionsFor(
  field: NonNullable<ReturnType<typeof nextMissingTransportField>>,
) {
  const suggestions: Record<typeof field, string[]> = {
    origin: ["Pickup at Central Station", "From Terminal 2"],
    destination: ["To City Hospital", "Drop off at Harbour Hotel"],
    date: ["Tomorrow", "Friday", "2026-06-02"],
    time: ["9:00am", "18:30"],
    passengers: ["2 passengers", "For 1 passenger"],
    accessibility: ["Wheelchair access", "No accessibility needs"],
    contact: ["sam@example.com", "555-0134"],
  };

  return suggestions[field];
}

function makeBookingSummary(state: Required<TransportState>): BookingSummary {
  const reference = `TR-${hashParts([
    state.origin,
    state.destination,
    state.date,
    state.time,
    state.contact,
  ])}`;

  return { ...state, reference };
}

function hashParts(parts: string[]) {
  const hash = parts
    .join("|")
    .split("")
    .reduce((total, char) => (total * 31 + char.charCodeAt(0)) % 1000000, 7);

  return hash.toString().padStart(6, "0");
}

function nextMissingResumeField(state: ResumeState) {
  return (
    (["targetRole", "experience", "skills", "achievements", "education", "tone"] as const).find(
      (field) => !state[field],
    ) ?? null
  );
}

function nextValue(text: string, state: ResumeState, field: keyof ResumeState) {
  const missing = nextMissingResumeField(state);
  return missing === field ? text : undefined;
}

function extractLabel(text: string, labels: string[]) {
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}\\s*:\\s*([^\\n]+)`, "i"));
    if (match?.[1]) return match[1].trim();
  }
}

function resumePromptFor(
  field: NonNullable<ReturnType<typeof nextMissingResumeField>>,
) {
  const prompts: Record<typeof field, string> = {
    targetRole: "What target role should this resume aim for?",
    experience:
      "Summarize your relevant experience, including years, industries, and standout responsibilities.",
    skills: "List the skills, tools, and strengths you want highlighted.",
    achievements:
      "Share 2-4 achievements with numbers if you have them, such as saved hours, revenue, CSAT, or growth.",
    education:
      "Add education, certifications, bootcamps, or professional training.",
    tone: "What tone should I use: concise, executive, warm, technical, bold, or something else?",
  };

  return prompts[field];
}

function resumeSuggestionsFor(
  field: NonNullable<ReturnType<typeof nextMissingResumeField>>,
) {
  const suggestions: Record<typeof field, string[]> = {
    targetRole: ["Customer Success Manager", "Operations Analyst", "Frontend Engineer"],
    experience: [
      "5 years in SaaS support and onboarding",
      "Led transport dispatch operations for a regional team",
    ],
    skills: ["SQL, Zendesk, process improvement, stakeholder management", "React, TypeScript, accessibility, design systems"],
    achievements: [
      "Reduced response time 34% and lifted CSAT from 88% to 94%",
      "Automated weekly reporting and saved 8 hours per week",
    ],
    education: ["B.A. Communications, Google Project Management Certificate", "Computer Science diploma"],
    tone: ["Concise and metric-driven", "Warm, polished, and human"],
  };

  return suggestions[field];
}

function generateResumeMarkdown(state: Required<ResumeState>) {
  const skills = splitList(state.skills);
  const achievements = splitList(state.achievements);
  const tone = state.tone.toLowerCase();
  const opener = tone.includes("executive")
    ? "Strategic"
    : tone.includes("warm")
      ? "Collaborative"
      : tone.includes("technical")
        ? "Technically fluent"
        : "Results-driven";

  const bullets = achievements
    .map((achievement) => `- ${strengthenBullet(achievement, state.targetRole)}`)
    .join("\n");

  return `# ${state.targetRole}\n\n## Professional Summary\n${opener} ${state.targetRole.toLowerCase()} candidate with ${state.experience}. Known for combining ${skills.slice(0, 3).join(", ")} with practical execution and measurable outcomes.\n\n## Experience Highlights\n${bullets}\n- Applied ${skills.slice(0, 4).join(", ")} to solve customer and business problems with a ${state.tone.toLowerCase()} communication style.\n\n## Core Skills\n${skills.map((skill) => `- ${skill}`).join("\n")}\n\n## Education & Credentials\n${state.education}\n`;
}

function splitList(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function strengthenBullet(achievement: string, role: string) {
  const trimmed = achievement.replace(/^[-*]\s*/, "");
  return /^(led|built|reduced|increased|improved|created|managed|launched|automated)/i.test(
    trimmed,
  )
    ? trimmed
    : `Delivered ${trimmed} for ${role.toLowerCase()} outcomes`;
}
