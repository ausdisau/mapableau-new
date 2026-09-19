# Lint remediation scope policy for PR #588

PR #588 is intentionally limited to the current repository-wide `app/api` ESLint baseline. It must not:

- weaken or disable `import/order` or `@typescript-eslint/no-unused-vars`;
- alter route behaviour, authentication, validation, response payloads, or business logic;
- perform broad repository-wide automatic fixes;
- absorb unrelated NPTM feature code.

The accepted implementation changes are import reordering and removal of imports proven unused by TypeScript/ESLint. Full `pnpm lint:app-api` and `pnpm type-check` are the minimum GREEN gates.
