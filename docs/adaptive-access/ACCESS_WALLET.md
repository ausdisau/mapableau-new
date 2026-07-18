# Portable Access Wallet

## Objective

Allow participants to hold and selectively share trusted access information.

## First synthetic credential

**Communication Passport Presentation** — disclosable fields only:

- communication mode
- processing time
- AAC requirement
- selected assistance instructions
- expiry

**Excluded by default:** diagnosis, home address, full support history, unrelated appointments.

## Standards

Contracts evaluate W3C VC, OID4VCI, OID4VP, federation, pairwise IDs, and selective disclosure as **adapters**. No government, NDIS, or national digital-identity endorsement claims.

## Flags

| Flag | Default |
| --- | --- |
| `MAPABLE_ACCESS_WALLET_ENABLED` | false |
| `MAPABLE_VERIFIABLE_CREDENTIALS_ENABLED` | false |
| `MAPABLE_OPENID4VCI_ENABLED` | false |
| `MAPABLE_OPENID4VP_ENABLED` | false |
| `MAPABLE_WALLET_PRODUCTION_ISSUANCE_ENABLED` | **false (must stay false)** |

## Authority ceiling

`SYNTHETIC_PRESENTATION_ONLY` — `not_claimable`. Credential validity ≠ suitability.
