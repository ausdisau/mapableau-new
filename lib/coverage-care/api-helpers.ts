import { jsonError } from "@/lib/api/response";
import {
  coverageCareDisabledPayload,
  isCoverageCareSurfaceEnabled,
} from "@/lib/coverage-care/flag-gate";
import { CoverageCarePermissionError } from "@/lib/coverage-care/permissions";

export function requireCoverageCareEnabledResponse(): Response | null {
  if (!isCoverageCareSurfaceEnabled()) {
    return Response.json(coverageCareDisabledPayload(), { status: 404 });
  }
  return null;
}

export function mapCoverageCareError(error: unknown): Response {
  if (error instanceof CoverageCarePermissionError) {
    return jsonError(error.message, 403);
  }
  if (error instanceof Error) {
    switch (error.message) {
      case "COVERAGE_CARE_DISABLED":
        return Response.json(coverageCareDisabledPayload(), { status: 404 });
      case "COVERAGE_CARE_BRANDOS_DISABLED":
        return jsonError("BrandOS preview is disabled", 404);
      case "COVERAGE_CARE_PROVISIONING_DISABLED":
        return jsonError("Provisioning preview is disabled", 404);
      case "ENQUIRY_NOT_FOUND":
      case "BRAND_CONTENT_NOT_FOUND":
        return jsonError(error.message, 404);
      case "ENQUIRY_NOT_EDITABLE":
      case "ENQUIRY_NOT_SUBMITTABLE":
      case "SHARE_PREVIEW_REQUIRED":
      case "ENQUIRY_NOT_IN_INBOX":
      case "ENQUIRY_ALREADY_CLOSED":
        return jsonError(error.message, 409);
      default:
        return jsonError(error.message || "Request failed", 400);
    }
  }
  return jsonError("Request failed", 500);
}
