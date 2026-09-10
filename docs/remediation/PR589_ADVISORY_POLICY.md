# Dependency remediation policy for PR #589

This remediation does not weaken `.github/workflows/security.yml`, reduce audit severity, or add the seven current high/critical advisories to `security/advisory-allowlist.json`.

Preferred order:

1. direct dependency patch/minor upgrade within the existing major line;
2. parent-package upgrade that naturally resolves a safe transitive version;
3. narrow `pnpm.overrides` only where upstream ranges prevent selecting a patched transitive version and compatibility is verified.

Every dependency-family change must be validated by the repository production audit plus type-check/build and subsystem regression tests before the PR can be considered merge-ready.
