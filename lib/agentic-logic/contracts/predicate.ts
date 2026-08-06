import { z } from "zod";

export const ArgType = z.enum(["string", "number", "boolean", "uuid", "any"]);
export type ArgType = z.infer<typeof ArgType>;

export const PredicateArg = z.object({
  name: z.string(),
  type: ArgType,
  description: z.string().optional(),
});

export const PredicateSchema = z.object({
  name: z.string(),
  arity: z.number().int().min(1),
  args: z.array(PredicateArg),
  description: z.string().optional(),
  allowedTenants: z.array(z.string()).optional(),
});

export type Predicate = z.infer<typeof PredicateSchema>;
