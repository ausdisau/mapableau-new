"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { GraphCardShell } from "@/components/mapable-graphs/GraphCardShell";

type ShareMode = "once" | "always" | "deny";

type Props = {
  scope: string;
  recipientLabel: string;
  purpose: string;
  onChoose?: (mode: ShareMode) => void | Promise<void>;
  defaultAllowed?: boolean;
};

export function ConsentSharingCard({
  scope,
  recipientLabel,
  purpose,
  onChoose,
  defaultAllowed = false,
}: Props) {
  const [status, setStatus] = useState<string | null>(
    defaultAllowed ? "already_allowed" : null
  );

  async function choose(mode: ShareMode) {
    setStatus(mode);
    await onChoose?.(mode);
  }

  return (
    <GraphCardShell
      title="Sharing your information"
      description="You choose what is shared, with whom, and for how long."
    >
      <dl className="space-y-3">
        <div>
          <dt className="font-semibold">What</dt>
          <dd>{scope.replace(/_/g, " ")}</dd>
        </div>
        <div>
          <dt className="font-semibold">Who receives it</dt>
          <dd>{recipientLabel}</dd>
        </div>
        <div>
          <dt className="font-semibold">Why</dt>
          <dd>{purpose}</dd>
        </div>
      </dl>

      <p className="text-sm text-muted-foreground">
        Only the minimum necessary details are shared. You can revoke at any
        time.
      </p>

      <div
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
        role="group"
        aria-label="Consent choices"
      >
        <Button
          type="button"
          variant="default"
          size="lg"
          className="min-w-[10rem] text-base"
          onClick={() => choose("once")}
        >
          Share once
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-w-[10rem] text-base"
          onClick={() => choose("always")}
        >
          Always for this service
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-w-[10rem] text-base"
          onClick={() => choose("deny")}
        >
          Do not share
        </Button>
      </div>

      {status ? (
        <p role="status" className="font-medium">
          {status === "deny"
            ? "You chose not to share."
            : status === "once"
              ? "You chose to share once."
              : status === "always"
                ? "You chose to always share for this service type."
                : "Consent updated."}
        </p>
      ) : null}
    </GraphCardShell>
  );
}
