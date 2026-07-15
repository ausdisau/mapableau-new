/**
 * Prisma-backed repository placeholder.
 * Demo mode remains the default runtime. Flip ACCESS_INTELLIGENCE_USE_PRISMA=true
 * and implement mapping once places are seeded into ai_* tables.
 */
export async function isPrismaAccessIntelligenceReady(): Promise<boolean> {
  return (
    process.env.ACCESS_INTELLIGENCE_DEMO_MODE === "false" &&
    process.env.ACCESS_INTELLIGENCE_USE_PRISMA === "true"
  );
}
