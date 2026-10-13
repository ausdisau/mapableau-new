# Security & Privacy

## Data minimisation

- Public interop API strips `actorRef`, `userId`, `participantId`, and similar identity fields
- Community graph metrics aggregate segments/places — **no people scoring**
- Quest submissions omit actor identity from public observation payloads

## Civic bridge

- Open311 submit requires explicit `humanConfirmed: true`
- Agents at L2 may draft; L3 + human approval required for submit
- External `RESOLVED` status triggers `needs_community_verification` — does not auto-restore access

## Evidence media

- Allowed MIME: JPEG, PNG, WebP with magic-byte validation
- EXIF geolocation stripped; location in structured observation only
- MapAble R2 for private evidence — separate from Panoramax `FS_URL`

## Agents

- Authority L0–L3 with audit-required tools
- `canFabricateEvidence` always false
- Non-AI fallback: map-independent quest forms and manual civic confirmation

## Publication

- `assertExternalPublicationAllowed` requires `EXTERNAL_PUBLICATION_APPROVED`
- Panoramax assets default `PRIVATE_EVIDENCE`
