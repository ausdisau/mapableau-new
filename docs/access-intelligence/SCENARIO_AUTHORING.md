# Scenario authoring

Authorised users build Learning Lab content in **Author studio** (`/access-intelligence/learn/author`) and via `/api/access-intelligence/learn/author`.

## Studio capabilities

- Define learning objectives (catalogue in `LEARNING_OBJECTIVES`)
- Select audience (`individual`, `family`, `workforce`, `community`)
- Build scenarios (goal, place, passport, stages, decision points)
- Attach didactic evidence IDs
- Create branches (multiple decision options; one `expectedOptionId`)
- Create dynamic events (`triggerAfterStage`, optional `introducesIncidentId`)
- Define rubric criteria across five dimensions
- Preview accessible formats (text map in orientation prompt; practice UI)
- Request lived-experience / accessibility / professional / editorial review
- Version and publish **only** when review gates pass

## Schema essentials

See `lib/access-intelligence/learning/schemas.ts`:

- `LearningScenario` — full didactic pack + publication metadata  
- `ScenarioStage`, `DecisionPoint`, `DynamicEvent`  
- `RubricCriterion` / evaluation records  
- `ContentReview` — review workflow  

Published scenarios must record:

- author  
- accessibility reviewer  
- lived-experience reviewer  
- professional reviewer where applicable  
- jurisdiction  
- version  
- review date  
- source material  

## Publish gates

`requestPublish` requires approved **accessibility** and **lived_experience** reviews. Drafts remain `published: false`. Generated training content must not publish without review (`LEARNING_GOVERNANCE.md`).

## Branches & events

- Branching is expressed as alternate options on a decision point; rubric marks expected vs alternate paths.
- Dynamic events fire after decisions via `simulateDynamicEvent` and surface in the route workspace.

## Facilitation hand-off

From Author studio, start a facilitated session → `/access-intelligence/learn/facilitate/[sessionId]` for pause/reveal, anonymous responses, debrief, and accessible exports.
