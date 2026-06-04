# NDIS provider finder data

Official export URL:

https://ndis.gov.au/sites/default/files/react_extract/provider_finder/build/data/list-providers.json

## Local copy

```bash
pnpm fetch:ndis-list-providers
```

If the download returns 403, use the bundled snapshot:

```bash
mkdir -p data/ndis
cp public/data/provider-outlets.json data/ndis/list-providers.json
```

## Prisma seed

```bash
pnpm prisma migrate deploy
pnpm seed:ndis-provider-outlets
```

See `docs/data/ndis-provider-registry-prisma.md`.
