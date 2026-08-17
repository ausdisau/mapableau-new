import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContentSchema, categories } from "@shared/schema";
import { fetchChannelVideos, InvalidAPIKeyError, ChannelNotFoundError, YouTubeAPIError } from "./services/youtube";
import { ObjectStorageService } from "./objectStorage";
// Reference: blueprint:javascript_stripe
import Stripe from "stripe";
// Reference: blueprint:javascript_paypal
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";

// Reference: blueprint:javascript_stripe - Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Warning: STRIPE_SECRET_KEY not set. Stripe payment features will be unavailable.");
}
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-10-29.clover" })
  : null;

// Server-side pricing configuration - NEVER trust client for amounts
const PRICING_TIERS = {
  premium: {
    amount: 10, // $10 AUD/month
    currency: "aud",
    interval: "month",
    name: "Premium",
  },
  cooperative: {
    amount: 20, // $20 AUD/year
    currency: "aud",
    interval: "year",
    name: "Cooperative Member",
  },
} as const;

type PricingTier = keyof typeof PRICING_TIERS;

function isValidTier(tier: string): tier is PricingTier {
  return tier === "premium" || tier === "cooperative";
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Reference: blueprint:javascript_paypal - PayPal endpoints
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  // PayPal order creation with server-side pricing validation
  app.post("/paypal/order", async (req, res) => {
    try {
      const { tier } = req.body;
      
      if (!tier || !isValidTier(tier)) {
        return res.status(400).json({ error: "Valid tier required (premium or cooperative)" });
      }

      // Get server-side pricing - NEVER trust client amount
      const pricing = PRICING_TIERS[tier];
      
      // Override request body with server-side pricing
      req.body = {
        amount: pricing.amount.toFixed(2),
        currency: pricing.currency.toUpperCase(),
        intent: "CAPTURE",
      };
      
      await createPaypalOrder(req, res);
    } catch (error) {
      console.error("PayPal order creation error:", error);
      res.status(500).json({ error: "Failed to create PayPal order" });
    }
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Reference: blueprint:javascript_stripe - Stripe subscription endpoint
  app.post("/api/create-subscription", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: "Stripe not configured" });
    }
    
    try {
      const { tier, userId, email } = req.body;
      
      if (!tier || !isValidTier(tier)) {
        return res.status(400).json({ error: "Valid tier required (premium or cooperative)" });
      }

      if (!userId || !email) {
        return res.status(400).json({ error: "User ID and email required" });
      }

      // Get server-side pricing
      const pricing = PRICING_TIERS[tier];

      // Check if STRIPE_PRICE_ID is configured
      if (!process.env.STRIPE_PRICE_ID) {
        console.warn("Warning: STRIPE_PRICE_ID not set. Using PaymentIntent for testing. Set STRIPE_PRICE_ID for production subscriptions.");
        
        // Fallback to one-time payment for testing
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(pricing.amount * 100),
          currency: pricing.currency,
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            tier,
            userId,
          },
        });
        
        return res.json({ 
          clientSecret: paymentIntent.client_secret,
          message: "Using test mode. Configure STRIPE_PRICE_ID for subscriptions."
        });
      }

      // Get or create Stripe customer
      const user = await storage.getUser(userId);
      let customerId = user?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email,
          metadata: {
            userId,
          },
        });
        customerId = customer.id;
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: process.env.STRIPE_PRICE_ID,
          },
        ],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
        metadata: {
          tier,
          userId,
        },
      });

      // Store Stripe info in database
      await storage.updateUserStripeInfo(userId, customerId, subscription.id);
      await storage.updateUserTier(userId, pricing.name);

      const invoice = subscription.latest_invoice as any;
      const paymentIntent = invoice?.payment_intent;

      res.json({ 
        clientSecret: paymentIntent?.client_secret,
        subscriptionId: subscription.id,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Failed to create subscription: " + error.message });
    }
  });

  // Reference: blueprint:javascript_object_storage
  // Serve public files from object storage (videos, thumbnails, images)
  // Supports HTTP Range requests for video streaming
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, req, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all content or filter by category/tier
  app.get("/api/content", async (req, res) => {
    try {
      const { category, tier } = req.query;

      let content;
      if (category && typeof category === "string") {
        content = await storage.getContentByCategory(category as any);
      } else if (tier && typeof tier === "string") {
        content = await storage.getContentByTier(tier as any);
      } else {
        content = await storage.getAllContent();
      }

      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // Get trending content
  app.get("/api/content/trending", async (_req, res) => {
    try {
      const content = await storage.getTrendingContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trending content" });
    }
  });

  // Get single content by ID
  app.get("/api/content/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const content = await storage.getContentById(id);

      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  // Get featured content for hero carousel
  app.get("/api/featured", async (_req, res) => {
    try {
      const content = await storage.getFeaturedContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured content" });
    }
  });

  // Search content
  app.get("/api/search", async (req, res) => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Search query required" });
      }

      const content = await storage.searchContent(q);
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to search content" });
    }
  });

  // Get categories list
  app.get("/api/categories", async (_req, res) => {
    try {
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Create new content (admin only - for future use)
  app.post("/api/content", async (req, res) => {
    try {
      const validatedData = insertContentSchema.parse(req.body);
      const content = await storage.createContent(validatedData);
      res.status(201).json(content);
    } catch (error) {
      res.status(400).json({ error: "Invalid content data" });
    }
  });

  // YouTube Integration: Sync videos from disability-related channels
  app.post("/api/youtube/sync", async (req, res) => {
    try {
      const { channelHandle } = req.body;
      
      if (!channelHandle || typeof channelHandle !== "string") {
        return res.status(400).json({ error: "Channel handle required" });
      }

      const youtubeVideos = await fetchChannelVideos(channelHandle);
      
      // Add YouTube videos to storage
      for (const video of youtubeVideos) {
        await storage.createContent(video);
      }

      res.json({ 
        success: true, 
        count: youtubeVideos.length,
        message: `Successfully synced ${youtubeVideos.length} videos from ${channelHandle}`
      });
    } catch (error) {
      console.error("YouTube sync error:", error);
      
      if (error instanceof InvalidAPIKeyError) {
        return res.status(400).json({ 
          error: "Invalid or missing YouTube API key. Please check your API key configuration.",
          details: error.message
        });
      }
      
      if (error instanceof ChannelNotFoundError) {
        return res.status(404).json({ 
          error: "Channel not found. Please verify the channel handle is correct.",
          details: error.message
        });
      }
      
      if (error instanceof YouTubeAPIError) {
        return res.status(502).json({ 
          error: "YouTube API request failed. This may be due to quota limits or temporary service issues.",
          details: error.message
        });
      }
      
      // Generic error fallback for unexpected errors
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        error: "Internal server error while syncing YouTube content",
        details: errorMessage
      });
    }
  });

  // YouTube Integration: Get list of configured channels
  app.get("/api/youtube/channels", async (_req, res) => {
    try {
      const channels = [
        {
          handle: "@ausdisau",
          name: "Australian Disability",
          description: "Disability-focused content from Australian Disability"
        }
      ];
      res.json(channels);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch YouTube channels" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
