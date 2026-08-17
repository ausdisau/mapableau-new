# MapAble object storage

**Status:** infrastructure / in development  
**Public claim:** none — not production-ready  
**Flags (default OFF):** `MAPABLE_OBJECT_STORAGE_ENABLED`, `MAPABLE_ACCESS_EVIDENCE_UPLOADS_ENABLED`

This document describes the provider-neutral object-storage layer. Landing this code does **not** make uploads production-ready.

## Architecture

Neon/PostgreSQL remains the structured source of truth (permissions, provenance, relationships, asset metadata). Object storage holds bytes only.

```
MapAble domain (Access Graph observations, later documents)
        |
        v
   ObjectStore interface   (lib/storage)
        |
        +-- SupabaseObjectStore     [implemented]
        +-- MemoryObjectStore       [tests]
        +-- S3 / R2 / Blob / Azure  [future — same interface]
```

Canonical object identity is `provider` + `bucket` + `objectKey`. URLs are temporary delivery mechanisms, never identifiers.

Domain modules call `getObjectStore()`. They must never call `getSupabaseAdmin().storage` or any other vendor SDK.

## Responsibilities

| Layer              | Owns                                                             |
| ------------------ | ---------------------------------------------------------------- |
| `lib/storage/**`   | ObjectStore, keys, policies, signed grants, StoredAsset metadata |
| `lib/access/**`    | Access observations, provenance, dispute, evidence join          |
| `lib/documents/**` | Care/participant Document records (still local-disk in Phase 2)  |
| Neon               | Metadata, tenancy, audit, provenance                             |
| Provider bucket    | Bytes                                                            |

## Object key conventions

Keys are generated on the server. Clients cannot supply bucket or path.

Access evidence photos:

`access-evidence/places/{placeId}/observations/{observationId}/original/{assetId}.{ext}`

IDs are opaque. Keys must not contain names, emails, diagnoses, NDIS numbers, or phone numbers.

Documented future namespaces (writers not implemented here):

- `accreditation/assessments/{assessmentId}/evidence/{criterionId}/{assetId}.{ext}`
- `vision/source/{assetId}.{ext}`
- `vision/derived/{sourceAssetId}/{derivedAssetId}.json`
- `navigate/datasets/{datasetId}/{version}/...`
- `observatory/snapshots/{yyyy}/{mm}/...`
- `documents/organisations/{organisationId}/...`

## ObjectStore interface

`put`, `get`, `remove`, `exists`, `createSignedReadUrl`, `createSignedUpload`, `getMetadata`.

No vendor SDK types leak through this contract.

## Supabase adapter

`SupabaseObjectStore` uses the existing server-only `getSupabaseAdmin()` client (`SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`). Service-role credentials must never be `NEXT_PUBLIC_*` or returned to browsers.

Large uploads use signed PUT URLs so bytes do not transit a Vercel serverless function.

## Security model

- Authentication required before grants and signed reads.
- Authorisation is application policy, not “possession of a URL”.
- MIME allowlist and size caps are enforced server-side.
- JPEG/PNG/WebP magic-byte sniff is available for completion-time checks of local buffers; remote complete currently trusts provider metadata plus authorised size.
- Filename sanitisation applies to display names only.
- Replay-resistant completion nonce (hashed at rest).
- Tenant / organisation-private purposes are rejected in this slice.
- Participant-controlled and Access Passport paths are rejected.
- CSRF follows existing same-origin session cookies.
- Rate limits are process-local (`lib/api/ip-rate-limit.ts`) and **not** multi-instance safe.

## Access classifications

`PUBLIC`, `AUTHENTICATED`, `PARTICIPANT_CONTROLLED`, `ORGANISATION_PRIVATE`, `SENSITIVE`, `SYSTEM_INTERNAL`.

This slice stores community place photos as `AUTHENTICATED` (optionally `PUBLIC`). Participant-controlled storage is not implemented.

## Direct upload lifecycle

1. Browser requests `POST /api/storage/uploads` with purpose + MIME + size + observation/place ids (no path).
2. API authenticates, checks flags, builds a canonical key, persists a pending `StoredAsset` + `StorageUploadSession`.
3. Browser PUTs bytes to the signed URL.
4. Browser calls `POST /api/storage/uploads/complete` with the one-time nonce.
5. API checks existence/metadata, marks the asset ready, attaches `AccessObservationEvidence`.

## Evidence lifecycle

`AccessObservationRecord` remains the Access Graph evidence aggregate. `StoredAsset` is blob metadata. AI-inferred observations cannot be stored as independently verified; attaching a photo cannot promote that status.

Dispute: `POST /api/access-infrastructure/observations/:id/dispute` sets `disputed` and never upgrades verification to verified.

## Deletion

`DELETE /api/storage/assets/:id` — creator or admin. Soft-deletes Neon, then removes the object. Ambiguous orphans are **not** immediately deleted.

## Orphan strategy

If the object is uploaded but completion never runs, the session stays `pending` until TTL (`orphanTtlHours`, default 24). Cron `GET /api/cron/storage-orphan-reconciliation` (flag-gated, `ADMIN_CRON_SECRET` or admin session) marks sessions `orphaned`. Objects are not deleted without checking state.

