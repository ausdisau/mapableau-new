import type { WwcAdapter, WwcAdapterCheckInput } from "@/lib/verification/wwc/wwc-adapter";
import type {
  WwcCheckType,
  WwcJurisdiction,
  WwcVerificationResult,
} from "@/types/wwc-verification";
import { WWC_CHECK_TYPES_BY_JURISDICTION } from "@/types/wwc-verification";

/**
 * MVP: manual review path — records submission metadata only.
 * Does not call government portals or store criminal history.
 */
export class ManualWwcAdapter implements WwcAdapter {
  getSourceName(): string {
    return "MapAble manual review";
  }

  supports(jurisdiction: WwcJurisdiction, checkType: WwcCheckType): boolean {
    return WWC_CHECK_TYPES_BY_JURISDICTION[jurisdiction]?.includes(checkType) ?? false;
  }

  async check(input: WwcAdapterCheckInput): Promise<WwcVerificationResult> {
    const verifiedName = `${input.legalFirstName} ${input.legalLastName}`.trim();
    return {
      success: true,
      verifiedName,
      verifiedResult: "pending_manual_review",
      message:
        "Submitted for MapAble review. Official registry confirmation is completed by an authorised reviewer — not via automated portal access.",
      payload: {
        source: this.getSourceName(),
        jurisdiction: input.jurisdiction,
        checkType: input.checkType,
        checkNumberLast4: input.checkNumber.slice(-4),
      },
      checkedAt: new Date().toISOString(),
    };
  }
}

export const manualWwcAdapter = new ManualWwcAdapter();
