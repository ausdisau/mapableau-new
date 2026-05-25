import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type DbClient = PrismaClient;
export type DbTransaction = Prisma.TransactionClient;

/** Shared database client singleton (Postgres via Prisma). */
export function getDbClient(): DbClient {
  return prisma;
}

export const db = prisma;

export function isDbClient(value: unknown): value is DbClient {
  return (
    typeof value === "object" &&
    value !== null &&
    "$connect" in value &&
    typeof (value as DbClient).$connect === "function"
  );
}