## Auditing

Events (no signed URLs, credentials, or file contents):

`storage.upload_authorised`, `storage.upload_completed`, `storage.read_authorised`, `storage.delete_requested`, `storage.object_deleted`, `evidence.attached`, `evidence.disputed`, `evidence.verification_changed`.

## Observability

Process-local counters in `lib/storage/metrics.ts`: uploads requested/completed/failed, bytes, provider errors, signed reads, evidence attached, orphans, delete failures. Labels are purpose, provider, and error class only.

## Future S3-compatible providers

The ObjectStore contract is intentionally S3-shaped (bucket + key + signed PUT/GET). A future `S3ObjectStore` can target AWS S3, Cloudflare R2, SeaweedFS, or Garage without changing Access Graph or document domain services. Do not implement those adapters until a dedicated migration.

Legacy `createObjectStorageProvider()` remains a compatibility shim for `ObjectStorageProvider` (including an unused S3 REST gateway). New code must not use it.

## Environment variables

See `.env.example`:

- `MAPABLE_OBJECT_STORAGE_ENABLED=false`
- `MAPABLE_ACCESS_EVIDENCE_UPLOADS_ENABLED=false`
- `MAPABLE_DOCUMENT_OBJECT_STORAGE_ENABLED=false`
- `DOCUMENT_STORAGE_MODE=local` (use `object_store` only with the flags above)
- `MAPABLE_STORAGE_REQUIRE_MALWARE_SCAN=false`
- `MAPABLE_MALWARE_SCAN_URL` (optional HTTPS scanner)
- `CLOUD_STORAGE_PROVIDER` (`supabase` when enabling; `recording` is invalid for ObjectStore)
- `MAPABLE_STORAGE_PUBLIC_BUCKET` / `MAPABLE_STORAGE_PRIVATE_BUCKET` / `MAPABLE_STORAGE_EVIDENCE_BUCKET`
- Existing `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`

Never commit real credentials.

## Local development

Flags stay off unless you are exercising the slice. With flags on, `CLOUD_STORAGE_PROVIDER=memory` is allowed outside production for tests. Local Supabase Storage requires a project URL, service-role key, and created buckets.

Participant/care `Document` uploads default to local disk (`DOCUMENT_STORAGE_MODE=local`). An ObjectStore writer exists behind **three** fail-closed switches: `MAPABLE_OBJECT_STORAGE_ENABLED`, `MAPABLE_DOCUMENT_OBJECT_STORAGE_ENABLED`, and `DOCUMENT_STORAGE_MODE=object_store`. Enabling those flags does **not** make document uploads production-ready.

Keys:

- `documents/organisations/{organisationId}/{assetId}.{ext}`
- `documents/participants/{participantId}/{assetId}.{ext}`

Classification is `ORGANISATION_PRIVATE` or `PARTICIPANT_CONTROLLED`. Access Passport paths remain unused.

Malware scanning: `getMalwareScanner()` calls `MAPABLE_MALWARE_SCAN_URL` when set (HTTPS, or http://localhost). EICAR test bytes are always rejected. Without a scanner URL, status is `unavailable` / `not_configured`. `MAPABLE_STORAGE_REQUIRE_MALWARE_SCAN=true` fail-closes ObjectStore document writes when the scanner is unavailable. This is not a production antivirus.

## Testing

- Unit: `tests/storage/*.test.ts` (keys, policy, factory, adapters, upload session)
- Accessibility: `tests/storage/access-evidence-upload-a11y.test.tsx` plus manual keyboard/AT cases below
- Access Graph provenance tests remain the SoT for AI ≠ verified

### Manual accessibility cases (WCAG 2.2 AA intent — not a certification claim)

1. Keyboard-only: tab to feature field, notes, file input, submit, cancel.
2. Screen reader: file input has an accessible name; accepted formats and max size are announced via `aria-describedby`.
3. Progress: `role="status"` announces requesting, uploading, completing, and success.
4. Error recovery: invalid type/size shows `role="alert"`; Retry remains keyboard operable.
5. Non-drag path: completing the flow with only the native file picker.

## Known limitations

- Malware scanning is **not a production antivirus**. The hook exists (`MalwareScanner` / optional HTTP URL + EICAR tripwire). Untrusted documents remain a production blocker until a real scanner is configured and `MAPABLE_STORAGE_REQUIRE_MALWARE_SCAN=true` is reviewed.
- In-process rate limits and metrics are not multi-instance safe.
- Care `Document` local disk remains the **default** writer. ObjectStore document writes are triple-gated and off by default.
- No Vercel Blob / AWS SDK / SeaweedFS / Garage / Azure adapter.
- Complete workflow does not re-download remote bytes to sniff magic (size/MIME from provider metadata).
- Feature flags default off; no production behaviour change from shipping this code.

## Production blockers

Do not enable in production until: malware scanning (or an explicit accepted residual risk for photos), shared rate limiting, bucket hardening and RLS review, CSP enforce tested against Supabase hosts, orphan cleanup verified, and a human release review. This slice is **not** production-ready.
