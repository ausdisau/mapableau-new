import type { WwcAdapter, WwcAdapterCheckInput } from "@/lib/verification/wwc/wwc-adapter";
import type {
  WwcCheckType,
  WwcJurisdiction,
  WwcVerificationResult,
} from "@/types/wwc-verification";

/** Placeholder for future jurisdiction-specific registry integrations (server-side only). */
export function createPlaceholderAdapter(
  sourceName: string,
  jurisdiction: WwcJurisdiction,
  checkTypes: WwcCheckType[]
): WwcAdapter {
  return {
    getSourceName: () => sourceName,
    supports: (j, ct) => j === jurisdiction && checkTypes.includes(ct),
    async check(_input: WwcAdapterCheckInput): Promise<WwcVerificationResult> {
      return {
        success: false,
        verifiedName: null,
        verifiedResult: "adapter_not_implemented",
        message: `${sourceName} automated lookup is not enabled. Use manual review.`,
        payload: { jurisdiction, adapter: sourceName },
        checkedAt: new Date().toISOString(),
      };
    },
  };
}
