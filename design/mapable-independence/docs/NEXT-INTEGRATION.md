# Canonical Next.js integration

The visual system was presented before the shared branding changes were authored.
The integration is based on GitHub `ausdisau/mapableau-new` main, not the local
Express/Vite branch. Work is isolated on `replit/mapable-exact-brand`.

## Included

- Complete original PNG deployed as `public/brand/mapable-independence.png`.
- Shared brand logo, lockup and marketing logo components consume the system's
  original-image component. Legacy mark/text variant props remain accepted, but
  they no longer fabricate a separate mark or wordmark.
- Root CSS imports the scoped system and a transparent logo-wrapper adaptation.
- PNG favicon and web-manifest metadata match the new asset's type and dimensions.
- Compact/marketing header rows can wrap to accommodate the square artwork.
- The redundant HTML tagline pill and compact header wordmark are removed.
- Canonical brand-lockup test updated for full-image fidelity.

## Explicitly not included

This is not a complete restyle of all legacy pages. Existing global colours,
map semantics, module accents, navigation, business logic, consent enforcement,
authority checks and task implementations remain unchanged. New UI must consume
`AGENTS.md`; legacy UI needs incremental integration, including portal and theme
propagation checks. A 120–160px toolbar rendering preserves artwork but does not
make the small baked-in tagline body-text sized; larger reference/hero usage and
the accessible image name retain the complete identity.

## Verification boundaries

The design-system token/asset checks and isolated React type-check passed.
The reference was checked at 320, 390, 768 and 1440 CSS pixels, with theme,
readable-type and reduced-motion controls. These are not a WCAG certification.

`verify-next-brand.mjs <canonical-checkout>` exercises five actual canonical
logo/lockup renders with an offline Link replacement, verifies asset SHA-256,
manifest dimensions/MIME and the root CSS import. It does not validate Next
routing, auth, the complete header layout or the whole application's build.

The canonical frozen dependency installation was blocked by the environment's
package firewall (maplibre-gl/proxy-addr downloads). It was not bypassed, and the
production lockfile was not changed. The full Next build and canonical Vitest
suite must run successfully in the canonical CI environment before merge.
No production publish or merge into main is part of this change.
