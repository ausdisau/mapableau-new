import { z } from "zod";

import { checkConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";
import type { ToolDefinition } from "@/lib/mapable-agent/tools/types";
import type { ConsentScope } from "@/types/mapable";

export function getParticipantProfileTool(): ToolDefinition {
  return {
    name: "getParticipantProfile",
    description: "Get participant profile summary (no encrypted NDIS numbers)",
    sensitivity: "sensitive",
    requiresConsent: ["profile.read"],
    createsReviewOnLowConfidence: true,
    inputSchema: z.object({ participantId: z.string().min(1) }),
    execute: async (ctx, input) => {
      const { participantId } = input as { participantId: string };
      const profile = await prisma.participantProfile.findFirst({
        where: { userId: participantId },
        select: {
          displayName: true,
          preferredName: true,
          homeSuburb: true,
          homeState: true,
          primaryContactMethod: true,
        },
      });
      if (!profile) {
        return { ok: false, error: "Profile not found", confidence: 0, reviewCategory: "privacy" };
      }
      return {
        ok: true,
        data: { profile },
        confidence: 0.9,
        reviewCategory: "privacy",
      };
    },
  };
}

export function getConsentStatusTool(): ToolDefinition {
  return {
    name: "getConsentStatus",
    description: "Check consent status for a scope",
    sensitivity: "read",
    inputSchema: z.object({
      participantId: z.string().min(1),
      scope: z.enum([
        "profile.read",
        "billing.read",
        "support_profile.read",
      ] as const),
    }),
    execute: async (_ctx, input) => {
      const { participantId, scope } = input as {
        participantId: string;
        scope: ConsentScope;
      };
      const allowed = await checkConsent({
        subjectUserId: participantId,
        scope,
      });
      return { ok: true, data: { allowed, scope }, confidence: 1 };
    },
  };
}

export function parseNdisPlanTool(): ToolDefinition {
  return {
    name: "parseNDISPlan",
    description: "Parse NDIS plan text into structured sections",
    sensitivity: "draft",
    createsReviewOnLowConfidence: true,
    inputSchema: z.object({ planText: z.string().min(10) }),
    execute: async (_ctx, input) => {
      const { planText } = input as { planText: string };
      const sections = planText
        .split(/\n{2,}/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12);
      return {
        ok: true,
        data: { sections, sectionCount: sections.length },
        confidence: sections.length > 0 ? 0.75 : 0.4,
        reviewCategory: "funding",
      };
    },
  };
}

export function extractPlanGoalsTool(): ToolDefinition {
  return {
    name: "extractPlanGoals",
    description: "Extract goals from plan text",
    sensitivity: "draft",
    inputSchema: z.object({ planText: z.string().min(10) }),
    execute: async (_ctx, input) => {
      const { planText } = input as { planText: string };
      const goals = planText
        .split(/\n/)
        .filter((line) => /goal|objective|outcome/i.test(line))
        .slice(0, 8);
      return {
        ok: true,
        data: { goals },
        confidence: goals.length ? 0.8 : 0.5,
        reviewCategory: "funding",
      };
    },
  };
}

export function mapSupportToBudgetCategoryTool(): ToolDefinition {
  return {
    name: "mapSupportToBudgetCategory",
    description: "Suggest NDIS support category for a described support",
    sensitivity: "draft",
    inputSchema: z.object({ supportDescription: z.string().min(3) }),
    execute: async (_ctx, input) => {
      const { supportDescription } = input as { supportDescription: string };
      const lower = supportDescription.toLowerCase();
      let category = "Core — Assistance with Daily Life";
      if (/transport|travel|vehicle/.test(lower)) category = "Core — Transport";
      if (/therapy|capacity|skill/.test(lower)) category = "Capacity Building";
      return {
        ok: true,
        data: { suggestedCategory: category },
        confidence: 0.7,
        reviewCategory: "funding",
      };
    },
  };
}

export function searchSupportWorkersTool(): ToolDefinition {
  return {
    name: "searchSupportWorkers",
    description: "Search NDIS providers for support workers (directory only)",
    sensitivity: "read",
    inputSchema: z.object({
      query: z.string().min(1),
      limit: z.number().int().min(1).max(10).optional(),
    }),
    execute: async (_ctx, input) => {
      const { query, limit = 5 } = input as { query: string; limit?: number };
      const providers = await prisma.ndisProvider.findMany({
        where: {
          OR: [
            { providerName: { contains: query, mode: "insensitive" } },
            { suburb: { contains: query, mode: "insensitive" } },
          ],
        },
        take: limit,
        select: { sourceId: true, providerName: true, suburb: true, state: true },
      });
      return {
        ok: true,
        data: { providers, count: providers.length },
        confidence: providers.length ? 0.85 : 0.5,
        reviewCategory: "provider_selection",
      };
    },
  };
}

export function quoteAccessibleTripTool(): ToolDefinition {
  return {
    name: "quoteAccessibleTrip",
    description: "Draft accessible transport quote estimate (not a booking)",
    sensitivity: "draft",
    requiresHumanApproval: true,
    inputSchema: z.object({
      fromSuburb: z.string().min(1),
      toSuburb: z.string().min(1),
      wheelchairRequired: z.boolean().optional(),
    }),
    execute: async (_ctx, input) => {
      const data = input as {
        fromSuburb: string;
        toSuburb: string;
        wheelchairRequired?: boolean;
      };
      const base = data.wheelchairRequired ? 85 : 55;
      return {
        ok: true,
        data: {
          estimateAud: base,
          note: "Draft estimate only — staff must confirm before booking.",
          ...data,
        },
        confidence: 0.65,
        reviewCategory: "payment",
      };
    },
  };
}

export function classifyInvoiceLineItemsTool(): ToolDefinition {
  return {
    name: "classifyInvoiceLineItems",
    description: "Classify invoice line items against NDIS support items",
    sensitivity: "draft",
    inputSchema: z.object({
      lines: z.array(z.object({ description: z.string(), amount: z.number() })),
    }),
    execute: async (_ctx, input) => {
      const { lines } = input as {
        lines: Array<{ description: string; amount: number }>;
      };
      const classified = lines.map((line, i) => ({
        index: i,
        description: line.description,
        suggestedSupportItem: "01_011_0107_1_1",
        confidence: 0.6,
      }));
      return {
        ok: true,
        data: { classified },
        confidence: 0.6,
        reviewCategory: "payment",
      };
    },
  };
}

export function checkDuplicateInvoiceTool(): ToolDefinition {
  return {
    name: "checkDuplicateInvoice",
    description: "Check for possible duplicate invoices",
    sensitivity: "read",
    inputSchema: z.object({
      participantId: z.string().min(1),
      invoiceNumber: z.string().min(1),
    }),
    execute: async (_ctx, input) => {
      const { participantId, invoiceNumber } = input as {
        participantId: string;
        invoiceNumber: string;
      };
      const existing = await prisma.invoice.count({
        where: {
          participantId,
          invoiceNumber: { equals: invoiceNumber, mode: "insensitive" },
        },
      });
      return {
        ok: true,
        data: { possibleDuplicate: existing > 0, matchCount: existing },
        confidence: 0.9,
        reviewCategory: existing > 0 ? "payment" : undefined,
      };
    },
  };
}

export function checkPriceLimitTool(): ToolDefinition {
  return {
    name: "checkPriceLimit",
    description: "Check line amount against NDIS price limit catalogue",
    sensitivity: "read",
    inputSchema: z.object({
      supportItemNumber: z.string().min(1),
      amount: z.number().positive(),
    }),
    execute: async (_ctx, input) => {
      const { supportItemNumber, amount } = input as {
        supportItemNumber: string;
        amount: number;
      };
      const price = await prisma.ndisSupportItemPrice.findFirst({
        where: { supportItem: { code: supportItemNumber } },
        select: { priceCapCents: true },
        orderBy: { effectiveFrom: "desc" },
      });
      const limit = price?.priceCapCents ?? null;
      const withinLimit = limit == null ? null : amount * 100 <= limit;
      return {
        ok: true,
        data: { supportItemNumber, amount, priceLimit: limit, withinLimit },
        confidence: limit != null ? 0.9 : 0.5,
        reviewCategory: withinLimit === false ? "payment" : undefined,
      };
    },
  };
}

export function searchInclusiveJobsTool(): ToolDefinition {
  return {
    name: "searchInclusiveJobs",
    description: "Search inclusive job listings",
    sensitivity: "read",
    inputSchema: z.object({ query: z.string().min(1), limit: z.number().optional() }),
    execute: async (_ctx, input) => {
      const { query, limit = 5 } = input as { query: string; limit?: number };
      const jobs = await prisma.job.findMany({
        where: { title: { contains: query, mode: "insensitive" } },
        take: limit,
        select: { id: true, title: true, status: true },
      });
      return { ok: true, data: { jobs }, confidence: 0.8 };
    },
  };
}

export function draftProviderMessageTool(): ToolDefinition {
  return {
    name: "draftProviderMessage",
    description: "Draft a message to a provider (does not send)",
    sensitivity: "draft",
    requiresHumanApproval: true,
    inputSchema: z.object({
      providerName: z.string().min(1),
      purpose: z.string().min(1),
    }),
    execute: async (_ctx, input) => {
      const { providerName, purpose } = input as {
        providerName: string;
        purpose: string;
      };
      const draft = `Hello ${providerName},\n\nI am writing regarding: ${purpose}.\n\nCould you please let me know your availability?\n\nThank you.`;
      return {
        ok: true,
        data: { draft, status: "draft_only_not_sent" },
        confidence: 0.85,
        reviewCategory: "provider_selection",
      };
    },
  };
}
