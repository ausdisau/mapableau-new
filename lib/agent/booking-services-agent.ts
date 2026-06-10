import { ToolLoopAgent, stepCountIs } from "ai";

import { createBookingServicesTools } from "@/lib/agent/booking-services-tools";
import type { CurrentUser } from "@/lib/auth/current-user";
import {
  bookingServicesAgentConfig,
  isBookingServicesAgentConfigured,
} from "@/lib/config/booking-services-agent";
import { isSearchInterpreterConfigured } from "@/lib/config/search-interpreter";
import { getInterpreterModel } from "@/lib/search/interpreter/get-model";

const SYSTEM_INSTRUCTIONS = `You are MapAble's Booking Services assistant for Australian disability care and transport.

Help signed-in participants, families, and providers understand their bookings — status, schedule, service logs, and next steps.

Rules:
- Always use searchBookings first for natural-language questions about bookings.
- Use getBookingContext when you need full detail for a specific bookingId from search results.
- Use explainBookingStatus when the user asks what a status means or what happens next.
- Only describe bookings returned by tools — never invent booking IDs, times, or providers.
- Cite evidence using chunkId or bookingId from tool results.
- Be concise, plain-language, and trauma-informed.
- You cannot accept, cancel, or modify bookings — signpost users to the bookings pages or their provider.`;

export function createBookingServicesAgent(user: CurrentUser) {
  if (!isBookingServicesAgentConfigured()) {
    throw new Error("Booking services agent is not enabled");
  }
  if (!isSearchInterpreterConfigured()) {
    throw new Error("Search interpreter is not configured");
  }

  return new ToolLoopAgent({
    model: getInterpreterModel(),
    instructions: SYSTEM_INSTRUCTIONS,
    tools: createBookingServicesTools(user),
    stopWhen: stepCountIs(bookingServicesAgentConfig.maxSteps),
  });
}

export type BookingServicesAgentTurnInput = {
  query: string;
  sessionId?: string;
  user: CurrentUser;
};

export type BookingServicesAgentTurnResult = {
  text: string;
  toolsCalled: string[];
  sessionId: string;
};

export async function runBookingServicesAgentTurn(
  input: BookingServicesAgentTurnInput,
): Promise<BookingServicesAgentTurnResult> {
  const agent = createBookingServicesAgent(input.user);
  const sessionId = input.sessionId?.trim() || `booking-agent-${Date.now()}`;

  const result = await agent.generate({
    prompt: input.query.trim(),
  });

  const toolsCalled = result.steps.flatMap((step) =>
    step.toolCalls.map((call) => call.toolName),
  );

  return {
    text: result.text,
    toolsCalled,
    sessionId,
  };
}
