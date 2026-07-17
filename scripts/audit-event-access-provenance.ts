#!/usr/bin/env tsx
import { runParticipationScript } from "./participation/_shared";

void runParticipationScript({
  name: "audit-event-access-provenance",
  category: "audit",
  summary: "Dry-run audit of event access evidence, freshness, and provenance.",
});
