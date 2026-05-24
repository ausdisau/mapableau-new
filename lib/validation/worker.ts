import { z } from "zod";

import { contractorAbnSchema } from "@/lib/validation/verification";

export const patchWorkerProfileSchema = z.object({
  displayName: z.string().min(1).max(200).optional(),
  profileSummary: z.string().max(5000).optional().nullable(),
  serviceTypes: z.array(z.string()).optional(),
  contractorAbn: contractorAbnSchema,
});
