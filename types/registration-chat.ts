import type { UIMessage } from "ai";

export type RegistrationSlot = "name" | "email" | "password";

export type RegistrationAgentStatus =
  | "needs_clarification"
  | "complete"
  | "error";

export type RegistrationInviteContext = {
  organisationName: string;
  emailMasked: string;
  status: string;
};

export type RegistrationFields = {
  name: string;
  email: string;
};

export type RegistrationAgentData = {
  sessionId: string;
  turnIndex: number;
  status: RegistrationAgentStatus;
  clarificationQuestion?: string;
  clarificationSlot?: RegistrationSlot;
  filledSlots?: Partial<Record<RegistrationSlot, boolean>>;
  inviteContext?: RegistrationInviteContext;
};

export type RegistrationStateData = {
  fields: RegistrationFields;
  passwordCollected: boolean;
};

export type RegistrationChatUIMessage = UIMessage<
  never,
  {
    registrationAgent: RegistrationAgentData;
    registrationState: RegistrationStateData;
  }
>;
