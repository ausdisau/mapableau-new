# Domain Services — activation blockers

Until human operations clears these, every Domain Services draft remains **NOT CONFIGURED**.

| Blocker | Why it stays blocked in v1 |
|---|---|
| DNS records for `*.mapable.com.au` (or custom domains) | Agent / self-serve must not write production DNS |
| Vercel project domain attach | Platform attach is an ops action with TLS implications |
| Multi-host session cookies | Avoid cross-tenant cookie leakage until host policy is production-reviewed |
| cPanel / partnerconsole / M365 / VPS commerce | Out of product scope — WhiteLabel PHP reference only |
| Automatic production org go-live | Self-serve creates draft orgs; verification stays separate |
| Treating `Host` as tenancy authority | Hostname is branding context only |

## Domain readiness card

Preview shells show a **NOT CONFIGURED** readiness card. That card is intentional — it is not a bug and must not be removed to imply live hosting.
