#!/usr/bin/env tsx
import { runParticipationScript } from "./participation/_shared";

void runParticipationScript({
  name: "audit-attendance-exposure",
  category: "audit",
  summary:
    "Dry-run audit that attendance, loneliness, engagement, and social-isolation scores are not exposed.",
});
