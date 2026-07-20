import { normalizeAuthEmail } from "@/lib/auth/auth-flow";
import type {
  RegistrationAgentData,
  RegistrationFields,
  RegistrationInviteContext,
  RegistrationSlot,
} from "@/types/registration-chat";

import {
  isValidRegistrationEmail,
  parseEmailFromUserText,
  parseNameFromUserText,
  REGISTRATION_PASSWORD_SENTINEL,
  REGISTRATION_START_SENTINEL,
  validateRegistrationPassword,
} from "./validation";

export type RegistrationTurn = {
  replyText: string;
  fields: RegistrationFields;
  passwordCollected: boolean;
  agent: RegistrationAgentData;
};

type InviteMeta = {
  email: string;
  organisationName: string;
  emailMasked: string;
  status: string;
} | null;

type RunRegistrationTurnOptions = {
  agentSessionId: string;
  agentTurnIndex: number;
  priorFields?: RegistrationFields;
  priorPasswordCollected?: boolean;
  invite?: InviteMeta;
  sessionPassword?: string;
};

function buildFilledSlots(
  fields: RegistrationFields,
  passwordCollected: boolean,
  emailLocked: boolean,
): Partial<Record<RegistrationSlot, boolean>> {
  return {
    name: Boolean(fields.name.trim()),
    email: emailLocked || Boolean(fields.email.trim()),
    password: passwordCollected,
  };
}

function nextSlot(
  fields: RegistrationFields,
  passwordCollected: boolean,
  emailLocked: boolean,
): RegistrationSlot | null {
  if (!fields.name.trim()) return "name";
  if (!emailLocked && !fields.email.trim()) return "email";
  if (!passwordCollected) return "password";
  return null;
}

function inviteContextFromMeta(invite: InviteMeta): RegistrationInviteContext | undefined {
  if (!invite) return undefined;
  return {
    organisationName: invite.organisationName,
    emailMasked: invite.emailMasked,
    status: invite.status,
  };
}

function mergeFields(
  prior: RegistrationFields | undefined,
  current: RegistrationFields,
  emailLocked: boolean,
  lockedEmail: string,
): RegistrationFields {
  const merged: RegistrationFields = {
    name: current.name.trim() || prior?.name?.trim() || "",
    email: current.email.trim() || prior?.email?.trim() || "",
  };
  if (emailLocked && lockedEmail) {
    merged.email = normalizeAuthEmail(lockedEmail);
  }
  return merged;
}

