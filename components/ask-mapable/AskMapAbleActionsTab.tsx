"use client";

import { useRouter } from "next/navigation";

import { HUMAN_HELP_HREF } from "@/lib/ask-mapable";

type ActionDef = {
  id: string;
  label: string;
  description: string;
  seed?: string;
  href?: string;
};

const ACTIONS: ActionDef[] = [
  {
    id: "support",
    label: "Describe support I need",
    description: "Draft a support description using functional needs.",
    seed: "Help me describe the support I need without asking for a diagnosis.",
  },
  {
    id: "transport",
    label: "Book accessible transport",
    description: "Open transport planning on MapAble.",
    href: "/transport",
  },
  {
    id: "jobs",
    label: "Inclusive work",
    description: "Open jobs and workplace adjustment guidance.",
    href: "/jobs",
  },
  {
    id: "ndis",
    label: "Ask about NDIS information",
    description: "Explanatory only — not claim approval.",
    seed: "Explain NDIS plan categories in plain language. Do not approve or submit a claim.",
  },
  {
    id: "human",
    label: "Talk to a person",
    description: "Leave AI and contact MapAble support.",
    href: HUMAN_HELP_HREF,
  },
];

type Props = {
  onSeed: (message: string) => void;
};

export function AskMapAbleActionsTab({ onSeed }: Props) {
  const router = useRouter();

  return (
    <ul className="grid gap-3">
      {ACTIONS.map((action) => (
        <li key={action.id}>
          <button
            type="button"
            className="min-h-11 w-full rounded-lg border border-border bg-card px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              if (action.href) {
                router.push(action.href);
                return;
              }
              if (action.seed) onSeed(action.seed);
            }}
          >
            <span className="block font-medium">{action.label}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {action.description}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
