import { z } from "zod";

import { getDonationsMaxCents, getDonationsMinCents } from "@/lib/donations/constants";

export const donationCheckoutSchema = z.object({
  amountCents: z
    .number()
    .int()
    .min(getDonationsMinCents(), {
      message: `Minimum donation is $${(getDonationsMinCents() / 100).toFixed(0)}`,
    })
    .max(getDonationsMaxCents(), {
      message: `Maximum donation is $${(getDonationsMaxCents() / 100).toLocaleString()}`,
    }),
  donorName: z.string().trim().max(120).optional(),
  message: z.string().trim().max(500).optional(),
  donorEmail: z.string().trim().email().max(254).optional(),
});

export type DonationCheckoutInput = z.infer<typeof donationCheckoutSchema>;

export const donationStatusQuerySchema = z.object({
  session_id: z.string().min(1),
});
