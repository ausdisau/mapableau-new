/**
 * Use `export const dynamic = "force-dynamic"` in layouts (Next.js requires the literal).
 * Prisma-backed or auth-gated modules should set this in their layout.tsx.
 */
export const MODULE_DYNAMIC_LITERAL = "force-dynamic" as const;

export const MODULE_MAIN_CLASS = "mx-auto max-w-6xl px-4 py-8" as const;
