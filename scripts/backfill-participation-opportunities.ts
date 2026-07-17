#!/usr/bin/env tsx
import { runParticipationScript } from "./participation/_shared";

void runParticipationScript({
  name: "backfill-participation-opportunities",
  category: "backfill",
  summary:
    "Dry-run marketplace source review; no marketplace item is auto-published as an opportunity.",
});
