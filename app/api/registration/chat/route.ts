import { createUIMessageStreamResponse } from "ai";
import type { UIMessage } from "ai";

import {
  appendRegistrationTurn,
  getRegistrationSession,
  priorFieldsFromSession,
  touchRegistrationSession,
} from "@/lib/agent-sessions/registration-session";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { extractLastUserText } from "@/lib/provider-finder/conversation/extract-user-text";
import { createRegistrationChatResponseStream } from "@/lib/registration/conversation/stream-assistant";
import { runRegistrationTurn } from "@/lib/registration/run-registration-turn";
import {
  getWorkerInviteByToken,
  maskEmail,
} from "@/lib/workers/worker-invite-service";
import type { RegistrationChatUIMessage } from "@/types/registration-chat";

/** Streaming chat for guided registration. */
export const maxDuration = 30;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

export async function POST(request: Request) {
  const ip = getClientIp(request);

  if (!checkIpRateLimit(ip, { windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX })) {
    return Response.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  let body: {
    messages?: RegistrationChatUIMessage[];
    sessionId?: string;
    session?: {
      name?: string;
      email?: string;
      password?: string;
    };
    inviteToken?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messages = body.messages ?? [];
  const userText = extractLastUserText(messages as UIMessage[]);

  if (!userText.trim()) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim() || `register-${Date.now()}`;
  const formSession = {
    name: body.session?.name ?? "",
    email: body.session?.email ?? "",
    password: body.session?.password ?? "",
  };
  const inviteToken = body.inviteToken?.trim();

  try {
    let inviteMeta: {
      email: string;
      organisationName: string;
      emailMasked: string;
      status: string;
    } | null = null;

    if (inviteToken) {
      const invite = await getWorkerInviteByToken(inviteToken);
      if (invite) {
        inviteMeta = {
          email: invite.email,
          organisationName: invite.organisation.name,
          emailMasked: maskEmail(invite.email),
          status: invite.status,
        };
        if (invite.status === "pending") {
          formSession.email = invite.email;
        }
      }
    }

    touchRegistrationSession(sessionId);
    const existing = getRegistrationSession(sessionId);
    const priorFields = priorFieldsFromSession(sessionId, formSession);

    const turn = runRegistrationTurn(userText, formSession, {
      priorFields,
      priorPasswordCollected: existing?.passwordCollected ?? false,
      agentSessionId: sessionId,
      agentTurnIndex: existing?.turnIndex ?? 0,
      invite: inviteMeta,
      sessionPassword: formSession.password,
    });

    appendRegistrationTurn(sessionId, {
      fields: turn.fields,
      passwordCollected: turn.passwordCollected,
      turnIndex: turn.agent.turnIndex,
    });

    const stream = createRegistrationChatResponseStream({ turn });

    return createUIMessageStreamResponse({ stream });
  } catch (err) {
    console.error("[registration/chat]", err);
    return Response.json(
      { error: "Could not process your message." },
      { status: 502 },
    );
  }
}
