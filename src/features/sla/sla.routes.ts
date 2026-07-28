import type { Express, NextFunction, Request, Response } from "express";
import { z } from "zod";

import { participantMarketplaceConfig } from "../../../lib/config/participant-marketplace";
import { storage } from "../../../server/storage";
import { requireAuth } from "../../../server/routes/shared";
import {
  acceptParticipantSla,
  generateParticipantSla,
  listSlaModules,
  SlaServiceError,
} from "./sla.service";

const selectedModuleSchema = z.object({
  moduleId: z.string().min(1).max(40),
  variantIds: z.array(z.string().min(1).max(80)).min(1).max(3),
});

const customParameterSchema = z.union([
  z.string().max(500),
  z.number().finite(),
  z.boolean(),
]);

const generateSlaSchema = z.object({
  participantId: z.string().min(1).max(100).optional(),
  participantPlanId: z.string().min(1).max(100).optional(),
  selectedModules: z.array(selectedModuleSchema).min(1).max(4),
  customParameters: z.record(z.string(), customParameterSchema).optional(),
});

const slaIdSchema = z.coerce.number().int().positive();
const acceptSlaSchema = z.object({
  accepted: z.literal(true),
});

function sendError(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (error instanceof SlaServiceError) {
    res.status(error.statusCode).json({ message: error.message, code: error.code });
    return;
  }
  next(error);
}

function requireSlaFeature(res: Response): boolean {
  if (participantMarketplaceConfig.serviceAgreementsEnabled) return true;
  res.status(503).json({
    message: "Service agreements are not enabled",
    code: "SLA_FEATURE_DISABLED",
  });
  return false;
}

export function registerSlaRoutes(app: Express): void {
  app.get("/api/sla/modules", requireAuth, async (req, res, next) => {
    try {
      if (!requireSlaFeature(res)) return;
      res.json({ modules: await listSlaModules() });
    } catch (error) {
      sendError(error, req, res, next);
    }
  });

  app.post("/api/sla/generate", requireAuth, async (req, res, next) => {
    try {
      if (!requireSlaFeature(res)) return;
      const parsed = generateSlaSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid SLA request",
          errors: parsed.error.flatten(),
        });
      }

      const actor = await storage.getUser(req.session.userId!);
      if (!actor) return res.status(401).json({ message: "Not authenticated" });

      const participantId = parsed.data.participantId ?? actor.id;
      if (actor.role !== "admin" && participantId !== actor.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const agreement = await generateParticipantSla({
        ...parsed.data,
        participantId,
      });
      return res.status(201).json({ agreement });
    } catch (error) {
      sendError(error, req, res, next);
    }
  });

  app.post("/api/sla/:id/accept", requireAuth, async (req, res, next) => {
    try {
      if (!requireSlaFeature(res)) return;
      const parsedId = slaIdSchema.safeParse(
        (req.params as Record<string, string | undefined>).id,
      );
      if (!parsedId.success) {
        return res.status(400).json({ message: "Invalid SLA id" });
      }
      const parsedAcceptance = acceptSlaSchema.safeParse(req.body);
      if (!parsedAcceptance.success) {
        return res.status(400).json({
          message: "Explicit acceptance is required",
          code: "SLA_ACCEPTANCE_REQUIRED",
        });
      }

      const actor = await storage.getUser(req.session.userId!);
      if (!actor) return res.status(401).json({ message: "Not authenticated" });
      if (actor.role !== "participant") {
        return res.status(403).json({
          message: "Only the participant can accept this SLA",
          code: "PARTICIPANT_ACCEPTANCE_REQUIRED",
        });
      }

      const agreement = await acceptParticipantSla(actor.id, parsedId.data);
      return res.json({ agreement });
    } catch (error) {
      sendError(error, req, res, next);
    }
  });
}
