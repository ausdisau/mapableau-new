# AIHW MyHospitals integration

Status: **implemented behind a feature flag; not independently verified in production**.

## Purpose

MapAble Healthcare uses the Australian Institute of Health and Welfare MyHospitals API as a hospital-level evidence and performance enrichment source.

It does not replace `AccessPlace` as the canonical place source of truth and does not provide accessibility evidence.

## Data flow

```text
GA / HealthDirect place seed
        |
AccessPlace / Healthcare facility identity
        |
human-reviewed AIHW reporting-unit link
        |
AIHW MyHospitals measures + published hospital data
        |
MapAble Healthcare hospital evidence panels
```

## Routes

- `GET /api/healthcare/aihw/hospitals`
- `GET /api/healthcare/aihw/hospitals/:reportingUnitCode`

Set `MAPABLE_HEALTHCARE_AIHW_ENABLED=true` to enable.

## Claim controls

AIHW data may describe published hospital services and performance measures. It must not be transformed into:

- a universal hospital quality score;
- accessibility or disability-access claims;
- clinical recommendations;
- live bed/capacity claims;
- emergency destination recommendations without a separate current authoritative source.

Source attribution: **Source: Australian Institute of Health and Welfare.**
