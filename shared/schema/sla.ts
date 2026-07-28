import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { ndisPlanCache } from "./scheduling";
import { users } from "./users";

export const slaTemplateTypeEnum = pgEnum("sla_template_type", ["core", "module"]);
export const participantSlaStatusEnum = pgEnum("participant_sla_status", [
  "draft",
  "active",
  "superseded",
]);

export const slaTemplates = pgTable(
  "sla_templates",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    type: slaTemplateTypeEnum("type").notNull(),
    moduleId: text("module_id"),
    version: integer("version").notNull().default(1),
    contentMarkdown: text("content_markdown").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("sla_templates_key_unique").on(table.key),
    index("sla_templates_module_id_idx").on(table.moduleId),
  ],
);

export const slaVariants = pgTable(
  "sla_variants",
  {
    id: serial("id").primaryKey(),
    moduleId: text("module_id").notNull(),
    variantId: text("variant_id").notNull(),
    name: text("name").notNull(),
    defaultParams: text("default_params"),
  },
  (table) => [
    uniqueIndex("sla_variants_variant_id_unique").on(table.variantId),
    uniqueIndex("sla_variants_module_variant_unique").on(table.moduleId, table.variantId),
    index("sla_variants_module_id_idx").on(table.moduleId),
  ],
);

export const participantSlas = pgTable(
  "participant_slas",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    participantPlanId: varchar("participant_plan_id").references(() => ndisPlanCache.id, {
      onDelete: "set null",
    }),
    agreementReference: text("agreement_reference")
      .notNull()
      .default(sql`'MAP-AG-' || to_char(CURRENT_DATE, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))`),
    selectedModules: text("selected_modules").notNull(),
    customParameters: text("custom_parameters"),
    contentMarkdown: text("content_markdown").notNull(),
    version: integer("version").notNull().default(1),
    status: participantSlaStatusEnum("status").notNull().default("draft"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedByUserId: varchar("accepted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    acceptanceMethod: text("acceptance_method"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("participant_slas_agreement_reference_unique").on(table.agreementReference),
    uniqueIndex("participant_slas_user_version_unique").on(table.userId, table.version),
    uniqueIndex("participant_slas_one_active_per_user_unique")
      .on(table.userId)
      .where(sql`${table.status} = 'active'`),
    index("participant_slas_user_status_idx").on(table.userId, table.status),
  ],
);

export type SlaTemplate = typeof slaTemplates.$inferSelect;
export type InsertSlaTemplate = typeof slaTemplates.$inferInsert;
export type SlaVariant = typeof slaVariants.$inferSelect;
export type InsertSlaVariant = typeof slaVariants.$inferInsert;
export type ParticipantSla = typeof participantSlas.$inferSelect;
export type InsertParticipantSla = typeof participantSlas.$inferInsert;
