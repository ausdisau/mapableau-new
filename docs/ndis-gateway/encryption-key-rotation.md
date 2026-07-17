# NDIS encryption key rotation

## Envelope

```json
{
  "version": 1,
  "keyVersion": "v1",
  "algorithm": "aes-256-gcm",
  "iv": "...",
  "authTag": "...",
  "ciphertext": "..."
}
```

## Environment

| Variable | Purpose |
|----------|---------|
| `NDIS_ENCRYPTION_ACTIVE_KEY_VERSION` | Version used for new encrypts (default `v1`) |
| `NDIS_ENCRYPTION_KEY_V1` / `_V2` | Key material per version |
| `NDIS_ENCRYPTION_KEY` | Legacy alias for active version |
| `NDIS_ALLOW_INSECURE_DEV_KEY` | Dev-only insecure fallback (`NODE_ENV !== production`) |

Production **fails closed** without a dedicated key. `NEXTAUTH_SECRET` is never used.

## Rotation procedure

1. Set `NDIS_ENCRYPTION_KEY_V2` to the new secret
2. Deploy with both `V1` and `V2` present
3. Switch `NDIS_ENCRYPTION_ACTIVE_KEY_VERSION=v2`
4. Lazily re-encrypt on read via `reencryptLegacyNdisCiphertextIfNeeded` / decrypt+re-encrypt jobs
5. After verification, remove `V1`

## Notes

- Encryption is not a substitute for access control
- Masked identifiers remain personal information
- Never log keys, plaintext, or full envelopes
