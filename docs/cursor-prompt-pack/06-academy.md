# MapAble Academy / DisAcademy — Cursor prompt pack

## 1. Product purpose

Accessible training: worker onboarding, disability awareness, NDIS compliance modules, quizzes, certificates, progress tracking.

## 2. User roles

| Role | Capabilities |
|------|----------------|
| Learner (worker, provider staff) | Enrol, complete lessons, quizzes |
| Employer | Assign required training |
| Instructor / MapAble admin | Publish courses |
| Provider admin | Org training dashboard |

## 3. MVP features

- Course catalog (published only)
- Lessons (markdown content + optional video URL)
- Quiz per course (pass mark 80%)
- Enrolment + progress percent
- Certificate on pass (PDF stub)
- `WorkerTrainingRequirement` linked to org role

## 4. Later features

- SCORM, webinars, CEU tracking
- Provider-custom courses
- DisAcademy community discussions

## 5. Database tables

`Course`, `Lesson`, `Quiz`, `QuizQuestion`, `CourseEnrolment`, `Certificate`, `TrainingRecord`, `WorkerTrainingRequirement`

## 6. API routes

```
GET  /api/academy/courses
GET  /api/academy/courses/[courseId]
POST /api/academy/enrol
POST /api/academy/lessons/[lessonId]/complete
POST /api/academy/quizzes/[quizId]/submit
GET  /api/academy/certificates
GET  /api/provider/academy/team-progress
POST /api/admin/academy/courses
```

## 7. Frontend

- `app/academy/page.tsx`, `app/academy/courses/[courseId]`
- `app/dashboard/academy/my-learning`
- `components/academy/LessonReader`, `QuizForm`, `CertificateBadge`

## 8. Integrations

Provider Portal, Worker App, Jobs (hire gate: training complete), Compliance.

## 9. Accessibility

- Captions required field on video lessons
- Keyboard-navigable quiz
- Extended time accommodation flag on enrolment

## 10. Privacy

- Quiz answers visible to learner + org admin only

## 11. Audit

`academy.enrolment.created`, `academy.lesson.completed`, `academy.certificate.issued`

## 12. Tests

- Cannot skip to quiz without lessons complete
- Certificate not issued below pass mark

## 13. Seed

“NDIS Code of Conduct intro” (3 lessons, 1 quiz), 1 demo enrolment.

**Priority #4 — branch:** `cursor/academy-mvp-ce11`
