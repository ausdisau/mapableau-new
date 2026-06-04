import { z } from "zod";

const ausStateSchema = z.enum([
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
]);

export const postcodeSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(80),
  state: ausStateSchema.optional(),
  excludePostBox: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v === "true"),
});

const parcelDimsSchema = z.object({
  fromPostcode: z.string().trim().regex(/^\d{4}$/, "fromPostcode must be 4 digits"),
  toPostcode: z.string().trim().regex(/^\d{4}$/, "toPostcode must be 4 digits"),
  length: z.coerce.number().positive().max(200),
  width: z.coerce.number().positive().max(200),
  height: z.coerce.number().positive().max(200),
  weight: z.coerce.number().positive().max(500),
});

export const domesticParcelServiceQuerySchema = parcelDimsSchema;

export const domesticParcelCalculateQuerySchema = parcelDimsSchema.extend({
  serviceCode: z.string().trim().min(1).max(80),
  optionCode: z.string().trim().max(80).optional(),
  suboptionCode: z.string().trim().max(80).optional(),
  extraCover: z.coerce.number().int().min(0).max(50_000).optional(),
});
