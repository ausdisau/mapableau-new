"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MessagesOverlay } from "@/components/messages/MessagesOverlay";

export function MessagesOverlayLauncher({
  currentProfileId,
  canEscalateSafety,
  unreadCount,
}: {
  currentProfileId: string;
  canEscalateSafety?: boolean;
  unreadCount?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="default"
        size="default"
        className="fixed bottom-6 right-6 z-40 min-h-12 gap-2 rounded-full px-5 shadow-lg md:bottom-8 md:right-8"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="messages-overlay"
      >
        <MessageSquare className="h-5 w-5" aria-hidden />
        Messages
        {unreadCount != null && unreadCount > 0 ? (
          <span
            className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs font-bold"
            aria-label={`${unreadCount} unread`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </Button>
      <div id="messages-overlay">
        <MessagesOverlay
          open={open}
          onClose={() => setOpen(false)}
          currentProfileId={currentProfileId}
          canEscalateSafety={canEscalateSafety}
        />
      </div>
    </>
  );
}
