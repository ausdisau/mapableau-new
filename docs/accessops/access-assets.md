# Access assets

AccessOps represents accessibility infrastructure as versioned `AccessAsset` records overlaid on `AccessPlace` / floor plans — not a parallel map.

## Rules

- Asset identity is stable (`publicIdentifier` is opaque).
- Ownership, operation and maintenance are separate responsibilities.
- Unknown owner is explicit; MapAble never fabricates ownership by mapping an asset.
- Security-restricted assets are never publicly mapped.
- An asset is not considered accessible merely because it exists.
- Retirement preserves historical references.
