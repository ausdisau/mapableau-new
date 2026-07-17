#!/usr/bin/env tsx
import { runParticipationScript } from "./participation/_shared";

void runParticipationScript({
  name: "audit-sensitive-participation-fields",
  category: "audit",
  summary:
    "Dry-run audit of faith, advocacy, civic, peer-support, and sexuality-related privacy defaults.",
});
