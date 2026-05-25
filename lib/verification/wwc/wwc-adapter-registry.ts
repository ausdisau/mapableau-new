import { actWwvpAdapter } from "@/lib/verification/wwc/act-wwvp-adapter";
import { manualWwcAdapter } from "@/lib/verification/wwc/manual-wwc-adapter";
import { nswWwcAdapter } from "@/lib/verification/wwc/nsw-wwc-adapter";
import { ntOchreCardAdapter } from "@/lib/verification/wwc/nt-ochre-card-adapter";
import { qldBlueCardAdapter } from "@/lib/verification/wwc/qld-blue-card-adapter";
import { saWwcAdapter } from "@/lib/verification/wwc/sa-wwc-adapter";
import { tasRwvpAdapter } from "@/lib/verification/wwc/tas-rwvp-adapter";
import type { WwcAdapter } from "@/lib/verification/wwc/wwc-adapter";
import { vicWwcAdapter } from "@/lib/verification/wwc/vic-wwc-adapter";
import { waWwcAdapter } from "@/lib/verification/wwc/wa-wwc-adapter";
import type { WwcCheckType, WwcJurisdiction } from "@/types/wwc-verification";

const jurisdictionAdapters: WwcAdapter[] = [
  nswWwcAdapter,
  vicWwcAdapter,
  qldBlueCardAdapter,
  waWwcAdapter,
  saWwcAdapter,
  tasRwvpAdapter,
  actWwvpAdapter,
  ntOchreCardAdapter,
];

export function resolveWwcAdapter(
  jurisdiction: WwcJurisdiction,
  checkType: WwcCheckType,
  preferManual = true
): WwcAdapter {
  if (preferManual && manualWwcAdapter.supports(jurisdiction, checkType)) {
    return manualWwcAdapter;
  }
  const match = jurisdictionAdapters.find((a) =>
    a.supports(jurisdiction, checkType)
  );
  return match ?? manualWwcAdapter;
}

export function listWwcAdapters(): WwcAdapter[] {
  return [manualWwcAdapter, ...jurisdictionAdapters];
}
