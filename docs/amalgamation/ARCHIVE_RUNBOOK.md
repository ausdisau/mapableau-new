# Archive runbook (Phase 4)

After content salvage into the three SoRs, archive empty/stub remotes on GitHub.

## Candidates

| Repository | Salvage check | Action |
| --- | --- | --- |
| `MapAbleDcademy` | Already archived; Academy in platform `app/academy/` | Confirm archived |
| `EnthroRythum` | Empty | Archive |
| `Australian-Disability-website` | Empty | Archive |
| `AccessiBooks-01` | LICENSE/README only — AccessiBooksREPL is media SoR source | Archive |
| `DiverseSpeech` | LICENSE/README only | Archive |
| `DystoniaICUSim` | Stub — no code beyond README | Archive after note in sim SoR docs |
| `Breathe-The-Weight-of-Air` | README prototype flow only | Archive; Rohan ICU carries Breathing Room product |
| `supersim` | Stub | Archive |

## Upstream forks — do not archive for amalgamation

Leave as mirrors: `blt`, `Mass-Mailing-Script`, `dspy`, `openai-guardrails-js`,
`any-guardrail`, `mega-tron`, `ggml`, `health-design-system`, `.NETruntime`,
`audiobookshelf`, `librivox-catalog`, `gutendex`, `cli`.

## Procedure (org admin)

```bash
# Example — requires org admin token
gh repo archive ausdisau/EnthroRythum --yes
gh repo archive ausdisau/Australian-Disability-website --yes
gh repo archive ausdisau/AccessiBooks-01 --yes
gh repo archive ausdisau/DiverseSpeech --yes
gh repo archive ausdisau/DystoniaICUSim --yes
gh repo archive ausdisau/Breathe-The-Weight-of-Air --yes
gh repo archive ausdisau/supersim --yes
```

Before each archive: set README to point at the canonical SoR
([AUSDISAU_AMALGAMATION.md](../strategy/AUSDISAU_AMALGAMATION.md)).

## Agent limitation

This cloud agent’s GitHub token cannot `createRepository` or archive org repos
(`Resource not accessible by integration`). An org admin must run the commands
above. Status of attempts is recorded in
[ARCHIVE_ATTEMPT_LOG.md](./ARCHIVE_ATTEMPT_LOG.md).
