/**
 * Academy SSO architecture (contracts only — no external IdP activation here).
 * MapAble Core owns identity; Academy owns learning delivery.
 */

export interface AcademySsoArchitecture {
  pattern: "oidc_sso_from_mapable_core";
  academyAudience: "academy.mapable.com.au";
  coreIssuer: "mapable_core";
  claims: Array<"sub" | "email" | "name" | "org_memberships" | "roles">;
  iframeForbidden: true;
  sessionBridge: "authorization_code_pkce";
  completionWebhook: {
    path: "/api/academy/completion-exchange";
    signed: true;
    createsCompetencyAutomatically: false;
  };
}

export function getAcademySsoArchitecture(): AcademySsoArchitecture {
  return {
    pattern: "oidc_sso_from_mapable_core",
    academyAudience: "academy.mapable.com.au",
    coreIssuer: "mapable_core",
    claims: ["sub", "email", "name", "org_memberships", "roles"],
    iframeForbidden: true,
    sessionBridge: "authorization_code_pkce",
    completionWebhook: {
      path: "/api/academy/completion-exchange",
      signed: true,
      createsCompetencyAutomatically: false,
    },
  };
}
