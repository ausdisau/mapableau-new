import { randomBytes } from "crypto";

import type {
  AccessAsset,
  AccessAssetType,
  AccessPublicVisibility,
  AccessSecurityClassification,
} from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

import {
  type AccessAssetDto,
  isRestrictedClassification,
  mapAccessAssetDto,
} from "../types";

const createAssetSchema = z.object({
  title: z.string().min(1),
  sourceSystem: z.string().min(1),
});

export interface CreateAccessAssetInput {
  assetType: AccessAssetType;
  title: string;
  sourceSystem: string;
  tenantId?: string | null;
  parentAssetId?: string | null;
  placeId?: string | null;
  venueId?: string | null;
  floorPlanId?: string | null;
  geometryReference?: string | null;
  geometryType?: string | null;
  indoorLevel?: string | null;
  plainLanguageDescription?: string | null;
  ownerEntityId?: string | null;
  operatorEntityId?: string | null;
  maintainerEntityId?: string | null;
  jurisdiction?: string;
  publicVisibility?: AccessPublicVisibility;
  securityClassification?: AccessSecurityClassification;
  sourceReference?: string | null;
  dataSourceId?: string | null;
  dataLicence?: string | null;
}

export function createAccessAssetPublicIdentifier(): string {
  return `acc_${Date.now().toString(36)}_${randomBytes(10).toString("base64url")}`;
}

function normalizeVisibility(
  visibility: AccessPublicVisibility | undefined,
  classification: AccessSecurityClassification,
): AccessPublicVisibility {
  if (isRestrictedClassification(classification)) return "never_public";
  return visibility ?? "public";
}

export function toAccessAssetDto(asset: AccessAsset): AccessAssetDto {
  return mapAccessAssetDto(asset);
}

export async function createAccessAsset(
  input: CreateAccessAssetInput,
): Promise<AccessAssetDto> {
  createAssetSchema.parse(input);
  const securityClassification = input.securityClassification ?? "public";
  const asset = await prisma.accessAsset.create({
    data: {
      publicIdentifier: createAccessAssetPublicIdentifier(),
      assetType: input.assetType,
      title: input.title,
      sourceSystem: input.sourceSystem,
      tenantId: input.tenantId ?? null,
      parentAssetId: input.parentAssetId ?? null,
      placeId: input.placeId ?? null,
      venueId: input.venueId ?? null,
      floorPlanId: input.floorPlanId ?? null,
      geometryReference: input.geometryReference ?? null,
      geometryType: input.geometryType ?? null,
      indoorLevel: input.indoorLevel ?? null,
      plainLanguageDescription: input.plainLanguageDescription ?? null,
      ownerEntityId: input.ownerEntityId ?? null,
      operatorEntityId: input.operatorEntityId ?? null,
      maintainerEntityId: input.maintainerEntityId ?? null,
      jurisdiction: input.jurisdiction ?? "AU",
      publicVisibility: normalizeVisibility(
        input.publicVisibility,
        securityClassification,
      ),
      securityClassification,
      sourceReference: input.sourceReference ?? null,
      dataSourceId: input.dataSourceId ?? null,
      dataLicence: input.dataLicence ?? null,
    },
  });
  return toAccessAssetDto(asset);
}

export async function getAccessAsset(
  idOrPublicIdentifier: string,
  options: { includeRestricted?: boolean } = {},
): Promise<AccessAssetDto | null> {
  const asset = await prisma.accessAsset.findFirst({
    where: {
      OR: [
        { id: idOrPublicIdentifier },
        { publicIdentifier: idOrPublicIdentifier },
      ],
    },
  });
  if (!asset) return null;
  if (!options.includeRestricted && !normalizePublicRead(asset)) return null;
  return toAccessAssetDto(asset);
}

function normalizePublicRead(asset: AccessAsset): boolean {
  return (
    !isRestrictedClassification(asset.securityClassification) &&
    asset.publicVisibility !== "never_public" &&
    asset.publicVisibility !== "restricted"
  );
}

export async function publishAccessAsset(
  assetId: string,
): Promise<AccessAssetDto> {
  const asset = await prisma.accessAsset.findUniqueOrThrow({
    where: { id: assetId },
  });
  if (isRestrictedClassification(asset.securityClassification)) {
    throw new Error("RESTRICTED_ASSET_CANNOT_BE_PUBLIC");
  }
  const updated = await prisma.accessAsset.update({
    where: { id: assetId },
    data: { lifecycleStatus: "active", publicVisibility: "public" },
  });
  return toAccessAssetDto(updated);
}

export async function retireAccessAsset(
  assetId: string,
  retiredAt: Date = new Date(),
): Promise<AccessAssetDto> {
  const updated = await prisma.accessAsset.update({
    where: { id: assetId },
    data: {
      lifecycleStatus: "retired",
      publicVisibility: "never_public",
      effectiveTo: retiredAt,
    },
  });
  return toAccessAssetDto(updated);
}
