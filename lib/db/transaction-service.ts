import type { Prisma } from "@prisma/client";

import { getDbClient, type DbTransaction } from "@/lib/db/db-client";

export type TransactionCallback<T> = (tx: DbTransaction) => Promise<T>;

export async function runInTransaction<T>(
  fn: TransactionCallback<T>,
  options?: { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel }
): Promise<T> {
  const db = getDbClient();
  return db.$transaction(fn, options);
}
