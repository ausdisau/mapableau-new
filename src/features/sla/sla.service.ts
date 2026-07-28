import { randomUUID } from "node:crypto";

import { and, eq, inArray, max, ne, sql } from "drizzle-orm";

import {
  ndisPlanCache,
  participantSlas,
  slaTemplates,
  slaVariants,
  users,
  type ParticipantSla,
} from "@shared/schema";
import { db } from "../../../server/db";
import { renderSlaDocument, SlaRenderError } from "./sla.render";
import {
  SLA_CORE_TEMPLATE_KEY,
  SLA_MODULES,
  SLA_VARIANTS,
} from "./sla.templates";
import type {
  GenerateSlaInput,
  SlaModuleOption,
  SlaParameters,
  SlaTemplateSource,
  SlaVariantSource,
} from "./sla.types";

export class SlaServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "SlaServiceError";
  }
}

function parseParams(raw: string | null, variantId: string): SlaParameters {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || Array.isArray(value) || typeof value !== "object") {
      throw new Error("expected an object");
    }
    return value as SlaParameters;
  } catch (error) {
    throw new SlaServiceError(
      `Stored default parameters for ${variantId} are invalid: ${(error as Error).message}`,
      500,
      "INVALID_VARIANT_CONFIGURATION",
    );
  }
}

function validateCustomParameters(parameters: SlaParameters | undefined): void {
  if (!parameters) return;
  for (const [key, value] of Object.entries(parameters)) {
    if (!/^[a-zA-Z][a-zA-Z0-9]{0,63}$/.test(key)) {
      throw new SlaServiceError(
        `Invalid custom parameter name: ${key}`,
        400,
        "INVALID_CUSTOM_PARAMETERS",
      );
    }
    if (!["string", "number", "boolean"].includes(typeof value)) {
      throw new SlaServiceError(
        `Invalid value for custom parameter: ${key}`,
        400,
        "INVALID_CUSTOM_PARAMETERS",
      );
    }
    if (typeof value === "string" && value.length > 500) {
      throw new SlaServiceError(
        `Custom parameter is too long: ${key}`,
        400,
        "INVALID_CUSTOM_PARAMETERS",
      );
    }
  }
}

function dateOnly(value: Date = new Date()): string {
  return value.toISOString().slice(0, 10);
}

function agreementReference(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const suffix = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
  return `MAP-AG-${year}-${suffix}`;
}

async function getTemplateAndVariantSources(input: GenerateSlaInput): Promise<{
  coreTemplate: SlaTemplateSource;
  moduleTemplates: SlaTemplateSource[];
  variants: SlaVariantSource[];
}> {
  const selectedModuleIds = input.selectedModules.map((selection) => selection.moduleId);
  const selectedVariantIds = input.selectedModules.flatMap((selection) => selection.variantIds);
  const templateKeys = [
    SLA_CORE_TEMPLATE_KEY,
    ...SLA_MODULES.filter((module) => selectedModuleIds.includes(module.moduleId)).map(
      (module) => module.templateKey,
    ),
  ];

  const [templateRows, variantRows] = await Promise.all([
    db.select().from(slaTemplates).where(inArray(slaTemplates.key, templateKeys)),
    selectedVariantIds.length > 0
      ? db.select().from(slaVariants).where(inArray(slaVariants.variantId, selectedVariantIds))
      : Promise.resolve([]),
  ]);

  const coreTemplate = templateRows.find((template) => template.key === SLA_CORE_TEMPLATE_KEY);
  if (!coreTemplate) {
    throw new SlaServiceError(
      "The active core SLA template is not installed",
      503,
      "SLA_TEMPLATES_NOT_READY",
    );
  }

  return {
    coreTemplate,
    moduleTemplates: templateRows.filter((template) => template.type === "module"),
    variants: variantRows,
  };
}

export async function listSlaModules(): Promise<SlaModuleOption[]> {
  const [templateRows, variantRows] = await Promise.all([
    db
      .select({ key: slaTemplates.key, moduleId: slaTemplates.moduleId })
      .from(slaTemplates)
      .where(eq(slaTemplates.type, "module")),
    db.select().from(slaVariants),
  ]);
  const installedTemplateKeys = new Set(templateRows.map((row) => row.key));

  return SLA_MODULES.filter((module) => installedTemplateKeys.has(module.templateKey)).map(
    (module) => ({
      ...module,
      variants: SLA_VARIANTS.filter((definition) => definition.moduleId === module.moduleId)
        .map((definition) => {
          const stored = variantRows.find((row) => row.variantId === definition.variantId);
          if (!stored) return null;
          return {
            variantId: stored.variantId,
            name: stored.name,
            description: definition.description,
            defaultParams: parseParams(stored.defaultParams, stored.variantId),
          };
        })
        .filter((variant): variant is NonNullable<typeof variant> => variant !== null),
    }),
  );
}

