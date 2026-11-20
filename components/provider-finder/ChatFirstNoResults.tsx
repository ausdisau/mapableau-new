"use client";

import Link from "next/link";
import { useState } from "react";

import {
  chipsFromApplied,
  type ChatFirstFilterChip,
} from "@/components/provider-finder/ChatFirstFilterChips";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NDIS_PROVIDER_REGISTER_URL } from "@/lib/provider/finder/evidence";
import type { AppliedSearchFields } from "@/lib/search/apply-interpretation";

type Props = {
  applied: AppliedSearchFields;
  onEditSearch: () => void;
  onBroadenSearch: () => void;
  onViewDirectory: () => void;
};

export function ChatFirstNoResults({
  applied,
  onEditSearch,
  onBroadenSearch,
  onViewDirectory,
}: Props) {
  const [broadenConfirm, setBroadenConfirm] = useState(false);
  const chips = chipsFromApplied(applied);

  return (
    <Card variant="outlined" className="p-6">
      <h3 className="text-lg font-semibold">No matching providers in this snapshot</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Nothing in the imported directory matched these filters. That is not a
        finding that no providers exist. Worker competence, current capacity,
        text/AAC support, price and service area are not verified here.
      </p>
      {chips.length > 0 ? (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm" aria-label="Filters used">
          {chips.map((chip: ChatFirstFilterChip) => (
            <li key={chip.key}>
              {chip.label}: {chip.value}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" variant="default" size="default" onClick={onEditSearch}>
          Edit my search
        </Button>
        {broadenConfirm ? (
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => {
              setBroadenConfirm(false);
              onBroadenSearch();
            }}
          >
            Confirm broaden search
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => setBroadenConfirm(true)}
          >
            Broaden search
          </Button>
        )}
        <Button type="button" variant="outline" size="default" onClick={onViewDirectory}>
          View directory
        </Button>
        <Button type="button" variant="outline" size="default" asChild>
          <Link href="/contact">Ask for human support</Link>
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        For incidents or safeguarding concerns, contact MapAble support and the{" "}
        <a
          href={NDIS_PROVIDER_REGISTER_URL}
          className="underline underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          NDIS Commission Provider Register
        </a>
        . This screen does not decide reportability.
      </p>
    </Card>
  );
}
