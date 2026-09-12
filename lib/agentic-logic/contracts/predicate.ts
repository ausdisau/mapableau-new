import { z } from "zod";

export const ArgType = z.enum(["string", "number", "boolean", "uuid", "any"]);
export type ArgType = z.infer<typeof ArgType>;

export const PredicateArg = z.object({
  name: z.string(),
  type: ArgType,
  description: z.string().optional(),
});

export const PredicateSchema = z
  .object({
    name: z.string(),
    arity: z.number().int().min(1),
    args: z.array(PredicateArg),
    description: z.string().optional(),
    allowedTenants: z.array(z.string()).optional(),
  })
  .superRefine((predicate, ctx) => {
    if (predicate.arity !== predicate.args.length) {
      ctx.addIssue({
        code: "custom",
        path: ["arity"],
        message: "Arity must equal the number of arguments",
      });
    }
  });

export type Predicate = z.infer<typeof PredicateSchema>;
