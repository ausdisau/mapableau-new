# Native Marketplace closed-alpha surface

Import `MarketplaceAlphaScreen` from `./src/marketplace/MarketplaceAlphaScreen` into an authenticated Expo development-only navigator when a dedicated internal tester build is available.

This is deliberately not mounted in `App.tsx` yet, because Companion's current default route contains other safety functions and app-level auth/feature-gating is not established for Marketplace. Never expose this screen in a public build without server-authorized alpha access. All sample data is local, original and synthetic. No money movement, external catalogue or person-data collection.
