# Access Intelligence Learning Lab

Optional didactic experience layered on Access Intelligence. It teaches how to reason about personal access fit, evidence quality, route constraints, live conditions, consent, privacy, and accessible service delivery.

**Learning Lab never blocks or delays ordinary Plan mode.** Users can open `/access-intelligence` and receive practical decisions without completing a lesson.

## Modes

| Mode | Route entry | Behaviour |
|------|-------------|-----------|
| **Plan** | `/access-intelligence` | Practical access decision and route directly (production engines). |
| **Guide Me** | `/access-intelligence/learn/scenarios?mode=guide_me` | Explains each step; evidence inspectable. |
| **Practice** | `/access-intelligence/learn/scenarios` | Branching fictional scenario with full state machine. |
| **Facilitate** | `/access-intelligence/learn/facilitate/[sessionId]` | Educator/team leader pause, reveal, responses, debrief. |

## Routes

- `/access-intelligence/learn` — hub
- `/access-intelligence/learn/scenarios` — catalogue
- `/access-intelligence/learn/scenarios/[scenarioId]` — practice / guide workspace
- `/access-intelligence/learn/progress` — concept mastery (no leaderboards)
- `/access-intelligence/learn/author` — authoring studio
- `/access-intelligence/learn/facilitate/[sessionId]` — facilitation

## Deterministic state machine

```
orientation → prediction → investigation → decision → consequence
  → revision → teach_back → reflection → transfer → complete
```

The language model may narrate, explain, provide graduated hints, and adapt presentation. It must **not**:

- change the deterministic access decision;
- change route eligibility;
- convert unknown evidence into a fact;
- infer cognitive capacity from disability;
- award formal professional competence;
- publish generated training content without required review.

Production fit and route tools remain authoritative for real planning. Learning rubrics evaluate didactic choices only.

## Scenario workspace (accessible)

Each practice UI includes:

- scenario goal and selected Access Passport;
- progress indicator and stage list;
- evidence workspace and route workspace;
- decision controls, hint controls, confidence prediction;
- consequence panel, teach-back input, reflection prompts, transfer activity;
- accessible text alternative to visual maps.

## Graduated hints

1. **prompt** — prompt the requirement question  
2. **point_evidence** — point to the evidence workspace  
3. **explanation** — explain unknown / blocker / preference rules  

## Mastery

Tracked **by concept**, not a global public score:

`introduced` → `developing` → `independent` → `can_explain_to_others`

No public leaderboards.

## Six published scenarios

1. Interview on level three  
2. Lift outage before an appointment  
3. Sensory-friendly community event  
4. Tactile and audible wayfinding  
5. Respectful reception communication  
6. Privacy and venue verification  

Each includes a meaningful human goal, functional requirements (via passport + decision framing), verified and unverified evidence, decision points, meaningful unknowns, optional dynamic events, expected reasoning, formative feedback, teach-back, reflection, and transfer.

## APIs & tools

HTTP under `/api/access-intelligence/learn/*` (preferences, scenarios, sessions, progress, author, facilitate, field-missions).

Agent tools mirror: `loadLearningPreferences`, `selectLearningObjective`, `startScenario`, `getScenarioEvidence`, `submitPrediction`, `revealHint`, `submitAccessDecision`, `simulateDynamicEvent`, `evaluateDecisionAgainstRubric`, `requestTeachBack`, `evaluateTeachBack`, `recordReflection`, `updateMastery`, `scheduleReview`, `createFieldMission`.

## Related docs

- [SCENARIO_AUTHORING.md](./SCENARIO_AUTHORING.md)  
- [LEARNING_GOVERNANCE.md](./LEARNING_GOVERNANCE.md)  
- [SAFETY_AND_GOVERNANCE.md](./SAFETY_AND_GOVERNANCE.md)  
