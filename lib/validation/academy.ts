import { z } from "zod";

export const academyEnrolSchema = z.object({
  courseId: z.string().min(1),
  extendedTime: z.boolean().optional(),
});

export const quizSubmitSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedIndex: z.number().int().min(0),
    }),
  ),
});

export const createCourseSchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  title: z.string().min(2).max(200),
  summary: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  category: z.string().max(64).optional(),
  estimatedMinutes: z.number().int().min(5).max(600).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});
