/**
 * MapAble One unified visual shell — fail-closed feature flags.
 * Default OFF restores legacy AuthenticatedRoleAppShell / DashboardAppShell.
 *
 * Set both server and NEXT_PUBLIC flags together so client shells and root
 * chrome stay in sync across the whole platform.
 */

function envTrue(key: string): boolean {
  return process.env[key] === "true";
}

export const mapableOneShellFlags = {
  /**
   * Server + layout gate for OneAppShell wrapping all role / marketing shells.
   * Env: MAPABLE_ONE_UNIFIED_SHELL_ENABLED=true
   */
  get unifiedShellEnabled() {
    return envTrue("MAPABLE_ONE_UNIFIED_SHELL_ENABLED");
  },

  /**
   * Client chrome companion. Required for "use client" shells (Dashboard,
   * MapAbleAppShell) when the unified skin is enabled.
   * Env: NEXT_PUBLIC_MAPABLE_ONE_UNIFIED_SHELL=true
   */
  get publicChromeEnabled() {
    return envTrue("NEXT_PUBLIC_MAPABLE_ONE_UNIFIED_SHELL");
  },
};

/**
 * True when the unified skin should render.
 * Server: either flag. Client bundles only see NEXT_PUBLIC_*.
 */
export function isMapAbleOneUnifiedShellEnabled(): boolean {
  return (
    mapableOneShellFlags.unifiedShellEnabled ||
    mapableOneShellFlags.publicChromeEnabled
  );
}
