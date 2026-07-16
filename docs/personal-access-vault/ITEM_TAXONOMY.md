# Item Taxonomy

Authoritative code: `lib/vault/taxonomy.ts`.

Categories: identity_reference, access, equipment, trust, decisions_authority, documents, contacts, portability, vault_native.

Each entry defines: canonical owner, classification, treatment, field manifest, offline eligibility, exportability, deletion limitations, human review.

**Vault-native items are narrow:** recovery config, device config, disclosure templates, trusted-recipient labels, portable packages, emergency subset, capability preferences, quarantine imports. They must not duplicate AccessibilityProfile, Access Passport, or AURA Memory.
