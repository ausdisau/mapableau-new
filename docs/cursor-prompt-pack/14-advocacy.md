# MapAble Advocacy — Cursor prompt pack

## 1. Product purpose

Report barriers, council submissions, complaint tracking, campaigns, evidence upload. **Private reports ≠ public campaigns without explicit consent.**

## 2. User roles

| Role | Capabilities |
|------|----------------|
| Participant | Private reports, optional campaign join |
| Campaign organiser | Admin / approved org |
| MapAble moderator | Publish gate |
| Public | View public campaigns only |

## 3. MVP features

- `AccessibilityIssue` private report (location, description, photos)
- `AdvocacyReport` linked to issue
- `Campaign` public page (title, asks, status)
- `Submission` builder (council template sections)
- `EvidenceUpload` to secure storage adapter
- `AdvocacyStatusEvent` timeline
- Consent step before story appears on campaign

## 4. Later features

- Lens integration for photo evidence
- News cross-post (editorial only)

## 5. Database tables

`AdvocacyReport`, `AccessibilityIssue`, `Campaign`, `CampaignMembership`, `Submission`, `EvidenceUpload`, `AdvocacyStatusEvent`, `PublishConsent`

## 6. API routes

```
POST /api/advocacy/issues
GET  /api/advocacy/issues (self)
POST /api/advocacy/campaigns/[id]/join
GET  /api/advocacy/campaigns (public)
POST /api/advocacy/submissions
POST /api/advocacy/evidence
POST /api/advocacy/issues/[id]/publish-consent
GET  /api/admin/advocacy/queue
```

## 7. Frontend

- `app/dashboard/advocacy/page.tsx`, `report`, `submissions/[id]`
- `app/advocacy/campaigns/[slug]` (public)
- `components/advocacy/IssueReportForm`, `SubmissionBuilder`, `ConsentToPublishModal`

## 8. Integrations

Accessibility Mapping, Lens, Community, News, Insights (aggregated counts only).

## 9. Accessibility

- Form save draft
- Upload progress announced

## 10. Privacy rules

- **Separate** private `AccessibilityIssue` from public `Campaign` content
- `PublishConsent` record: who, when, scope
- Never auto-publish photos with faces without consent

## 11. Audit

`advocacy.issue.created`, `advocacy.submission.filed`, `advocacy.publish.consent.granted`, `advocacy.campaign.published`

## 12. Tests

- Public API cannot read private issue
- Campaign page hides identity until consent

## 13. Seed

1 private issue, 1 public campaign (synthetic anonymised story), 1 draft submission.

**Branch:** `cursor/advocacy-mvp-ce11`
