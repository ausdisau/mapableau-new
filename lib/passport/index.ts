export {
  REVOCATION_PROPAGATION_SLA_MS,
  assertRevocationPropagatedWithinSla,
  getPassportProjection,
  getRevocationState,
  invalidatePassportProjectionCache,
  isPassportProjectionCacheValid,
  resetPassportProjectionCacheForTests,
  setPassportProjection,
} from "./projection-cache";

export {
  CONSENT_SCOPE_FIELD_CATEGORIES,
  EMPLOYER_FORBIDDEN_FIELD_CATEGORIES,
  EMPLOYER_FORBIDDEN_PASSPORT_KEYS,
  assertEmployerFieldCategoriesSafe,
  fieldCategoriesForConsentScope,
  filterFieldCategoriesForRecipient,
  filterPassportPayloadForRecipient,
} from "./disclosure-policy";

export {
  projectPassportCompatibility,
  type PassportCompatibilityGap,
  type PassportCompatibilityProjection,
} from "./compatibility-projection";

export {
  DELEGATABLE_CONSENT_SCOPES,
  DelegateScopeError,
  assertDelegatableConsentScope,
  validateDelegateConsentScopes,
} from "./delegate-scope-validation";
