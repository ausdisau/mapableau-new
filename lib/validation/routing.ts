import { z } from "zod";

const stopRefSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("coordinate"),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  z.object({ type: z.literal("participant_location"), id: z.string().min(1) }),
  z.object({ type: z.literal("service_site"), id: z.string().min(1) }),
]);

export const directionsBodySchema = z.object({
  stops: z.array(stopRefSchema).min(2).max(25),
  profile: z.string().optional(),
});

export const matrixBodySchema = z.object({
  points: z
    .array(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
    )
    .min(2)
    .max(50),
});
