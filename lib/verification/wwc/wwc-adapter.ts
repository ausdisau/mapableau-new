import type {
  WwcCheckType,
  WwcJurisdiction,
  WwcVerificationInput,
  WwcVerificationResult,
} from "@/types/wwc-verification";

export type WwcAdapterCheckInput = WwcVerificationInput & {
  workerProfileId: string;
  organisationId: string;
};

export interface WwcAdapter {
  check(input: WwcAdapterCheckInput): Promise<WwcVerificationResult>;
  supports(jurisdiction: WwcJurisdiction, checkType: WwcCheckType): boolean;
  getSourceName(): string;
}
