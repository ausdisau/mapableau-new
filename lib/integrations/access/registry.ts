import type {
  AccessEvidenceProvider,
  AccessProviderId,
  ProviderHealth,
} from "./contracts";
import { openInfrastructureFlags } from "./flags";

const providers = new Map<AccessProviderId, AccessEvidenceProvider>();

export function registerAccessEvidenceProvider(
  provider: AccessEvidenceProvider,
): void {
  providers.set(provider.providerId, provider);
}

export function getAccessEvidenceProvider(
  providerId: AccessProviderId,
): AccessEvidenceProvider | undefined {
  return providers.get(providerId);
}

export function listAccessEvidenceProviders(): AccessEvidenceProvider[] {
  return [...providers.values()];
}

export function listEnabledAccessEvidenceProviders(): AccessEvidenceProvider[] {
  if (!openInfrastructureFlags.enabled) return [];
  return listAccessEvidenceProviders().filter((p) => p.isEnabled());
}

export async function healthCheckAllAccessProviders(): Promise<
  ProviderHealth[]
> {
  if (!openInfrastructureFlags.enabled) return [];
  const out: ProviderHealth[] = [];
  for (const provider of listAccessEvidenceProviders()) {
    try {
      out.push(await provider.healthCheck());
    } catch (error) {
      out.push({
        providerId: provider.providerId,
        configured: provider.isEnabled(),
        reachable: false,
        latencyMs: null,
        version: null,
        checkedAt: new Date().toISOString(),
        message:
          error instanceof Error ? error.message : "health check failed",
      });
    }
  }
  return out;
}

export function __resetAccessProviderRegistryForTests(): void {
  providers.clear();
}
