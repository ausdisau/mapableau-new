import { tool } from "ai";
import { z } from "zod";

import { calculateEvidenceConfidence } from "./confidence-engine";
import { AccessIntelligenceError } from "./errors";
import { calculatePersonalFit } from "./fit-engine";
import { getAccessIntelligenceRepository } from "./repositories";
import { buildAccessibleRoute, assertEligibleRoute } from "./route-engine";
import { accessibleRouteSchema, accessDecisionSchema } from "./schemas";
import type { ServerAccessContext } from "./types";

export function createAccessIntelligenceTools(ctx: ServerAccessContext) {
  const repo = getAccessIntelligenceRepository();

  return {
    loadAccessPassport: tool({
      description:
        "Load a selected Access Passport belonging to the authenticated user. Read-only.",
      inputSchema: z.object({
        passportId: z
          .string()
          .optional()
          .describe("Passport id. Defaults to the user's default or selected passport."),
      }),
      execute: async ({ passportId }) => {
        const list = await repo.listPassports(ctx.userId);
        const id =
          passportId ??
          ctx.selectedPassportId ??
          list.find((p) => p.isDefault)?.id ??
          list[0]?.id;
        if (!id) {
          throw new AccessIntelligenceError(
            "PASSPORT_NOT_FOUND",
            "No Access Passport is available.",
            "Create a passport in Access Intelligence settings.",
          );
        }
        const passport = await repo.getPassport(ctx.userId, id);
        // Minimise data returned to the model
        return {
          id: passport.id,
          name: passport.name,
          mobilityAids: passport.mobilityAids,
          communicationPreferences: passport.communicationPreferences,
          requirements: passport.requirements.map((r) => ({
            id: r.id,
            featureType: r.featureType,
            importance: r.importance,
            operator: r.operator,
            value: r.value,
            unit: r.unit,
          })),
        };
      },
    }),

    searchPlaces: tool({
      description: "Find candidate destinations by name or category. Read-only.",
      inputSchema: z.object({
        query: z.string().min(1).describe("Place name or keywords"),
      }),
      execute: async ({ query }) => {
        const results = await repo.searchPlaces(query);
        return {
          count: results.length,
          places: results.map((r) => ({
            id: r.place.id,
            name: r.place.name,
            address: r.place.address,
            category: r.place.category,
            matchReason: r.matchReason,
          })),
        };
      },
    }),

    readAccessGraph: tool({
      description:
        "Return building elements, features, route nodes, route edges, and evidence for a place. Read-only.",
      inputSchema: z.object({
        placeId: z.string().min(1),
      }),
      execute: async ({ placeId }) => {
        const graph = await repo.readAccessGraph(placeId);
        return {
          place: graph.place,
          elements: graph.elements,
          features: graph.features.map((f) => ({
            ...f,
            // Never present AI inference as measured evidence
            isAiInference: f.sourceType === "ai_inference",
          })),
          evidence: graph.evidence,
          nodes: graph.nodes,
          edges: graph.edges,
        };
      },
    }),

    getLiveAccessStatus: tool({
      description: "Return current and scheduled access incidents for a place. Read-only.",
      inputSchema: z.object({
        placeId: z.string().min(1),
      }),
      execute: async ({ placeId }) => {
        try {
          const incidents = await repo.getLiveIncidents(placeId);
          return {
            placeId,
            checkedAt: new Date().toISOString(),
            incidents,
            available: true,
          };
        } catch {
          throw new AccessIntelligenceError(
            "LIVE_STATUS_UNAVAILABLE",
            "Live lift or route status could not be checked.",
            "Rely on the last verified building information and treat live conditions as unknown.",
          );
        }
      },
    }),

    calculatePersonalFit: tool({
      description:
        "Run the deterministic personal fit and evidence confidence engines. Read-only. Do not invent or override this result.",
      inputSchema: z.object({
        placeId: z.string().min(1),
        passportId: z.string().min(1),
      }),
      execute: async ({ placeId, passportId }) => {
        const passport = await repo.getPassport(ctx.userId, passportId);
        const graph = await repo.readAccessGraph(placeId);
        const incidents = await repo.getLiveIncidents(placeId);
        const decision = calculatePersonalFit({
          place: graph.place,
          passport,
          features: graph.features,
          evidence: graph.evidence,
          incidents,
        });
        const confidence = calculateEvidenceConfidence({
          features: graph.features,
          evidence: graph.evidence,
          coverageExpectedFeatureTypes: passport.requirements.map((r) => r.featureType),
        });
        return {
          decision: accessDecisionSchema.parse(decision),
          confidenceExplanation: confidence.explanation,
          confidenceLabel: confidence.label,
        };
      },
    }),

    buildAccessibleRoute: tool({
      description:
        "Build a deterministic accessible route using the passport hard requirements. Read-only.",
      inputSchema: z.object({
        placeId: z.string().min(1),
        passportId: z.string().min(1),
        destination: z.string().min(1).describe("Room or destination label"),
        fromNodeId: z
          .string()
          .optional()
          .describe("Optional start node; defaults to a preferred entrance"),
      }),
      execute: async ({ placeId, passportId, destination, fromNodeId }) => {
        const passport = await repo.getPassport(ctx.userId, passportId);
        const graph = await repo.readAccessGraph(placeId);
        const incidents = await repo.getLiveIncidents(placeId);
        const toNodeId = await repo.findDestinationNodeId(placeId, destination);
        const startId =
          fromNodeId ??
          (await repo.findPreferredEntranceNodeId(placeId, {
            preferStepFree: passport.requirements.some(
              (r) => r.featureType === "step_free" && r.importance === "required",
            ),
          }));
        const result = buildAccessibleRoute({
          placeId,
          nodes: graph.nodes,
          edges: graph.edges,
          passport,
          fromNodeId: startId,
          toNodeId,
          incidents,
        });
        const recommended = assertEligibleRoute(result);
        return {
          recommended: accessibleRouteSchema.parse(recommended),
          fallback: result.fallback,
          rejected: result.rejected,
          textualInstructions: recommended.steps.map((s) => s.instruction),
        };
      },
    }),

    createVisitPlan: tool({
      description:
        "Create a structured visit plan draft from a decision and route. Persisted locally in demo mode.",
      inputSchema: z.object({
        placeId: z.string().min(1),
        passportId: z.string().min(1),
        destination: z.string().min(1),
        visitAt: z.string().optional(),
      }),
      execute: async ({ placeId, passportId, destination, visitAt }) => {
        const passport = await repo.getPassport(ctx.userId, passportId);
        const graph = await repo.readAccessGraph(placeId);
        const incidents = await repo.getLiveIncidents(placeId);
        const decision = calculatePersonalFit({
          place: graph.place,
          passport,
          features: graph.features,
          evidence: graph.evidence,
          incidents,
        });
        let route = null;
        try {
          const toNodeId = await repo.findDestinationNodeId(placeId, destination);
          const fromNodeId = await repo.findPreferredEntranceNodeId(placeId, {
            preferStepFree: true,
          });
          const built = buildAccessibleRoute({
            placeId,
            nodes: graph.nodes,
            edges: graph.edges,
            passport,
            fromNodeId,
            toNodeId,
            incidents,
          });
          route = built.recommended;
          if (route) decision.recommendedRouteId = route.id;
        } catch {
          // Keep plan without route when none eligible
        }

        const plan = await repo.saveVisitPlan({
          id: `visit-${Date.now()}`,
          userId: ctx.userId,
          placeId,
          destination,
          visitAt,
          accessDecision: decision,
          route,
          arrivalInstructions: route?.steps.map((s) => s.instruction) ?? [
            "No eligible route was available. Review blockers and unknowns.",
          ],
          contingencyInstructions: [
            ...(decision.blockers.length > 0
              ? ["Do not treat this visit as confirmed until blockers are resolved."]
              : []),
            "This is not an approved emergency evacuation route.",
            "If live conditions change, re-check before travelling.",
          ],
          evidenceSummary: decision.matchedRequirements
            .filter((m) => m.outcome === "matched")
            .map((m) => m.explanation),
          lastCheckedAt: new Date().toISOString(),
        });
        return plan;
      },
    }),

    requestVenueVerification: tool({
      description:
        "Send selected unanswered questions to a venue. Requires explicit user approval.",
      inputSchema: z.object({
        placeId: z.string().min(1),
        questions: z.array(z.string().min(1)).min(1),
        recipient: z.string().min(1).describe("Venue contact or role"),
        purpose: z.string().min(1),
      }),
      needsApproval: true,
      execute: async ({ placeId, questions, recipient, purpose }) => {
        const place = await repo.getPlace(placeId);
        return repo.createVerificationRequest({
          userId: ctx.userId,
          placeId: place.id,
          questions,
          recipient,
          purpose,
        });
      },
    }),

    submitBarrierReport: tool({
      description:
        "Publish a community barrier report. Requires explicit user approval.",
      inputSchema: z.object({
        placeId: z.string().min(1),
        elementId: z.string().optional(),
        description: z.string().min(1),
      }),
      needsApproval: true,
      execute: async ({ placeId, elementId, description }) => {
        return repo.createBarrierReport({
          userId: ctx.userId,
          placeId,
          elementId,
          description,
        });
      },
    }),

    shareAccessPassport: tool({
      description:
        "Share selected passport fields for a defined purpose. Requires explicit user approval.",
      inputSchema: z.object({
        passportId: z.string().min(1),
        recipient: z.string().min(1),
        purpose: z.string().min(1),
        fieldsShared: z.array(z.string()).min(1),
        durationHours: z.number().int().positive().optional(),
      }),
      needsApproval: true,
      execute: async ({
        passportId,
        recipient,
        purpose,
        fieldsShared,
        durationHours,
      }) => {
        // Ownership check
        await repo.getPassport(ctx.userId, passportId);
        return repo.sharePassport({
          userId: ctx.userId,
          passportId,
          recipient,
          purpose,
          fieldsShared,
          durationHours,
        });
      },
    }),
  };
}

export type AccessIntelligenceTools = ReturnType<
  typeof createAccessIntelligenceTools
>;
