"use client";

import { useEffect, useState } from "react";

import { cn } from "@/app/lib/utils";
import { mapableSectionCardClass } from "@/lib/brand/styles";

const DEFAULT_STEPS = [
  {
    step: "1",
    title: "Describe your needs",
    description:
      "Tell us what support you want in plain language — no technical forms.",
    status: "pending" as const,
  },
  {
    step: "2",
    title: "Review your draft plan",
    description:
      "Check the summary and tasks. Nothing is sent to providers until you confirm.",
    status: "pending" as const,
  },
  {
    step: "3",
    title: "Confirm and track",
    description:
      "Save your request, then manage bookings and service logs in one place.",
    status: "pending" as const,
  },
];

type JourneyNode = {
  id: string;
  label: string;
  status: string;
};

type JourneyGraph = {
  nodes?: JourneyNode[];
  pendingConfirmationGate?: boolean;
};

export function CareJourneyStrip({
  className,
  participantId,
}: {
  className?: string;
  participantId?: string;
}) {
  const [graph, setGraph] = useState<JourneyGraph | null>(null);

  useEffect(() => {
    if (!participantId) return;
    void fetch(`/api/journey?participantId=${encodeURIComponent(participantId)}`)
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<{ sessions?: { graphJson: JourneyGraph }[] }>;
      })
      .then((data) => {
        const latest = data?.sessions?.[0]?.graphJson;
        if (latest?.nodes?.length) setGraph(latest);
      })
      .catch(() => undefined);
  }, [participantId]);

  const steps =
    graph?.nodes?.map((node, index) => ({
      step: String(index + 1),
      title: node.label,
      description:
        node.status === "complete"
          ? "Completed"
          : node.status === "active"
            ? "In progress"
            : "Pending",
      status: node.status,
    })) ?? DEFAULT_STEPS;

  return (
    <section aria-labelledby="care-journey-heading" className={className}>
      <div className="mb-6 text-center sm:text-left">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          How it works
        </p>
        <h2
          id="care-journey-heading"
          className="mt-2 font-heading text-2xl font-bold"
        >
          {graph ? "Your support journey" : "A simple path to the right support"}
        </h2>
        {graph?.pendingConfirmationGate ? (
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
            A coordinator step is waiting for your confirmation.
          </p>
        ) : null}
      </div>
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map((item) => (
          <li
            key={item.step}
            className={cn(
              mapableSectionCardClass,
              "flex flex-col gap-2 p-5",
              item.status === "complete" && "border-green-500/30",
              item.status === "active" && "border-primary/40"
            )}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
              aria-hidden
            >
              {item.step}
            </span>
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
