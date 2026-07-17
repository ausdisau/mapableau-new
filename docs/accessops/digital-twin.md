# Digital twin graph

See also `civic-digital-twin.md`.

The AccessOps twin connects assets with versioned, directional `AccessTwinEdge` records (`contains`, `connects_to`, `depends_on`, `accessible_via`, …).

## Rules

- Route edges are not automatically bidirectional.
- Stairs cannot become wheelchair routes through generic connectivity.
- Lift, door and gate dependencies are explicit.
- Security-restricted edges are excluded from public graphs.
- Cycles are permitted spatially; route search must terminate.
- Route results retain the graph version used.