export function runRegistrationTurn(
  userText: string,
  formSession: RegistrationFields & { password?: string },
  options: RunRegistrationTurnOptions,
): RegistrationTurn {
  const {
    agentSessionId,
    agentTurnIndex,
    priorFields,
    priorPasswordCollected = false,
    invite,
    sessionPassword = "",
  } = options;

  const emailLocked =
    Boolean(invite) && invite?.status === "pending" && Boolean(invite.email);
  const lockedEmail = emailLocked ? normalizeAuthEmail(invite!.email) : "";

  let fields = mergeFields(
    priorFields,
    { name: formSession.name ?? "", email: formSession.email ?? "" },
    emailLocked,
    lockedEmail,
  );

  let passwordCollected = priorPasswordCollected;
  const passwordValue = (sessionPassword || formSession.password || "").trim();
  const turnIndex = agentTurnIndex + 1;
  const inviteContext = inviteContextFromMeta(invite);

  const trimmedText = userText.trim();

  if (trimmedText === REGISTRATION_START_SENTINEL) {
    const slot = nextSlot(fields, passwordCollected, emailLocked);
    const question =
      slot === "name"
        ? invite
          ? `Welcome! You are joining ${invite.organisationName}. What is your full name?`
          : "Welcome to MapAble! What is your full name?"
        : slot === "email"
          ? "What email address should we use for your account?"
          : "Choose a password with at least 8 characters.";

    return buildTurn({
      replyText: question,
      fields,
      passwordCollected,
      agentSessionId,
      turnIndex,
      status: "needs_clarification",
      clarificationSlot: slot ?? "name",
      clarificationQuestion: question,
      inviteContext,
      emailLocked,
    });
  }

  const currentSlot = nextSlot(fields, passwordCollected, emailLocked);

  if (!currentSlot) {
    const question = "You are all set. Tap Create account to finish.";
    return buildTurn({
      replyText: question,
      fields,
      passwordCollected: true,
      agentSessionId,
      turnIndex,
      status: "complete",
      inviteContext,
      emailLocked,
    });
  }

  if (currentSlot === "name") {
    const parsed = parseNameFromUserText(trimmedText);
    if (!parsed) {
      const question = "Please enter your full name (not an email address).";
      return buildTurn({
        replyText: question,
        fields,
        passwordCollected,
        agentSessionId,
        turnIndex,
        status: "needs_clarification",
        clarificationSlot: "name",
        clarificationQuestion: question,
        inviteContext,
        emailLocked,
      });
    }
    fields = { ...fields, name: parsed };
    const next = nextSlot(fields, passwordCollected, emailLocked);
    const question =
      next === "email"
        ? emailLocked
          ? `Thanks, ${parsed}. Use the password field below to secure your account.`
          : `Thanks, ${parsed}. What email address should we use for your account?`
        : "Choose a password with at least 8 characters.";

    return buildTurn({
      replyText: question,
      fields,
      passwordCollected,
      agentSessionId,
      turnIndex,
      status: "needs_clarification",
      clarificationSlot: next ?? "password",
      clarificationQuestion: question,
      inviteContext,
      emailLocked,
    });
  }

  if (currentSlot === "email") {
    const parsed = parseEmailFromUserText(trimmedText);
    if (!parsed) {
      const question = "That does not look like a valid email. Please try again.";
      return buildTurn({
        replyText: question,
        fields,
        passwordCollected,
        agentSessionId,
        turnIndex,
        status: "needs_clarification",
        clarificationSlot: "email",
        clarificationQuestion: question,
        inviteContext,
        emailLocked,
      });
    }
    if (emailLocked && parsed !== lockedEmail) {
      const question = `Please use the invited email address (${invite?.emailMasked ?? "on your invite"}).`;
      return buildTurn({
        replyText: question,
        fields,
        passwordCollected,
        agentSessionId,
        turnIndex,
        status: "needs_clarification",
        clarificationSlot: "email",
        clarificationQuestion: question,
        inviteContext,
        emailLocked,
      });
    }
    fields = { ...fields, email: parsed };
    const question = "Great. Choose a password with at least 8 characters.";
    return buildTurn({
      replyText: question,
      fields,
      passwordCollected,
      agentSessionId,
      turnIndex,
      status: "needs_clarification",
      clarificationSlot: "password",
      clarificationQuestion: question,
      inviteContext,
      emailLocked,
    });
  }

  if (currentSlot === "password") {
    const password =
      trimmedText === REGISTRATION_PASSWORD_SENTINEL ? passwordValue : passwordValue;
    const passwordError = validateRegistrationPassword(password);
    if (passwordError) {
      const question = passwordError;
      return buildTurn({
        replyText: question,
        fields,
        passwordCollected: false,
        agentSessionId,
        turnIndex,
        status: "needs_clarification",
        clarificationSlot: "password",
        clarificationQuestion: question,
        inviteContext,
        emailLocked,
      });
    }
    passwordCollected = true;
    const question = `Thanks, ${fields.name}. When you are ready, tap Create account to finish.`;
    return buildTurn({
      replyText: question,
      fields,
      passwordCollected: true,
      agentSessionId,
      turnIndex,
      status: "complete",
      inviteContext,
      emailLocked,
    });
  }

  const question = "Let's continue with your registration.";
  return buildTurn({
    replyText: question,
    fields,
    passwordCollected,
    agentSessionId,
    turnIndex,
    status: "needs_clarification",
    clarificationSlot: "name",
    clarificationQuestion: question,
    inviteContext,
    emailLocked,
  });
}

function buildTurn(input: {
  replyText: string;
  fields: RegistrationFields;
  passwordCollected: boolean;
  agentSessionId: string;
  turnIndex: number;
  status: RegistrationAgentData["status"];
  clarificationSlot?: RegistrationSlot;
  clarificationQuestion?: string;
  inviteContext?: RegistrationInviteContext;
  emailLocked: boolean;
}): RegistrationTurn {
  const {
    replyText,
    fields,
    passwordCollected,
    agentSessionId,
    turnIndex,
    status,
    clarificationSlot,
    clarificationQuestion,
    inviteContext,
    emailLocked,
  } = input;

  return {
    replyText,
    fields,
    passwordCollected,
    agent: {
      sessionId: agentSessionId,
      turnIndex,
      status,
      clarificationQuestion,
      clarificationSlot,
      filledSlots: buildFilledSlots(fields, passwordCollected, emailLocked),
      inviteContext,
    },
  };
}

/** Exported for tests */
export function isRegistrationEmailLocked(
  invite: InviteMeta,
): invite is NonNullable<InviteMeta> {
  return Boolean(invite) && invite.status === "pending" && isValidRegistrationEmail(invite.email);
}
