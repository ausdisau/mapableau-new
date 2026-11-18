# Contributing to MapAble Service Cartography

Contributions from disabled people, support workers, providers, researchers,
developers and accessibility practitioners are welcome. People with disabilities
must have a genuine, compensated voice in the design of high-impact features.

## Developer workflow

```sh
npm install
npm test
npm run demo
```

- Add synthetic failing tests before changing a rights-critical rule.
- Document the participant goal, non-happy paths, uncertainty and human review.
- Never submit participant records, identifiers, real support histories or
  proprietary source data as fixtures or issue attachments.
- Preserve the no-automatic-action interface and strict evidence controls.
- Make output understandable to people using plain language and AAC.
- Disclose conflicts of interest and commercial provider relationships.
- Include examples that challenge economic assumptions, not just improve costs.
- Require explicit release review for changes to matching/consent/funding logic.

See `docs/GOVERNANCE.md` and `docs/RELEASE_GATES.md`.
