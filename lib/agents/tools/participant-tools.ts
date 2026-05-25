import { tool } from "@strands-agents/sdk";
import { z } from "zod";

import { logDataAccess } from "@/lib/audit/data-access-log";
import { prisma } from "@/lib/prisma";

import { getMapableState, hashInput } from "./tool-context";

export const getParticipantProfileSummary = tool({
  name: "get_participant_profile_summary",
  description: "Return a safe summary of the participant profile for the current user.",
  inputSchema: z.object({}),
  callback: async (_input, context) => {
    const state = getMapableState(context);
    const userId = state.context.participantId ?? state.context.userId;
    const profile = await prisma.participantProfile.findUnique({
      where: { userId },
      select: {
        displayName: true,
        homeSuburb: true,
        homeState: true,
        primaryContactMethod: true,
      },
    });
    await logDataAccess({
      actorUserId: state.context.userId,
      subjectUserId: userId,
      resourceType: "ParticipantProfile",
      action: "agent_tool_read",
      consentVerified: true,
    });
    state.toolCalls.push({
      toolName: "get_participant_profile_summary",
      status: "completed",
      riskLevel: "medium",
      outputSummary: "profile summary",
    });
    return {
      displayName: profile?.displayName ?? "Not set",
      region: [profile?.homeSuburb, profile?.homeState].filter(Boolean).join(", ") || null,
      contactMethod: profile?.primaryContactMethod ?? "email",
    };
  },
});

export const getParticipantAccessNeedsSummary = tool({
  name: "get_participant_access_needs_summary",
  description: "Summarise accessibility preferences without clinical interpretation.",
  inputSchema: z.object({}),
  callback: async (_input, context) => {
    const state = getMapableState(context);
    const userId = state.context.participantId ?? state.context.userId;
    const ap = await prisma.accessibilityProfile.findUnique({ where: { userId } });
    return {
      mobilityNeedsSummary: JSON.stringify(ap?.mobilityNeeds ?? []),
      communicationPreferencesSummary: JSON.stringify(
        ap?.communicationPreferences ?? []
      ),
      note: "Shared with providers only when consent allows.",
    };
  },
});

export const getParticipantConsentStatus = tool({
  name: "get_participant_consent_status",
  description: "List active consent grants for the participant.",
  inputSchema: z.object({}),
  callback: async (_input, context) => {
    const state = getMapableState(context);
    const userId = state.context.participantId ?? state.context.userId;
    const records = await prisma.consentRecord.findMany({
      where: { subjectUserId: userId, status: "active" },
      select: { scope: true, purpose: true, grantedToOrganisationId: true },
      take: 20,
    });
    return { activeGrants: records.length, scopes: records.map((r) => r.scope) };
  },
});

export const getParticipantTimelineSummary = tool({
  name: "get_participant_timeline_summary",
  description: "High-level timeline counts for bookings and incidents.",
  inputSchema: z.object({}),
  callback: async (_input, context) => {
    const state = getMapableState(context);
    const userId = state.context.participantId ?? state.context.userId;
    const [bookings, incidents] = await Promise.all([
      prisma.booking.count({ where: { participantId: userId } }),
      prisma.incidentReport.count({ where: { participantId: userId } }),
    ]);
    return { bookings, incidents };
  },
});
