# Vendor risk

Third-party vendor risk assessment tracking.

## Model

`VendorRiskAssessment` records:

- `vendor`, `vendorCategory`, `dataAccessScope`
- `riskLevel`, `residualRiskLevel`
- `status`, `reviewedAt`, `nextReviewAt`

## Admin

`/admin/assurance/vendors`

## Policy

- Vendor assessments required before granting data-access integrations
- Residual risk must be documented; high residual risk blocks go-live satisfaction

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.
- Vendor risk records do not replace contractual due diligence.
