# RC1 install

## Local install

1. Install locked dependencies: `pnpm install --frozen-lockfile`.
2. Validate Prisma: `pnpm prisma validate`.
3. Generate Prisma Client: `pnpm prisma generate`.
4. Run RC inventories: `pnpm rc:inventories`.
5. Run RC evaluation: `pnpm rc:evaluate`.

## Notes

- Do not deploy from RC1 without clearing the exit gate.
- Do not activate production integrations.
- `.env.example` is the environment contract source for this RC.
