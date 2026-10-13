# MapAble Community / Peer Support — Cursor prompt pack

## 1. Product purpose

Moderated peer groups, lived-experience posts, Q&A, mentoring, events, safety reporting.

## 2. User roles

| Role | Capabilities |
|------|----------------|
| Participant | Join groups, post, comment, report |
| Peer mentor | Verified badge, host Q&A |
| Moderator | Queue, remove content, escalate |
| MapAble safeguarding | Incident linkage |

## 3. MVP features

- Public/private groups (invite code for private)
- Posts + comments (markdown subset)
- Report content → `ModerationReport`
- Block user
- Peer mentor profile flag (admin verified)
- Community events list (link Events vertical later)
- Safeguarding escalation → Core incident

## 4. Later features

- Live chat rooms
- AI pre-moderation assist (human always decides)

## 5. Database tables

`CommunityGroup`, `CommunityMembership`, `CommunityPost`, `CommunityComment`, `PeerMentor`, `ModerationReport`, `CommunityEvent`, `UserBlock`

## 6. API routes

```
GET/POST /api/community/groups
POST     /api/community/groups/[id]/join
GET/POST /api/community/posts
POST     /api/community/posts/[id]/comments
POST     /api/community/posts/[id]/report
POST     /api/community/users/[id]/block
GET      /api/admin/community/moderation-queue
POST     /api/admin/community/reports/[id]/resolve
```

## 7. Frontend

- `app/community/page.tsx`, `groups/[slug]`, `posts/[id]`
- `components/community/PostComposer`, `ReportDialog`, `ModerationBadge`

## 8. Integrations

Participant Portal, Events, Notifications, Compliance/Safeguarding.

## 9. Accessibility

- Content warnings
- Keyboard moderation actions for admins

## 10. Safety rules (day one)

Moderation queue, reporting, blocking, safeguarding escalation. No DM until trust thresholds (later).

## 11. Audit

`community.post.created`, `community.post.reported`, `community.user.blocked`, `community.moderation.action`

## 12. Tests

- Blocked user cannot comment
- Report creates safeguarding-eligible record

## 13. Seed

2 groups, 5 posts, 1 open report.

**Branch:** `cursor/community-mvp-ce11`
