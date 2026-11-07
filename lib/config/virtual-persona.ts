/**
 * Virtual Persona (text-first synthetic UI) — fail-closed feature flags.
 * P02/Stage 2: no live model, private RAG, or protected retrieval.
 */

function envTrue(key: string): boolean {
  return process.env[key] === "true";
}

export const virtualPersonaFlags = {
  /** Enables interactive synthetic workspace at /virtual-persona */
  get uiEnabled() {
    return envTrue("MAPABLE_VIRTUAL_PERSONA_UI");
  },
  /**
   * Optional ACS Stage 2 public-search adapter gate.
   * Fixture public search still runs inside the synthetic adapter when UI is on;
   * this flag is for callers that require an explicit public-search enablement.
   */
  get publicSearchEnabled() {
    return envTrue("MAPABLE_VIRTUAL_PERSONA_PUBLIC_SEARCH");
  },
};

export function isVirtualPersonaUiEnabled(): boolean {
  return virtualPersonaFlags.uiEnabled;
}

export function isVirtualPersonaPublicSearchEnabled(): boolean {
  return virtualPersonaFlags.publicSearchEnabled;
}
