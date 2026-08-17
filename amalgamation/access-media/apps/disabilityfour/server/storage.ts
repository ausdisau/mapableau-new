import { type User, type InsertUser, type Content, type InsertContent, type Category, type Tier, users, content } from "@shared/schema";
import { db } from "./db";
import { eq, or, ilike } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined>;
  updateUserTier(userId: string, tier: string): Promise<User | undefined>;
  
  // Content methods
  getAllContent(): Promise<Content[]>;
  getContentById(id: string): Promise<Content | undefined>;
  getContentByCategory(category: Category): Promise<Content[]>;
  getContentByTier(tier: Tier): Promise<Content[]>;
  getFeaturedContent(): Promise<Content[]>;
  searchContent(query: string): Promise<Content[]>;
  getTrendingContent(): Promise<Content[]>;
  getContentByYoutubeId(youtubeVideoId: string): Promise<Content | undefined>;
  createContent(content: InsertContent): Promise<Content>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId, 
        stripeSubscriptionId,
        subscriptionStatus: "Active"
      })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateUserTier(userId: string, tier: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ userTier: tier })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async getAllContent(): Promise<Content[]> {
    return await db.select().from(content);
  }

  async getContentById(id: string): Promise<Content | undefined> {
    const [item] = await db.select().from(content).where(eq(content.id, id));
    return item || undefined;
  }

  async getContentByCategory(category: Category): Promise<Content[]> {
    return await db.select().from(content).where(eq(content.category, category));
  }

  async getContentByTier(tier: Tier): Promise<Content[]> {
    return await db.select().from(content).where(eq(content.tier, tier));
  }

  async getFeaturedContent(): Promise<Content[]> {
    return await db.select().from(content).where(eq(content.featured, true));
  }

  async searchContent(query: string): Promise<Content[]> {
    return await db
      .select()
      .from(content)
      .where(
        or(
          ilike(content.title, `%${query}%`),
          ilike(content.description, `%${query}%`)
        )
      );
  }

  async getTrendingContent(): Promise<Content[]> {
    return await db.select().from(content).limit(10);
  }

  async getContentByYoutubeId(youtubeVideoId: string): Promise<Content | undefined> {
    const [item] = await db
      .select()
      .from(content)
      .where(eq(content.youtubeVideoId, youtubeVideoId));
    return item || undefined;
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    // Deduplicate YouTube content by checking youtubeVideoId
    if (insertContent.youtubeVideoId) {
      const existing = await this.getContentByYoutubeId(insertContent.youtubeVideoId);
      if (existing) {
        console.log(`YouTube video already exists: ${insertContent.title} (ID: ${insertContent.youtubeVideoId})`);
        return existing;
      }
    }

    const [newContent] = await db
      .insert(content)
      .values(insertContent)
      .returning();
    return newContent;
  }
}

export const storage = new DatabaseStorage();
