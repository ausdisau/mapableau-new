#!/usr/bin/env tsx
import { runParticipationScript } from "./participation/_shared";

void runParticipationScript({
  name: "audit-participation-data",
  category: "audit",
  summary:
    "Dry-run audit of participation goals, plans, opportunities, and events.",
});
