import { platformPatternsConfig } from "@/lib/config/platform-patterns";
import { y1WedgeConfig } from "@/lib/config/y1-wedge";
import { checkConsent, grantConsent } from "@/lib/consent/consent-service";
import { requireConsent } from "@/lib/consent/require-consent";
import type { ConsentScope } from "@/types/mapable";

export type MicroConsentAction =
  | "support_profile.share_coordinator"
  | "support_profile.share_worker"
  | "match.backup_candidates"
  | "match.review";

const ACTION_SCOPE: Record<MicroConsentAction, ConsentScope> = {
  "support_profile.share_coordinator": "support_coordination.access",
  "support_profile.share_worker": "support_profile.read",
  "match.backup_candidates": "booking.manage",
  "match.review": "booking.manage",
};

export function isMicroConsentEnabled() {
  return (
    y1WedgeConfig.microConsentEnabled &&
    platformPatternsConfig.consentSharingPanelEnabled
  );
}

export async function requireMicroConsent(params: {
  action: MicroConsentAction;
  subjectUserId: string;
  actorUserId: string;
  grantedToUserId?: string;
  grantedToOrganisationId?: string;
}) {
  if (!isMicroConsentEnabled()) return;

  await requireConsent({
    subjectUserId: params.subjectUserId,
    scope: ACTION_SCOPE[params.action],
    grantedToUserId: params.grantedToUserId,
    grantedToOrganisationId: params.grantedToOrganisationId,
    actorUserId: params.actorUserId,
  });
}

export async function hasMicroConsent(params: {
  action: MicroConsentAction;
  subjectUserId: string;
  grantedToUserId?: string;
  grantedToOrganisationId?: string;
}) {
  return checkConsent({
    subjectUserId: params.subjectUserId,
    scope: ACTION_SCOPE[params.action],
    grantedToUserId: params.grantedToUserId,
    grantedToOrganisationId: params.grantedToOrganisationId,
  });
}

export async function recordMicroConsentGrant(params: {
  action: MicroConsentAction;
  subjectUserId: string;
  createdById: string;
  purpose: string;
  grantedToUserId?: string;
  grantedToOrganisationId?: string;
  shareMode?: "once" | "always_for_service";
}) {
  return grantConsent({
    subjectUserId: params.subjectUserId,
    scope: ACTION_SCOPE[params.action],
    purpose: params.purpose,
    createdById: params.createdById,
    grantedToUserId: params.grantedToUserId,
    grantedToOrganisationId: params.grantedToOrganisationId,
    shareMode: params.shareMode ?? "once",
    recipientType: params.grantedToOrganisationId ? "organisation" : "worker",
    dataScope: [ACTION_SCOPE[params.action]],
    sourceAction: params.action,
  });
}
