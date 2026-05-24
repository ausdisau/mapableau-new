export { abrLookupConfig, isAbrLookupLiveEnabled } from "@/lib/abn-lookup/config";
export { formatAbn, normalizeAbnDigits } from "@/lib/abn-lookup/format-abn";
export {
  lookupAbn,
  AbnLookupError,
  formatAbnForDisplay,
} from "@/lib/abn-lookup/abn-lookup-client";
export { validateAbnChecksum } from "@/lib/abn-lookup/validate-abn";
export { parseAbrSearchByAbnXml } from "@/lib/abn-lookup/parse-response";
export { scoreNameMatch } from "@/lib/abn-lookup/match-organisation";
export type {
  AbnLookupResult,
  AbnCheckNotes,
  AbnEntityStatus,
  OrganisationNameMatch,
} from "@/lib/abn-lookup/types";
export {
  MOCK_ABN_ACTIVE,
  MOCK_ABN_CANCELLED,
  MOCK_ABN_NAME_MISMATCH,
} from "@/lib/abn-lookup/mock-fixtures";