export async function generateParticipantSla(input: GenerateSlaInput): Promise<ParticipantSla> {
  const participantId = input.participantId;
  if (!participantId) {
    throw new SlaServiceError(
      "A participant is required",
      400,
      "PARTICIPANT_REQUIRED",
    );
  }
  validateCustomParameters(input.customParameters);

  const [participant] = await db.select().from(users).where(eq(users.id, participantId));
  if (!participant) {
    throw new SlaServiceError("Participant not found", 404, "PARTICIPANT_NOT_FOUND");
  }
  if (participant.role !== "participant") {
    throw new SlaServiceError(
      "An SLA can only be generated for a participant account",
      400,
      "INVALID_PARTICIPANT",
    );
  }

  if (input.participantPlanId) {
    const [plan] = await db
      .select({ id: ndisPlanCache.id })
      .from(ndisPlanCache)
      .where(
        and(
          eq(ndisPlanCache.id, input.participantPlanId),
          eq(ndisPlanCache.participantId, participantId),
        ),
      );
    if (!plan) {
      throw new SlaServiceError(
        "Participant plan not found",
        404,
        "PARTICIPANT_PLAN_NOT_FOUND",
      );
    }
  }

  const sources = await getTemplateAndVariantSources(input);
  const reference = agreementReference();
  const parameters: SlaParameters = {
    ...(input.customParameters ?? {}),
    participantName: participant.fullName,
    ndisNumber: participant.ndisNumber || "Not provided",
    planStartDate: participant.planStartDate || "Not provided",
    planEndDate: participant.planEndDate || "Not provided",
    agreementDate: dateOnly(),
    agreementReference: reference,
  };

  let contentMarkdown: string;
  try {
    contentMarkdown = renderSlaDocument({
      agreementReference: reference,
      ...sources,
      selectedModules: input.selectedModules,
      parameters,
    });
  } catch (error) {
    if (error instanceof SlaRenderError) {
      throw new SlaServiceError(error.message, 400, "INVALID_SLA_SELECTION");
    }
    throw error;
  }

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${participantId}))`);
    const [current] = await tx
      .select({ version: max(participantSlas.version) })
      .from(participantSlas)
      .where(eq(participantSlas.userId, participantId));
    const version = (current?.version ?? 0) + 1;

    const [created] = await tx
      .insert(participantSlas)
      .values({
        userId: participantId,
        participantPlanId: input.participantPlanId,
        agreementReference: reference,
        selectedModules: JSON.stringify(input.selectedModules),
        customParameters: input.customParameters
          ? JSON.stringify(input.customParameters)
          : null,
        contentMarkdown,
        version,
        status: "draft",
      })
      .returning();
    return created;
  });
}

export async function acceptParticipantSla(
  participantId: string,
  slaId: number,
): Promise<ParticipantSla> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${participantId}))`);
    const [agreement] = await tx
      .select()
      .from(participantSlas)
      .where(and(eq(participantSlas.id, slaId), eq(participantSlas.userId, participantId)));

    if (!agreement) {
      throw new SlaServiceError("SLA not found", 404, "SLA_NOT_FOUND");
    }
    if (agreement.status === "active") {
      return agreement;
    }
    if (agreement.status === "superseded") {
      throw new SlaServiceError(
        "A superseded SLA cannot be accepted",
        409,
        "SLA_SUPERSEDED",
      );
    }

    const acceptedAt = new Date();
    await tx
      .update(participantSlas)
      .set({ status: "superseded" })
      .where(
        and(
          eq(participantSlas.userId, participantId),
          eq(participantSlas.status, "active"),
          ne(participantSlas.id, slaId),
        ),
      );

    const [active] = await tx
      .update(participantSlas)
      .set({
        status: "active",
        acceptedAt,
        acceptedByUserId: participantId,
        acceptanceMethod: "authenticated_api",
      })
      .where(and(eq(participantSlas.id, slaId), eq(participantSlas.status, "draft")))
      .returning();

    if (!active) {
      throw new SlaServiceError(
        "The SLA status changed before it could be accepted",
        409,
        "SLA_STATUS_CHANGED",
      );
    }
    return active;
  });
}
