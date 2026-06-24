# MapAble Independence — Cursor prompt pack

## 1. Product purpose

Daily living routines, skill-building, independence tracking, and participant-controlled sharing with supporters.

## 2. User roles

| Role | Capabilities |
|------|----------------|
| Participant | Goals, routines, prompts, progress, sharing toggles |
| Nominee | View shared progress (read-only unless granted) |
| Support worker | View shared routines for session (org-scoped) |
| Coordinator | Read support plan summary when shared |

## 3. MVP features

- Independence goals (title, target date, status)
- Daily routines with ordered steps and reminders (notification schedule)
- Skill-building plans linked to goals
- Progress entries (mood, completion, short note)
- Support prompts library (participant + system templates)
- Share snapshot with provider/coordinator (consent-gated)
- Links to Foods meal times / Care preferences (read-only banners)

## 4. Later features

- AI Intake → suggested goals
- Wearable step completion
- Gamification badges
- Family calendar sync

## 5. Database tables

`IndependenceGoal`, `DailyRoutine`, `RoutineStep`, `SkillBuildingPlan`, `ProgressEntry`, `SupportPrompt`, `IndependenceShareGrant`

## 6. API routes

```
GET/POST /api/independence/goals
PATCH    /api/independence/goals/[goalId]
GET/POST /api/independence/routines
POST     /api/independence/routines/[routineId]/complete-step
GET/POST /api/independence/progress
GET      /api/independence/prompts
POST     /api/independence/share
```

## 7. Frontend

- `app/dashboard/independence/page.tsx` — overview
- `app/dashboard/independence/routines/[routineId]`, `goals`, `progress`
- `components/independence/RoutineStepList`, `GoalCard`, `ProgressEntryForm`, `SharePanel`

## 8. Integrations

Care (support plan), Foods (meal routine), Transport (outing routine), AI Intake, Participant Portal.

## 9. Accessibility

- Step checklist with keyboard reorder (optional MVP: fixed order)
- Reminder times with timezone label
- Plain language goal wording helper

## 10. Privacy

- Progress entries private by default
- Share grants expire + revocable
- Workers see only `sharedWithOrg` items

## 11. Audit

`independence.goal.created`, `independence.routine.completed`, `independence.share.granted`, `independence.share.revoked`

## 12. Tests

- Share denied without consent
- Routine step completion idempotent
- Notification schedule validation

## 13. Seed

2 goals, 1 morning routine (5 steps), 3 prompts.

**Priority #1 — branch:** `cursor/independence-mvp-ce11`
