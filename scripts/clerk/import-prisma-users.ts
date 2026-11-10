/**
 * Trickle / bulk NextAuth → Clerk user import.
 *
 * Maps Prisma `User.id` → Clerk `external_id` and imports bcrypt
 * `passwordHash` digests so existing passwords keep working.
 *
 * Default is dry-run. Pass `--apply` to create users via the Clerk Backend API.
 *
 * Usage:
 *   pnpm tsx scripts/clerk/import-prisma-users.ts
 *   pnpm tsx scripts/clerk/import-prisma-users.ts --apply --limit=50
 */

import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";

const APPLY = process.argv.includes("--apply");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : undefined;

function requireSecretKey(): string {
  const key = process.env.CLERK_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "CLERK_SECRET_KEY is required. Pull keys with: pnpm dlx clerk@latest env pull",
    );
  }
  return key;
}

function splitName(name: string): { firstName?: string; lastName?: string } {
  const trimmed = name.trim();
  if (!trimmed) return {};
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

async function main() {
  const prisma = new PrismaClient();
  const clerk = createClerkClient({ secretKey: requireSecretKey() });

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        passwordHash: true,
        locale: true,
        timezone: true,
        primaryRole: true,
      },
      orderBy: { createdAt: "asc" },
      ...(LIMIT && Number.isFinite(LIMIT) ? { take: LIMIT } : {}),
    });

    console.log(
      JSON.stringify(
        {
          mode: APPLY ? "apply" : "dry-run",
          candidateCount: users.length,
          passwordHasher: "bcrypt",
          externalIdStrategy: "prisma.user.id",
        },
        null,
        2,
      ),
    );

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
      const email = user.email.trim().toLowerCase();
      const passwordHash = user.passwordHash?.trim();
      const { firstName, lastName } = splitName(user.name);
      const payload = {
        emailAddress: [email],
        externalId: user.id,
        firstName,
        lastName,
        locale: user.locale || undefined,
        timezone: user.timezone || undefined,
        publicMetadata: {
          mapablePrimaryRole: user.primaryRole,
          migratedFrom: "next-auth",
        },
        ...(passwordHash
          ? {
              passwordDigest: passwordHash,
              passwordHasher: "bcrypt" as const,
            }
          : {
              skipPasswordRequirement: true,
            }),
        ...(user.phone?.trim()
          ? { phoneNumber: [user.phone.trim()] }
          : {}),
      };

      if (!APPLY) {
        console.log(
          JSON.stringify({
            action: "would-create",
            externalId: user.id,
            email,
            hasPasswordDigest: Boolean(passwordHash),
          }),
        );
        skipped += 1;
        continue;
      }

      try {
        const createdUser = await clerk.users.createUser(payload);
        created += 1;
        console.log(
          JSON.stringify({
            action: "created",
            clerkUserId: createdUser.id,
            externalId: user.id,
            email,
          }),
        );
      } catch (error) {
        failed += 1;
        const message =
          error instanceof Error ? error.message : "unknown createUser error";
        console.error(
          JSON.stringify({
            action: "failed",
            externalId: user.id,
            email,
            message,
          }),
        );
      }
    }

    console.log(
      JSON.stringify(
        {
          summary: {
            mode: APPLY ? "apply" : "dry-run",
            created,
            skippedDryRun: APPLY ? 0 : skipped,
            failed,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
