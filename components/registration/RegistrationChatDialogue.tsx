"use client";

import React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/app/lib/utils";
import { GuidedSearchComposer } from "@/components/guided-search/GuidedSearchComposer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  REGISTRATION_PASSWORD_SENTINEL,
  REGISTRATION_START_SENTINEL,
} from "@/lib/registration/validation";
import type {
  RegistrationAgentData,
  RegistrationChatUIMessage,
  RegistrationStateData,
} from "@/types/registration-chat";

import { RegistrationMessageList } from "./RegistrationMessageList";
import { RegistrationPasswordInput } from "./RegistrationPasswordInput";
import { RegistrationSlotProgress } from "./RegistrationSlotProgress";
import {
  applySlotToSession,
  emptyRegistrationSession,
  getOrCreateRegistrationSessionId,
  type RegistrationSessionFields,
} from "./types";

export type RegistrationInvitePreview = {
  organisationName: string;
  emailMasked: string;
  status: string;
};

type Props = {
  inviteToken?: string;
  invitePreview?: RegistrationInvitePreview | null;
  onRegister?: (session: RegistrationSessionFields) => void;
  isRegistering?: boolean;
  className?: string;
};

export function RegistrationChatDialogue({
  inviteToken = "",
  invitePreview = null,
  onRegister,
  isRegistering = false,
  className,
}: Props) {
  const listId = useId();
  const inputId = useId();
  const passwordInputId = useId();
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<RegistrationSessionFields>(emptyRegistrationSession());
  const sessionIdRef = useRef("");
  const initialSentRef = useRef(false);
  const [input, setInput] = useState("");
  const [passwordDraft, setPasswordDraft] = useState("");
  const [agentMeta, setAgentMeta] = useState<RegistrationAgentData | null>(null);
  const [registrationState, setRegistrationState] =
    useState<RegistrationStateData | null>(null);

  useEffect(() => {
    sessionIdRef.current = getOrCreateRegistrationSessionId();
  }, []);

  const updateSession = useCallback((next: RegistrationSessionFields) => {
    sessionRef.current = next;
  }, []);

  const handleData = useCallback(
    (dataPart: { type: string; data?: unknown }) => {
      if (
        dataPart.type === "data-registrationState" &&
        dataPart.data &&
        typeof dataPart.data === "object"
      ) {
        const data = dataPart.data as RegistrationStateData;
        setRegistrationState(data);
        updateSession({
          ...sessionRef.current,
          name: data.fields.name,
          email: data.fields.email,
          password: data.passwordCollected
            ? sessionRef.current.password
            : sessionRef.current.password,
        });
      }
      if (
        dataPart.type === "data-registrationAgent" &&
        dataPart.data &&
        typeof dataPart.data === "object"
      ) {
        const data = dataPart.data as RegistrationAgentData;
        setAgentMeta(data);
      }
    },
    [updateSession],
  );

  const { messages, sendMessage, status, error } =
    useChat<RegistrationChatUIMessage>({
      transport: new DefaultChatTransport({
        api: "/api/registration/chat",
        prepareSendMessagesRequest: ({ messages: chatMessages }) => ({
          body: {
            messages: chatMessages,
            sessionId: sessionIdRef.current,
            session: sessionRef.current,
            inviteToken: inviteToken || undefined,
          },
        }),
      }),
      onData: handleData,
    });

  const isBusy =
    status === "streaming" || status === "submitted" || isRegistering;
  const needsClarification = agentMeta?.status === "needs_clarification";
  const showPasswordInput =
    needsClarification && agentMeta?.clarificationSlot === "password";
  const isComplete = agentMeta?.status === "complete";

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const submitText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isBusy) return;
      setInput("");
      await sendMessage({ text: trimmed });
      requestAnimationFrame(scrollToBottom);
    },
    [isBusy, sendMessage],
  );

  useEffect(() => {
    if (initialSentRef.current) return;
    initialSentRef.current = true;
    void submitText(REGISTRATION_START_SENTINEL);
  }, [submitText]);

  function handleNameOrEmailSubmit() {
    const slot = agentMeta?.clarificationSlot;
    if (slot === "name" || slot === "email") {
      const nextSession = applySlotToSession(
        sessionRef.current,
        slot,
        input,
      );
      updateSession(nextSession);
    }
    void submitText(input);
  }

  function handlePasswordSubmit() {
    const trimmed = passwordDraft.trim();
    if (trimmed.length < 8 || isBusy) return;
    const nextSession = applySlotToSession(
      sessionRef.current,
      "password",
      trimmed,
    );
    updateSession(nextSession);
    setPasswordDraft("");
    void submitText(REGISTRATION_PASSWORD_SENTINEL);
  }

  const inviteContext = agentMeta?.inviteContext ?? invitePreview;

  return (
    <Card variant="outlined" className={cn("flex flex-col overflow-hidden", className)}>
      <div className="border-b border-border/60 px-4 py-3">
        <h2 className="font-heading text-base font-semibold">
          Chat to create your account
        </h2>
        <p className="text-xs text-muted-foreground">
          Answer a few quick questions — we will collect your details as we go.
        </p>
        {inviteContext ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Joining {inviteContext.organisationName}
            {inviteContext.emailMasked
              ? ` · invited as ${inviteContext.emailMasked}`
              : null}
          </p>
        ) : null}
        {agentMeta?.filledSlots ? (
          <div className="mt-2">
            <RegistrationSlotProgress filledSlots={agentMeta.filledSlots} />
          </div>
        ) : null}
      </div>

      <RegistrationMessageList
        listId={listId}
        messages={messages}
        isBusy={status === "streaming" || status === "submitted"}
        error={error}
        bottomRef={bottomRef}
      />

      {showPasswordInput ? (
        <div className="space-y-2 px-4 pb-2">
          <RegistrationPasswordInput
            id={passwordInputId}
            value={passwordDraft}
            onChange={setPasswordDraft}
            onSubmit={handlePasswordSubmit}
            disabled={isRegistering}
            isBusy={isBusy}
          />
        </div>
      ) : null}

      {isComplete ? (
        <div className="px-4 pb-2">
          <Button
            type="button"
            variant="default"
            size="lg"
            className="w-full"
            disabled={isBusy || !registrationState?.passwordCollected}
            loading={isRegistering}
            onClick={() => onRegister?.(sessionRef.current)}
          >
            {isRegistering ? "Creating account…" : "Create account"}
          </Button>
        </div>
      ) : null}

      {!showPasswordInput && !isComplete ? (
        <div className="border-t border-border/60 p-3">
          <GuidedSearchComposer
            inputId={inputId}
            value={input}
            onChange={setInput}
            onSubmit={handleNameOrEmailSubmit}
            disabled={isRegistering}
            isBusy={isBusy}
            placeholder={
              agentMeta?.clarificationSlot === "email"
                ? "you@example.com"
                : "Your full name"
            }
          />
        </div>
      ) : null}
    </Card>
  );
}
