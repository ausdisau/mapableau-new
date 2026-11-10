/**
 * Independent default-OFF gate for the AccessiMart-by-MapAble review storefront.
 *
 * Does not reuse MAPABLE_MARKETPLACE_ENABLED or MapAble PR #10 alpha flags.
 */

export type AccessiMartReviewTester = {
  readonly id: string;
  readonly primaryRole: string;
};

export type AccessiMartReviewGate = {
  readonly enabled: boolean;
  readonly permittedUserIds: ReadonlySet<string>;
};

export function accessiMartReviewGateFromEnvironment(
  env: Record<string, string | undefined> = process.env,
): AccessiMartReviewGate {
  return {
    enabled: env.MAPABLE_ACCESSIMART_REVIEW_ENABLED === "true",
    permittedUserIds: new Set(
      (env.MAPABLE_ACCESSIMART_REVIEW_TESTER_IDS ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  };
}

/** No login, no tester allowlist, or no flag: deny. */
export function canAccessAccessiMartReview(
  user: AccessiMartReviewTester | null,
  gate: AccessiMartReviewGate,
): boolean {
  return Boolean(
    gate.enabled &&
      user &&
      (user.primaryRole === "mapable_admin" ||
        gate.permittedUserIds.has(user.id)),
  );
}
