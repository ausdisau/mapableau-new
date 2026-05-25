"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { MessageComposer } from "@/components/messages/MessageComposer";
import { MobileChatInfoSheet } from "@/components/messages/MobileChatInfoSheet";

export function MobileThreadView({
  conversationId,
  title,
  backHref,
}: {
  conversationId: string;
  title: string;
  backHref: string;
}) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background md:static md:z-auto md:min-h-[50vh]">
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-2 py-2 pt-[env(safe-area-inset-top)]">
        <Link
          href={backHref}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <h1 className="min-w-0 flex-1 truncate font-semibold">{title}</h1>
        <button
          type="button"
          className="min-h-11 rounded-lg px-3 text-sm font-medium text-primary"
          onClick={() => setInfoOpen(true)}
        >
          Info
        </button>
      </header>
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        <p className="text-sm text-muted-foreground">
          Messages load when you are online. Drafts can be saved on this device.
        </p>
      </div>
      <MessageComposer conversationId={conversationId} />
      <MobileChatInfoSheet
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        conversationId={conversationId}
      />
    </div>
  );
}
