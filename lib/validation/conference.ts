import { z } from "zod";

export const conferenceModeSchema = z.enum(["audio", "video"]);

export const startConferenceSchema = z.object({
  mode: conferenceModeSchema,
});
