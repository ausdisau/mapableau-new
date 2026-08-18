import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(), // Required for Stripe customer creation
  // Cooperative membership fields
  userTier: text("user_tier").notNull().default("Free"), // Free, Premium, Cooperative
  cooperativeMemberNumber: text("cooperative_member_number").unique(), // Unique member ID
  votingRights: boolean("voting_rights").default(false),
  memberSince: timestamp("member_since").defaultNow(),
  subscriptionStatus: text("subscription_status").default("Active"), // Active, Cancelled, Pending, Expired
  concessionalRate: boolean("concessional_rate").default(false), // DSP/NDIS discount
  // Payment integration fields
  stripeCustomerId: text("stripe_customer_id").unique(), // Stripe customer ID for subscriptions
  stripeSubscriptionId: text("stripe_subscription_id"), // Active Stripe subscription ID
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Video Content Schema for DisabilityFour+ streaming platform
export const content = pgTable("content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnail: text("thumbnail").notNull(),
  category: text("category").notNull(), // Documentary, Drama, Sports, News
  tier: text("tier").notNull(), // FREE, PREMIUM, COOPERATIVE
  contentType: text("content_type").notNull(), // series, movie, live, news, podcast
  duration: integer("duration"), // duration in minutes
  featured: boolean("featured").default(false),
  episodeCount: integer("episode_count"), // for series
  year: integer("year"),
  youtubeVideoId: text("youtube_video_id"), // YouTube video ID if content is from YouTube
  source: text("source").default("platform"), // platform, youtube
  channelName: text("channel_name"), // YouTube channel name for attribution
  // Cooperative and funding fields
  contentDivision: text("content_division").default("External"), // News, Studios, External
  fundingSource: text("funding_source"), // Screen Australia, Screen NSW, Philanthropic, Cooperative
  // Accessibility metadata
  hasAudioDescription: boolean("has_audio_description").default(false),
  hasCaptions: boolean("has_captions").default(true), // Default true per platform commitment
  hasASL: boolean("has_asl").default(false),
  disabledCreator: boolean("disabled_creator").default(false), // Track for representation metrics
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
});

export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof content.$inferSelect;

// Category type for filtering
export const categories = ["Documentary", "Drama", "Sports", "News"] as const;
export type Category = typeof categories[number];

// Tier type
export const tiers = ["FREE", "PREMIUM", "COOPERATIVE"] as const;
export type Tier = typeof tiers[number];

// User tier type
export const userTiers = ["Free", "Premium", "Cooperative"] as const;
export type UserTier = typeof userTiers[number];

// Subscription status type
export const subscriptionStatuses = ["Active", "Cancelled", "Pending", "Expired"] as const;
export type SubscriptionStatus = typeof subscriptionStatuses[number];

// Content division type
export const contentDivisions = ["News", "Studios", "External"] as const;
export type ContentDivision = typeof contentDivisions[number];

// Funding source type
export const fundingSources = [
  "Screen Australia",
  "Screen NSW",
  "Screen Victoria",
  "Philanthropic",
  "Cooperative",
  "Self-funded"
] as const;
export type FundingSource = typeof fundingSources[number];

// Content type
export const contentTypes = ["series", "movie", "live", "news", "podcast"] as const;
export type ContentType = typeof contentTypes[number];
