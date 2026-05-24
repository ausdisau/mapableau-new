import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const allTables = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY 1
  `;
  console.log("All public tables:", allTables.length);
  for (const t of allTables) console.log(" -", t.table_name);

  const tables = allTables.filter((t) =>
    t.table_name.toLowerCase().includes("provider"),
  );
  console.log("\nProvider-related tables:");
  for (const t of tables) console.log(" -", t.table_name);

  const providerExists = tables.some((t) => t.table_name === "Provider");
  if (providerExists) {
    const cols = await prisma.$queryRaw<
      { column_name: string; data_type: string; is_nullable: string }[]
    >`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Provider'
      ORDER BY ordinal_position
    `;
    console.log("\nProvider columns:");
    for (const c of cols) {
      console.log(`  ${c.column_name}: ${c.data_type} nullable=${c.is_nullable}`);
    }
    const count = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM "Provider"
    `;
    console.log("\nProvider row count:", String(count[0]?.count ?? 0));
    const sample = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT * FROM "Provider" LIMIT 2
    `;
    console.log("\nSample row keys:", Object.keys(sample[0] ?? {}));
  }

  const lower = tables.find((t) => t.table_name === "providers");
  if (lower) {
    const cols = await prisma.$queryRaw<
      { column_name: string; data_type: string }[]
    >`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'providers'
      ORDER BY ordinal_position
    `;
    console.log("\nproviders columns:");
    for (const c of cols) console.log(`  ${c.column_name}: ${c.data_type}`);
    const count = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM providers
    `;
    console.log("providers row count:", String(count[0]?.count ?? 0));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
