import { Loader2 } from "lucide-react";
import React from "react";

import { cn } from "@/app/lib/utils";
import {
  REGISTRATION_PASSWORD_SENTINEL,
  REGISTRATION_START_SENTINEL,
} from "@/lib/registration/validation";
import type { RegistrationChatUIMessage } from "@/types/registration-chat";

type Props = {
  listId: string;
  messages: RegistrationChatUIMessage[];
  isBusy?: boolean;
  error?: Error | null;
  emptyState?: React.ReactNode;
  className?: string;
  bottomRef?: React.Ref<HTMLDivElement>;
};

function getTextFromMessage(message: RegistrationChatUIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

function formatUserMessage(text: string): string | null {
  if (text === REGISTRATION_START_SENTINEL) return null;
  if (text === REGISTRATION_PASSWORD_SENTINEL) return "Password set";
  return text;
}

export function RegistrationMessageList({
  listId,
  messages,
  isBusy = false,
  error = null,
  emptyState = null,
  className,
  bottomRef,
}: Props) {
  return (
    <div
      id={listId}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      className={cn(
        "flex max-h-72 min-h-48 flex-col gap-3 overflow-y-auto px-4 py-3",
        className,
      )}
    >
      {messages.length === 0 ? emptyState : null}

      {messages.map((message) => {
        const rawText = getTextFromMessage(message);
        const text =
          message.role === "user" ? formatUserMessage(rawText) : rawText;
        if (!text) return null;
        const isUser = message.role === "user";
        return (
          <div
            key={message.id}
            className={cn(
              "max-w-[90%] rounded-lg px-3 py-2 text-sm",
              isUser
                ? "ml-auto bg-[#005B7F] text-white"
                : "bg-slate-100 text-[#0C1833]",
            )}
          >
            {text}
          </div>
        );
      })}

      {isBusy ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Setting up your account…
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error.message}
        </p>
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}
