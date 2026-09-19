# RED-GREEN method

RED evidence is the current GitHub Actions `Security` run where `pnpm ci:prod-audit` fails on seven unresolved high/critical production advisories. GREEN requires the same audit harness to pass without adding those advisories to the allowlist, followed by type-check/build and subsystem regression tests to demonstrate dependency compatibility.
