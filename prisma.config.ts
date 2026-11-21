/**
 * Prisma 6.19.x CLI configuration.
 * Keep datasource URL and directUrl in prisma/schema.prisma until a
 * separately reviewed Prisma 7 migration. No production DB changes.
 */
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
});
