import { tool } from "@strands-agents/sdk";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const searchProviders = tool({
  name: "search_providers",
  description: "Search verified booking-eligible providers by region keyword.",
  inputSchema: z.object({
    region: z.string().optional(),
    limit: z.number().int().min(1).max(10).default(5),
  }),
  callback: async (input) => {
    const orgs = await prisma.organisation.findMany({
      where: {
        verificationStatus: "verified",
        bookingEligible: true,
        ...(input.region
          ? { serviceRegions: { has: input.region } }
          : {}),
      },
      select: { id: true, name: true, organisationType: true, serviceRegions: true },
      take: input.limit,
    });
    return { providers: orgs };
  },
});

export const getProviderPublicProfile = tool({
  name: "get_provider_public_profile",
  description: "Public provider profile summary.",
  inputSchema: z.object({ organisationId: z.string().min(1) }),
  callback: async (input) => {
    const org = await prisma.organisation.findUnique({
      where: { id: input.organisationId },
      select: {
        name: true,
        organisationType: true,
        verificationStatus: true,
        serviceRegions: true,
        bookingEligible: true,
      },
    });
    return org ?? { error: "Not found" };
  },
});

export const getProviderCapacitySummary = tool({
  name: "get_provider_capacity_summary",
  description: "High-level capacity signal for a provider (no worker PII).",
  inputSchema: z.object({ organisationId: z.string().min(1) }),
  callback: async (input) => {
    const org = await prisma.organisation.findUnique({
      where: { id: input.organisationId },
      select: { bookingEligible: true, verificationStatus: true },
    });
    return {
      organisationId: input.organisationId,
      acceptingBookings: org?.bookingEligible ?? false,
      note: "Capacity is indicative; assignment requires confirmation.",
    };
  },
});

export const getProviderVerificationSummary = tool({
  name: "get_provider_verification_summary",
  description: "Verification status for provider organisation.",
  inputSchema: z.object({ organisationId: z.string().min(1) }),
  callback: async (input) => {
    const org = await prisma.organisation.findUnique({
      where: { id: input.organisationId },
      select: { verificationStatus: true, bookingEligible: true, insuranceStatus: true },
    });
    return org ?? { error: "Not found" };
  },
});
