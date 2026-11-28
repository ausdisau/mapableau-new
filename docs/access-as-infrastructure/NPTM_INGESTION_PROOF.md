# National Public Toilet Map -> MapAble Access Graph

**Status:** development proof; writes are disabled by default.

## Purpose

This is the first end-to-end Accessibility Data Fabric ingestion slice:

```text
Dataset Registry
  -> AccessImportJob ingestion run
  -> raw dataset + row fingerprints
  -> NPTM normaliser
  -> AccessPlace (pending moderation)
  -> AccessObservationRecord
  -> provenance + freshness
  -> duplicate / supersede / conflict handling
```

The source is the Australian Government National Public Toilet Map dataset published through data.gov.au. The adapter records the dataset/resource identifiers, source snapshot, retrieval time, SHA-256 fingerprints, licence identifier and required attribution.

A source assertion is evidence, not a MapAble accessibility guarantee.

## Activation boundary

The write path is fail-closed and requires:

```text
MAPABLE_NPTM_INGESTION_ENABLED=true
MAPABLE_ACCESS_INFRASTRUCTURE_ENABLED=true
MAPABLE_ACCESS_GRAPH_ENABLED=true
```

No production environment should enable the NPTM write flag merely because this code is merged. Activation requires a separate operational decision and review of the current source resource/reuse terms.

New places are created as `pending_moderation`, never automatically published.

## Source mappings

| NPTM field | MapAble ontology |
| --- | --- |
| `Accessible` | `self_care_continence.accessible_toilet` |
| `Ambulant` | `self_care_continence.ambulant_toilet` |
| `LHTransfer` | `self_care_continence.left_hand_transfer` |
| `RHTransfer` | `self_care_continence.right_hand_transfer` |
| `AdultChange` | `self_care_continence.adult_change` |
| `ChangingPlaces` | `self_care_continence.changing_places` |
| `MLAK24` | `self_care_continence.mlak_required_24h` |
| `MLAKAfterHours` | `self_care_continence.mlak_after_hours_access` |
| `OpeningHours` | `self_care_continence.opening_hours` |
| access/opening/toilet/adult-change/address notes | `self_care_continence.access_information` |
| `Latitude`, `Longitude` | `AccessPlaceLocation` |

### Adult change is not Changing Places

`AdultChange` and `ChangingPlaces` are deliberately separate concepts. MapAble must not infer Changing Places certification or registration from a generic adult-change feature.

### MLAK after-hours semantics are source-ambiguous

Two official NPTM documents describe `MLAKAfterHours` differently: the v5 release notes describe MLAK as required after hours, while the field explanatory notes describe an MLAK key as usable after scheduled hours. The adapter therefore stores a positive `MLAKAfterHours` flag as an after-hours MLAK access condition and does not infer whether the key is mandatory or optional.

`MLAK24` is separate and is represented as the source assertion that MLAK is required to access the facility at any time.

### Positive-evidence-only v5 flags

The National Public Toilet Map v5 release notes state that newly introduced flags were initially set to `FALSE` and should only be relied on when `TRUE` until information providers had supplied updates. The adapter therefore treats affected `FALSE` values as no assertion/unknown rather than evidence that a facility is absent.

This is encoded field-by-field rather than treating every boolean the same way.

## Provenance

Each source-backed facility stores:

- MapAble data-source registry ID;
- NPTM dataset and resource IDs;
- source facility ID and URI;
- source snapshot timestamp;
- MapAble retrieval timestamp;
- dataset SHA-256 hash;
- canonical row SHA-256 hash;
- per-observation SHA-256 fingerprint;
- CC BY 3.0 Australia licence identifier;
- attribution text; and
- source limitations.

The MapAble Access Graph stores the assertion with `sourceType=operator`, which is displayed as organisation-supplied evidence rather than independently verified evidence.

## Freshness

The adapter uses the source snapshot date as `observedAt`, not the MapAble download time. This prevents a new download of old source material from pretending to be a fresh accessibility observation.

Existing Access Graph freshness evaluation then determines whether the assertion is fresh, stale or expired. Expired evidence remains visible as provenance/history and must not silently become a current accessibility claim.

## Duplicate and conflict rules

### Duplicate

Same source-field record + same observation fingerprint:

- do not create another observation;
- retain the existing evidence.

### Supersede

Same NPTM source-field record + changed fingerprint:

- create the new observation;
- retain the old observation;
- mark the old source version `outdated`;
- append supersession history.

### Cross-source conflict

For example:

```text
NPTM: Accessible = TRUE
MapAble community report: accessible toilet unavailable / FALSE
```

MapAble does **not** choose one and delete the other.

It:

- stores the incoming NPTM assertion;
- preserves the community assertion;
- marks the conflicting evidence as disputed;
- records a conflict for moderation/resolution; and
- leaves the Access Graph capable of showing uncertainty to the participant.

Consistent observations from different sources remain separate evidence records, allowing downstream access-fit logic to recognise corroboration without erasing provenance.

## Place identity conflicts

Exact existing `sourceReference=nptm:<FacilityID>` may be reused.

Potential name/geographic duplicates without that stable binding are not automatically merged. They become import conflicts for human resolution. This avoids attaching accessibility facts to the wrong physical facility.

## Data minimisation and safety limits

The proof:

- ingests non-personal public facility data only;
- has a 25 MiB CSV input limit;
- has a 30,000-record limit;
- rejects malformed source timestamps;
- skips records without usable coordinates instead of inventing locations; and
- retains raw canonical source rows only inside the existing import audit path.

## Research and discovery sources remain separate

This operational adapter does not ingest NDDA/PLIDA/NHDH person-level data.

- **PLIDA** remains controlled research infrastructure. Only disclosure-cleared aggregate outputs from approved work may cross the research firewall.
- **DataPlace** is useful as a government data-discovery and metadata catalogue. Discovering a dataset there does not confer permission to ingest it; each child dataset still requires its own registry/admission review.
- **AIHW Shaping Change** is treated as disability-data governance and co-design guidance, not an operational feed. Future MapAble research should involve people with disability in shaping research questions, analysis and the use of findings.

## Next adapters after this proof

Once the NPTM slice is reviewed and its NPTM-specific CI delta is green, the same pattern can be extended in order to:

1. a specifically licensed Transport for NSW interchange/accessibility dataset;
2. council kerb, footpath, crossing and accessible-parking datasets;
3. OpenStreetMap under explicit ODbL boundaries; and
4. aggregate AHRC / Australia's Disability Strategy rights and outcome indicators.

Each source must retain its own semantics, licence, provenance, freshness and uncertainty rules. A generic scraper is explicitly not the architecture.
