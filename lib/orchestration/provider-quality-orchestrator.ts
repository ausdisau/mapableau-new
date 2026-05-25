import { recalculateProviderQuality } from "@/lib/provider-quality/provider-quality-service";
import { isModuleEnabled } from "@/lib/feature-flags/server-feature-flag";

export async function refreshProviderQualityIfEnabled(
  organisationId: string,
  triggeredById?: string
) {
  if (!(await isModuleEnabled("provider_quality_signals_enabled"))) {
    return { skipped: true };
  }
  return recalculateProviderQuality(organisationId, triggeredById);
}
