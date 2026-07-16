# Rollback

1. Set all `MAPABLE_PERSONAL_ACCESS_VAULT_*` / `MAPABLE_VAULT_*` flags false.
2. Essential services continue via ConsentRecord / VisitPlanShare / civic data-vault.
3. Do not drop tables if any production data exists; otherwise additive migration can be reverted in non-prod.
4. Canonical domains are untouched by Vault rollback.
