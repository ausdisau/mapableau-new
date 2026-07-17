# Webhooks

Webhook subscriptions validate HTTPS destinations, block private-network targets, store secret hashes, and keep production delivery disabled unless `ACCESSOPS_WEBHOOKS_PRODUCTION_ENABLED=true`.

Webhook payloads must remove participant fields and avoid restricted geometry. Retries and dead-letter handling are operational concerns, not external feed activation.
