import { z } from "zod";

export const ACCESS_MISSION_STATUSES = [
  "draft",
  "queued_offline",
  "ready_to_sync",
  "synced",
  "failed",
  "cancelled",
] as const;

export const ACCESS_MISSION_TASK_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "skipped",
  "blocked",
] as const;

export const accessMissionTaskSchema = z
  .object({
    id: z.string().min(1),
    questId: z.string().min(1),
    label: z.string().min(1),
    status: z.enum(ACCESS_MISSION_TASK_STATUSES),
    placeId: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    completedAt: z.string().optional(),
    observationId: z.string().optional(),
  })
  .strict();

export const accessMissionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(ACCESS_MISSION_STATUSES),
    tasks: z.array(accessMissionTaskSchema),
    actorRef: z.string().min(1),
    createdAt: z.string(),
    updatedAt: z.string(),
    idempotencyKey: z.string().min(8).max(128),
    odkFormId: z.string().optional(),
  })
  .strict();

export type AccessMission = z.infer<typeof accessMissionSchema>;
export type AccessMissionTask = z.infer<typeof accessMissionTaskSchema>;

export const accessMissionDraftInputSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    questIds: z.array(z.string().min(1)).min(1),
    actorRef: z.string().min(1),
    idempotencyKey: z.string().min(8).max(128),
    placeId: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  })
  .strict();

export type AccessMissionDraftInput = z.infer<typeof accessMissionDraftInputSchema>;
