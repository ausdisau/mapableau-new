# RED-GREEN method

RED evidence is the existing GitHub Actions `CI` run where `pnpm lint:app-api` fails with 33 errors before unit tests/build. GREEN requires the same command to pass with unchanged lint configuration. Changes are limited to import ordering and removal of genuinely unused imports, so a behavioural unit-test harness is not appropriate; the lint command itself is the regression gate and `pnpm type-check` guards symbol/typing integrity.
