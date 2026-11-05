/**
 * Virtual Persona (text-first synthetic UI) — fail-closed feature flags.
 * P02: no live model, RAG, or protected retrieval.
 */

function envTrue(key: string): boolean {
  return process.env[key] === "true";
}

export const virtualPersonaFlags = {
  /** Enables interactive synthetic workspace at /virtual-persona */
  get uiEnabled() {
    return envTrue("MAPABLE_VIRTUAL_PERSONA_UI");
  },
};

export function isVirtualPersonaUiEnabled(): boolean {
  return virtualPersonaFlags.uiEnabled;
}
