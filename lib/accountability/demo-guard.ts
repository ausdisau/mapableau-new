import { DEMONSTRATION_DATA_BANNER } from "@/lib/config/accountability";

export function assertDemoSeedAllowed(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Accountability demonstration seed is blocked in production. Never seed invented pilot outcomes into production."
    );
  }
  if (process.env.ALLOW_ACCOUNTABILITY_DEMO_SEED === "false") {
    throw new Error("ALLOW_ACCOUNTABILITY_DEMO_SEED=false — skipping demo seed.");
  }
}

export function demonstrationBanner(): string {
  return DEMONSTRATION_DATA_BANNER;
}

export function withDemonstrationFlag<T extends { isDemonstration?: boolean }>(
  item: T
): T & { demonstrationBanner: string | null } {
  return {
    ...item,
    demonstrationBanner: item.isDemonstration
      ? DEMONSTRATION_DATA_BANNER
      : null,
  };
}
