-- MapAble Core Phase 3
-- Authoritative schema: prisma/schema.prisma (CareRequest, CareShift, TransportBooking, Jobs, Calendar, etc.)
-- Deploy with: npx prisma migrate deploy
-- Fresh dev: npx prisma db push && npx prisma generate

-- Phase 3 adds service-module tables and enums. If migrate deploy on an existing Phase 2 DB,
-- run `npx prisma db push` when this stub does not apply incremental DDL automatically.
