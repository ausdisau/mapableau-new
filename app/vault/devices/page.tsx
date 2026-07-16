import { requirePermission } from "@/lib/auth/guards";
import {
  isVaultDeviceTrustEnabled,
  vaultConfig,
  VAULT_ESSENTIAL_SERVICES_NOTE,
} from "@/lib/vault/config";
import { listVaultDevices } from "@/lib/vault/devices";

export default async function VaultDevicesPage() {
  const user = await requirePermission("vault:device:manage:self");

  if (!isVaultDeviceTrustEnabled()) {
    return (
      <section className="space-y-3" aria-labelledby="vault-section-title">
        <h2 id="vault-section-title" className="font-heading text-xl font-semibold">
          Devices
        </h2>
        <p className="text-sm text-muted-foreground">
          Mode: {vaultConfig.mode}. Device trust flag is off.
        </p>
        <p>{VAULT_ESSENTIAL_SERVICES_NOTE}</p>
      </section>
    );
  }

  const devices = await listVaultDevices(user.id);

  return (
    <section className="space-y-4" aria-labelledby="vault-section-title">
      <h2 id="vault-section-title" className="font-heading text-xl font-semibold">
        Devices
      </h2>
      <p className="text-sm text-muted-foreground">
        Trusted Vault devices are separate from login sessions. A trusted device does
        not receive every Vault item.
      </p>
      <ul className="space-y-3">
        {devices.length === 0 ? (
          <li className="rounded border border-dashed p-3 text-sm">
            No Vault devices registered.
          </li>
        ) : (
          devices.map((device) => (
            <li key={device.id} className="rounded border border-border p-3 text-sm">
              <p className="font-medium">{device.deviceLabel}</p>
              <p className="text-muted-foreground">
                Status: {device.status}
                {device.localVaultEligible ? " · local Vault eligible" : ""}
                {device.platform ? ` · ${device.platform}` : ""}
              </p>
              <p className="mt-1 text-xs">
                Controls: revoke device · report lost · stop access
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
