# Subprocessor register

Required for **SOC 2 CC9.1** and **ISM-1635**. Review annually and on each new vendor.

| Vendor | Service | Data processed | Region (verify) | SOC 2 / ISO report | Inherited controls | MapAble responsibility | Last reviewed |
|--------|---------|----------------|-----------------|-------------------|--------------------|------------------------|---------------|
| Vercel | App hosting, serverless, edge | HTTP logs, env secrets, build artifacts | US/EU (confirm plan) | Request from Vercel | Physical security, platform TLS, DDoS | App auth, secrets in env, secure coding | TBD |
| Neon | PostgreSQL | All application data (PII, NDIS) | Confirm project region | Request from Neon | Encryption at rest, backups, network isolation | RLS policy (app-layer), access control, encryption of NDIS fields | TBD |
| Stripe | Payments | Billing metadata, customer IDs | Stripe regions | Stripe SOC report | PCI DSS infrastructure | Webhook signature verification, minimal data stored | TBD |
| Twilio | SMS 2FA | Phone numbers, OTP metadata | Confirm | Twilio SOC report | Telecom infrastructure | Rate limiting, no OTP in logs | TBD |
| OAuth providers | Sign-in (Google, etc.) | Identity tokens | Provider-specific | Provider reports | IdP security | Session handling, token storage | TBD |
| (Optional) AI provider | Matching / copilot | Prompts if enabled | Confirm before enable | Request before production | Provider infra | Guardrails, no PII in prompts, human review flags | TBD |

## Review procedure

1. Identify new subprocessor before production use.  
2. Collect SOC 2 Type II or ISO 27001 certificate (≤12 months old).  
3. Complete risk assessment memo (`VendorRiskAssessment` model).  
4. Document data flows and DPA where required (Privacy Act).  
5. Record review date in this table.

## Data residency note

Confirm Neon project region and Vercel deployment region match contractual and Privacy Act commitments. Document in SSP for IRAP.
