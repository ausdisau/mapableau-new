"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { GraphCardShell } from "@/components/mapable-graphs/GraphCardShell";

type FeedbackChoice = "right" | "change" | "person" | "not_helpful";

type Props = {
  onFeedback?: (choice: FeedbackChoice, note?: string) => void | Promise<void>;
  targetLabel?: string;
};

export function FeedbackCaptureCard({
  onFeedback,
  targetLabel = "this suggestion",
}: Props) {
  const [submitted, setSubmitted] = useState<FeedbackChoice | null>(null);

  async function send(choice: FeedbackChoice) {
    setSubmitted(choice);
    await onFeedback?.(choice);
  }

  return (
    <GraphCardShell
      title="Was this helpful?"
      description={`Tell us about ${targetLabel}. Your feedback improves support — it is not used to reduce your funding by default.`}
    >
      <div
        className="grid gap-3 sm:grid-cols-2"
        role="group"
        aria-label="Feedback options"
      >
        <Button
          type="button"
          variant="default"
          size="lg"
          onClick={() => send("right")}
        >
          Yes, this is right
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => send("change")}
        >
          Change this
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => send("person")}
        >
          Ask a person
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => send("not_helpful")}
        >
          Not helpful
        </Button>
      </div>

      {submitted ? (
        <p role="status" className="font-medium">
          Thank you. Your feedback was recorded and will not be sent for model
          training unless you opt in elsewhere.
        </p>
      ) : null}
    </GraphCardShell>
  );
}
