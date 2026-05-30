/**
 * Create or complete a MapAble user (role assignment + participant profile).
 *
 * Usage:
 *   npx tsx scripts/ensure-mapable-user.ts --email jonathan.shar@hotmail.com --name "Jonathan Shar"
 *   npx tsx scripts/ensure-mapable-user.ts --email jonathan.shar@hotmail.com --role mapable_admin
 *
 * Requires DATABASE_URL or DIRECT_URL in the environment.
 */

import { PrismaClient, type MapAbleUserRole } from "@prisma/client";

const PASSWORD_HASH =
  "$2b$10$iLyIbD98gF/4Wnghy5CnY.m4JK0/bL8CLbc/pUtnQ/nXr4Wuep.8O";

function parseArgs(argv: string[]) {
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const email = get("--email");
  if (!email) {
    console.error(
      "Usage: npx tsx scripts/ensure-mapable-user.ts --email <email> [--name \"Full Name\"] [--role participant] [--reset-password]"
    );
    process.exit(1);
  }
  return {
    email: email.toLowerCase().trim(),
    name: get("--name") ?? email.split("@")[0] ?? "MapAble User",
    role: (get("--role") ?? "participant") as MapAbleUserRole,
    resetPassword: argv.includes("--reset-password"),
  };
}

async function main() {
  const { email, name, role, resetPassword } = parseArgs(process.argv.slice(2));
  const prisma = new PrismaClient();

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      name,
      email,
      passwordHash: PASSWORD_HASH,
      primaryRole: role,
      phone: null,
    },
    update: {
      name,
      primaryRole: role,
      ...(resetPassword ? { passwordHash: PASSWORD_HASH } : {}),
    },
  });

  await prisma.userRoleAssignment.upsert({
    where: { userId_role: { userId: user.id, role } },
    create: { userId: user.id, role, isPrimary: true },
    update: { isPrimary: true },
  });

  if (role === "participant") {
    const displayName = name;
    await prisma.participantProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        displayName,
        preferredName: displayName.split(" ")[0] ?? displayName,
      },
      update: { displayName },
    });

    await prisma.accessibilityProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });
  }

  console.log(JSON.stringify({ ok: true, userId: user.id, email, role, resetPassword }, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
