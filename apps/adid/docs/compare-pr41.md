# Comparison with draft PR #41

| Item | PR #41 (`feat/adid-clerk-wix-neon-sandbox-20261110` @ `456d6468`) | This branch (`cursor/adid-clerk-dev-portal-77fc`) |
| --- | --- | --- |
| Scope | Initial Clerk portal scaffold | Extends scaffold; **does not overwrite PR #41** |
| Clerk Core 3 | Used `SignedIn`/`SignedOut` (breaks build on 7.9.25) | Migrated to `<Show>` + `ClerkProvider` inside `<body>` |
| Routes | `/`, `/sign-in`, `/dashboard`, `/api/identity/me` | Adds `/sign-up`, `/account`; protects via `proxy.ts` |
| Wix | Docs-only Stage 1 handoff notes | `@ausdis/adid-wix-integration` package: Stage 1 link builders, Stage 2 dual-proof PoC, Stage 3 one-time handoff (flags false); Velo snippets; docs index |
| Flags | `ADID_NEON_DIRECTORY_ENABLED` | Adds directory/linking/Wix public-link/Wix bridge/federation flags (default false) |
| OIDC RPs | Not present | Contract helpers for per-RP PKCE/state/nonce/aud (no live federation) |
| Tests | 3 service-directory tests | Portal security/a11y + Wix stage contract tests |
| Build | Failed prerender on SignedOut | `npm run build` passes with CI placeholder keys |

PR #41 remains open and untouched. Reviewers may compare either path; prefer landing Core 3 + gated Wix package before any production preview.
