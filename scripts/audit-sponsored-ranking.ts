#!/usr/bin/env tsx
import { runParticipationScript } from "./participation/_shared";

void runParticipationScript({
  name: "audit-sponsored-ranking",
  category: "audit",
  summary:
    "Dry-run audit that sponsored opportunities are separated and never ranking boosts.",
});
