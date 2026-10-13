import { getCategoryEntry } from "./registry";
import type {
  AgencyMemoryControls,
  MapAbleAgencyMemoryItem,
  MemoryConflict,
  PreferenceGraph,
} from "./types";

export type AgencyMemoryPresentationSection = {
  id: string;
  title: string;
  body: string;
  items?: Array<{
    memoryId: string;
    statement: string;
    categoryLabel: string;
    state: string;
    why: string;
    whereUsed: string;
    whoCanSee: string;
    source: string;
    editable: boolean;
    deletable: boolean;
  }>;
};

export type AgencyMemoryPresentation = {
  title: string;
  summary: string;
  sections: AgencyMemoryPresentationSection[];
  controls: {
    personalisationPaused: boolean;
    aiUseDisabled: boolean;
    note: string;
  };
};

function whyText(item: MapAbleAgencyMemoryItem): string {
  switch (item.source) {
    case "participant_explicit":
      return "You told MapAble this directly.";
    case "participant_confirmed":
      return "You confirmed this after it was proposed.";
    case "delegate_proposed":
      return "Someone you authorised proposed this — it is not used until you confirm.";
    case "system_proposed":
      return "MapAble proposed this from a known setting — it is not used until you confirm.";
    case "model_proposed":
      return "An AI suggestion only — never used as your preference until you confirm.";
    default: {
      const _never: never = item.source;
      void _never;
      return "Source unknown.";
    }
  }
}

function whereUsedText(item: MapAbleAgencyMemoryItem): string {
  if (item.confirmationState !== "confirmed") {
    return "Not used for personalisation yet.";
  }
  if (item.purpose) {
    return `Only for the purpose: ${item.purpose}.`;
  }
  return `May guide ${getCategoryEntry(item.category).label.toLowerCase()} planning when you allow personalisation.`;
}

function whoCanSeeText(item: MapAbleAgencyMemoryItem): string {
  switch (item.visibility) {
    case "participant_only":
      return "Only you.";
    case "participant_and_authorised_delegate":
      return "You and people you have authorised.";
    case "mission_scoped":
      return "You, and only within missions you start.";
    default: {
      const _never: never = item.visibility;
      void _never;
      return "Restricted.";
    }
  }
}

export function formatAgencyMemoryForParticipant(input: {
  items: MapAbleAgencyMemoryItem[];
  graph: PreferenceGraph;
  controls: AgencyMemoryControls;
  conflicts: MemoryConflict[];
}): AgencyMemoryPresentation {
  const active = input.items.filter((i) => !i.deletedAt);
  const confirmed = active.filter((i) => i.confirmationState === "confirmed");
  const proposed = active.filter((i) => i.confirmationState === "proposed");

  const sections: AgencyMemoryPresentationSection[] = [
    {
      id: "my-preferences",
      title: "My Preferences",
      body: "Preferences you confirmed. Only these can guide mission personalisation.",
      items: confirmed.map((item) => ({
        memoryId: item.memoryId,
        statement: item.statement,
        categoryLabel: getCategoryEntry(item.category).label,
        state: item.confirmationState,
        why: whyText(item),
        whereUsed: whereUsedText(item),
        whoCanSee: whoCanSeeText(item),
        source: item.source,
        editable: item.editable,
        deletable: item.deletable,
      })),
    },
    {
      id: "what-mapable-remembers",
      title: "What MapAble Remembers",
      body: "Everything stored in Agency Memory for you, including proposals waiting for your confirmation.",
      items: active.map((item) => ({
        memoryId: item.memoryId,
        statement: item.statement,
        categoryLabel: getCategoryEntry(item.category).label,
        state: item.confirmationState,
        why: whyText(item),
        whereUsed: whereUsedText(item),
        whoCanSee: whoCanSeeText(item),
        source: item.source,
        editable: item.editable,
        deletable: item.deletable,
      })),
    },
    {
      id: "why",
      title: "Why",
      body: "MapAble only remembers what you supplied or confirmed. AI suggestions are never treated as your preference on their own.",
    },
    {
      id: "where-used",
      title: "Where Used",
      body: `Active preference links: ${input.graph.edges.filter((e) => e.active).length}. Confirmed items: ${confirmed.length}. Waiting for confirmation: ${proposed.length}.`,
    },
    {
      id: "who-can-see",
      title: "Who Can See",
      body: "Default visibility is only you. Delegates see proposals they submitted, not your full memory, unless you grant access.",
    },
  ];

  if (input.conflicts.some((c) => c.resolution === "ask_participant")) {
    sections.push({
      id: "conflicts",
      title: "Needs your decision",
      body: input.conflicts
        .filter((c) => c.resolution === "ask_participant")
        .map((c) => c.explanation)
        .join(" "),
    });
  }

  return {
    title: "Agency Memory",
    summary:
      "Your long-term preferences and decisions — inspectable, editable, and deletable.",
    sections,
    controls: {
      personalisationPaused: input.controls.personalisationPaused,
      aiUseDisabled: input.controls.aiUseDisabled,
      note: input.controls.aiUseDisabled
        ? "AI use is disabled. You can still manage preferences manually."
        : input.controls.personalisationPaused
          ? "Personalisation is paused. Confirmed preferences are kept but not applied."
          : "Personalisation may use confirmed preferences when feature flags allow.",
    },
  };
}
