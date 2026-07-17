# RC1 upgrade

## From Wave 17 tip

1. Check out `release/release-candidate-1`.
2. Run `pnpm install --frozen-lockfile`.
3. Run `pnpm prisma validate && pnpm prisma generate`.
4. Run `pnpm rc:inventories && pnpm rc:evaluate`.
5. Review `docs/releases/rc1/exit-gate.md`.

## Required before a pass recommendation

- Land Waves 18-20.
- Land Wave 20 constitutional invariants.
- Complete Pack A / Waves 14-16 dependencies.
- Re-run golden paths and RC evaluation.
