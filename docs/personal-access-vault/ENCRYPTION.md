# Encryption

Wave 1–5: **no encrypted item payloads** in the production path. Registry stores references and field manifests only.

Wave 6+: versioned `VaultEncryptedEnvelope` metadata + object-storage ciphertext. MapAble-managed DEKs are **custodial** — see `VAULT_NON_E2E_DISCLAIMER` in `lib/vault/config.ts`.

Do not reuse RightsOS prototype app-secret AES for production. Do not claim encryption alone guarantees privacy.
