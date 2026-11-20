"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

/** Warn when the JWT session is within this many ms of expiry. */
const WARN_WITHIN_MS = 48 * 60 * 60 * 1000;

/**
 * WCAG 2.2.1 / 2.2.5 additive UX: warn before session expiry and let the user
 * extend without losing in-progress work. No idle timeout is introduced.
 */
export function SessionExpiryWarning() {
  const { data: session, status, update } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const [extending, setExtending] = useState(false);
  const [visible, setVisible] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.expires) {
      setVisible(false);
      return;
    }
    const expires = new Date(session.expires);
    setExpiresAt(expires);
    const remaining = expires.getTime() - Date.now();
    setVisible(remaining > 0 && remaining <= WARN_WITHIN_MS);
  }, [session?.expires, status]);

  if (!visible || dismissed || status !== "authenticated") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-[#F8C51C] bg-[#0C1833] px-4 py-3 text-white shadow-lg"
      data-testid="session-expiry-warning"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-[1.5]">
          Your signed-in session
          {expiresAt
            ? ` ends around ${expiresAt.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}`
            : " is ending soon"}
          . Stay signed in to keep unfinished forms. Nothing is auto-refreshed
          without your choice.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="min-h-11 bg-[#F8C51C] text-[#0C1833] hover:bg-[#F8C51C]/90"
            disabled={extending}
            onClick={async () => {
              setExtending(true);
              try {
                await update();
                setDismissed(true);
              } finally {
                setExtending(false);
              }
            }}
          >
            {extending ? "Extending…" : "Stay signed in"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 border-white/40 bg-transparent text-white hover:bg-white/10"
            onClick={() => setDismissed(true)}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
