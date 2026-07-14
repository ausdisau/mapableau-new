# MapAble Academy master course catalogue

Canonical workbook: `MapAble_Academy_Master_Course_Catalogue.xlsx`

- **Course Catalogue** sheet is the curriculum source of truth.
- **Cursor Seed** is the machine-friendly import projection (joined with Catalogue + Pathways at import time).
- DSC content is not reproduced; the workbook is MapAble original curriculum architecture.

Import (dev/admin only — not used in HTTP request paths):

```bash
# Preferred machine seed (version-controlled JSON projection of the workbook)
pnpm academy:catalogue:import
pnpm academy:catalogue:import --apply

# Optional: refresh JSON from the xlsx (requires openpyxl)
python3 scripts/export-academy-catalogue-json.py
```

Canonical workbook remains at `docs/academy/MapAble_Academy_Master_Course_Catalogue.xlsx`.
Dry-run is the default. `--apply` is required for mutations.
