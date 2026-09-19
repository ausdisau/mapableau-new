# Panoramax API (Coolify deploy artefact)

Deploy the official **`panoramax/api`** image as a separate service. Pin the image tag at deploy time — prefer a specific version, not `latest`.

## Health check

```http
GET /api
```

Expect a JSON API root response when healthy.

## Storage

Configure S3-compatible object storage via **`FS_URL`**.

- R2 is preferred **if** it works as S3-compatible via `FS_URL`
- MapAble **R2 remains SoR** for private MapAble community evidence
- Do **not** maintain dual canonical evidence stores
- Direct Panoramax→MapAble R2 is **not officially documented** by Panoramax — treat as unverified until pilot confirms

## Reference compose

See `infra/open-infrastructure/compose/docker-compose.panoramax.yml`.

## Coolify notes

- Bind HTTP to `0.0.0.0:$PORT` (or mapped container port)
- Set `FS_URL` from your object storage provider
- Health probe: `GET /api`
- Keep service isolated from MapAble app database
