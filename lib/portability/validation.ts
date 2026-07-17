import { z } from "zod";

export const portableBundleSchema = z.object({
  bundleVersion: z.string(),
  subjectPairwiseId: z.string(),
  functionalNeeds: z.array(z.string()).default([]),
  communicationPreferences: z.array(z.string()).default([]),
  environmentalNeeds: z.array(z.string()).default([]),
  serviceHistorySummary: z
    .object({
      providerCount: z.number().nonnegative(),
      firstSeen: z.string().nullish(),
      lastSeen: z.string().nullish(),
    })
    .nullish(),
  receipts: z.array(z.string()).default([]),
  disclaimer: z.string(),
});

export type PortableBundle = z.infer<typeof portableBundleSchema>;

export function validatePortableBundle(input: unknown): PortableBundle {
  return portableBundleSchema.parse(input);
}
