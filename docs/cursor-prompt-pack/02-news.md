# MapAble News — Cursor prompt pack

## 1. Product purpose

Accessible disability news, NDIS updates, and policy explainers with Easy Read summaries and personalised alerts.

## 2. User roles

| Role | Capabilities |
|------|----------------|
| Participant / public reader | Browse, save articles, set topic prefs |
| Provider admin | Curate org announcements (later) |
| MapAble editor | Publish articles, policy updates, Easy Read |
| MapAble admin | Moderation, featured topics |

## 3. MVP features

- News hub with filters (topic, date, Easy Read available)
- Article detail with accessible typography + skip to summary
- NDIS `PolicyUpdate` type with effective date
- Easy Read summary block (human-edited MVP; AI adapter stub)
- Save article / saved list
- Topic follow → notification on new matching article
- User preferences: topics, Easy Read default, email digest off/on

## 4. Later features

- AI summarise with human approval queue
- Podcast / video captions
- Provider-branded news channels
- RSS ingest adapter

## 5. Database tables

`NewsArticle`, `NewsTopic`, `NewsArticleTopic`, `EasyReadSummary`, `SavedArticle`, `PolicyUpdate`, `UserNewsPreference`

## 6. API routes

```
GET  /api/news/articles
GET  /api/news/articles/[slug]
GET  /api/news/topics
GET/PUT /api/news/preferences
POST/DELETE /api/news/saved/[articleId]
GET  /api/news/policy-updates
POST /api/admin/news/articles        (editor)
POST /api/admin/news/articles/[id]/easy-read
```

## 7. Frontend

- `app/news/page.tsx`, `app/news/[slug]/page.tsx`, `app/dashboard/news/saved`
- `components/news/ArticleCard`, `EasyReadPanel`, `TopicFilter`, `SaveArticleButton`

## 8. Integrations

Notifications (new article), AI adapter `lib/adapters/news-summariser.ts`, participant + provider dashboard widgets.

## 9. Accessibility

- Reading mode (line length, spacing)
- Easy Read stylesheet
- `article` landmarks, heading hierarchy
- No autoplay media

## 10. Privacy

- Reading history not shared with providers by default
- Analytics only aggregated (Insights vertical)

## 11. Audit events

`news.article.published`, `news.article.saved`, `news.preferences.updated`, `news.easy_read.approved`

## 12. Tests

- Slug uniqueness, published-only public GET
- Saved idempotent POST
- Preferences validate topic IDs

## 13. Seed

3 articles (NDIS plan review, accessibility standard, Easy Read sample), 4 topics, 1 policy update.

**Branch:** `cursor/news-mvp-ce11`
