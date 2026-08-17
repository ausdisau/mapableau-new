# DisabilityFour+ Streaming Platform

## Overview

DisabilityFour+ is an SVOD streaming platform by DisabilityFour Co. Ltd., dedicated to disability-focused content. It offers free (ad-supported) and premium tiers, featuring diverse content like documentaries, series, sports, news, podcasts, and live programs. The platform prioritizes accessibility and inclusive design, drawing inspiration from Netflix (content-first), BBC iPlayer (accessibility), and Spotify (browsing), while integrating warm, community-focused elements. Its core mission is to advocate for disability representation through a bold brand identity and welcoming user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:** React with TypeScript, Vite, Wouter for routing, TanStack Query for data fetching, and Tailwind CSS for styling.

**Component Structure:** Leverages shadcn/ui (Radix UI primitives + Tailwind), custom components for content display (`ContentCard`, `ContentRow`, `HeroCarousel`), and new community-focused components (`AccessibilityFeatures`, `Testimonial`, `CommunityUpdates`, `MembershipCTA`).

**Design System:**
- **Colors:** Bold blue (#0047AB) primary, golden yellow (#FFD700) accent, with a warm community palette including beige (#F5EDE3) and deeper navy (#002B5C).
- **Typography:** Inter (body), Poppins (headlines).
- **Accessibility:** WCAG AA compliant (≥4.5:1 contrast), 3px golden-yellow focus rings.
- **Branding:** Integrated DisabilityFour+ logo (TV screen with wheelchair symbol, hexagonal aperture) across UI, linked to homepage.

**Routing Strategy:** Single-page application (SPA) using wouter for client-side navigation (`/`, `/browse`, `/watch/:id`).

### Backend Architecture

**Technology Stack:** Node.js with Express.js, TypeScript, Drizzle ORM, and PostgreSQL (Neon serverless).

**API Design:** RESTful API under `/api`.
- **Content Endpoints:** `GET /api/content`, `GET /api/content/:id`, `GET /api/content/trending`, `GET /api/featured`.
- **YouTube Integration Endpoints:** `POST /api/youtube/sync` (syncs channel videos), `GET /api/youtube/channels`.

**Session Management:** Uses `express-session` with `connect-pg-simple` for PostgreSQL-backed sessions.

### Data Storage

**Database:** PostgreSQL with Drizzle ORM.
**Schema:**
- **Users:** `id` (UUID), `username`, `password`.
- **Content:** `id` (UUID), `title`, `description`, `thumbnail`, `category` (Enum), `tier` (Enum: FREE, PREMIUM), `contentType` (Enum), `duration`, `featured`, `episodeCount`, `year`, `youtubeVideoId`, `source`, `channelName`.

### Authentication & Authorization

**Current:** User schema and session management infrastructure are in place. Tier-based content access control (FREE vs PREMIUM) is implemented.

### Video Playback

**Able Player Integration:** Integrated Able Player v4.5.6 (CDN-based) for accessible HTML5 video playback. Features include:
- MP4 and WebVTT caption support.
- Interactive transcript rendering.
- Custom CSS for brand consistency.
- Full keyboard navigation, screen reader support, WCAG AA compliance.
- YouTube-sourced videos use privacy-enhanced `youtube-nocookie.com` iframes.

### Object Storage Integration

**Replit Object Storage:** Utilizes Replit's built-in Object Storage (Google Cloud Storage backend).
- **Service:** `server/objectStorage.ts` for interactions.
- **ACL:** `server/objectAcl.ts` for public/private access.
- **API:** `GET /public-objects/:filePath` for serving public assets (videos, thumbnails).
- **Features:** HTTP Range Request support (RFC 9110) for video seeking, automatic file streaming, cache control, error handling.

## External Dependencies

### Third-Party UI Libraries
- **Radix UI**: Accessible, unstyled UI primitives.
- **shadcn/ui**: Styled components built on Radix UI.
- **embla-carousel-react**: Carousel functionality.
- **cmdk**: Command menu.
- **lucide-react**: Icon library.

### Database & ORM
- **@neondatabase/serverless**: Neon serverless PostgreSQL driver.
- **drizzle-orm**: Type-safe TypeScript ORM.
- **drizzle-zod**: Zod schema generation from Drizzle schemas.

### Form Handling & Validation
- **react-hook-form**: Form state management.
- **@hookform/resolvers**: Validation resolver.
- **zod**: TypeScript-first schema validation.

### Utilities
- **date-fns**: Date manipulation.
- **class-variance-authority**: CSS class variant management.
- **clsx** & **tailwind-merge**: Conditional CSS class composition.
- **nanoid**: Unique ID generation.

### Fonts
- **Google Fonts**: Inter, Poppins.

### Video Player
- **Able Player**: HTML5 video player (v4.5.6 via CDN).

### APIs
- **YouTube Data API v3**: For pulling disability-focused content from external channels.
- **Replit Object Storage**: For serving platform content.

### Payment Processing Integration (November 15, 2025)

**Dual Payment Provider Setup:**
- **Stripe**: For recurring Premium and Cooperative subscriptions
- **PayPal**: For one-time payments and alternative payment method

**Security Architecture:**
- Server-side pricing validation (client cannot manipulate amounts)
- Hardcoded pricing tiers in `server/routes.ts`:
  - Premium: $10 AUD/month (recurring subscription)
  - Cooperative: $20 AUD/year (recurring subscription with voting rights)
- All payment amounts are server-authoritative

**Stripe Integration:**
- **Endpoint:** `POST /api/create-subscription`
- **Flow:** Creates/retrieves Stripe customer → Creates subscription → Stores IDs in database
- **Database Fields:** `stripeCustomerId`, `stripeSubscriptionId` in users table
- **Subscription Management:** Proper recurring billing with Stripe Subscriptions API
- **Required Secrets:**
  - `STRIPE_SECRET_KEY` - Server-side Stripe API key
  - `VITE_STRIPE_PUBLIC_KEY` - Client-side publishable key
  - `STRIPE_PRICE_ID` - Stripe price ID for Premium subscription (from Stripe Dashboard)

**PayPal Integration:**
- **Endpoints:** `GET /paypal/setup`, `POST /paypal/order`, `POST /paypal/order/:orderID/capture`
- **Service File:** `server/paypal.ts` with PayPal Server SDK
- **Flow:** Client requests tier → Server validates and sets price → PayPal processes payment
- **Required Secrets:**
  - `PAYPAL_CLIENT_ID` - PayPal application client ID
  - `PAYPAL_CLIENT_SECRET` - PayPal application secret
- **Environment:** Sandbox for development, Production for live deployment

**Checkout Page (`/checkout`):**
- Payment method selector (Stripe card vs PayPal)
- Tier selection (Premium vs Cooperative)
- Benefits display with pricing
- Graceful degradation when payment providers are not configured

**Graceful Degradation:**
- Both payment services are optional
- Server displays warnings (not errors) when API keys are missing
- Checkout page shows appropriate messages when providers are unavailable

**Database Updates:**
- Added `email` field to users table (required for Stripe customer creation)
- Added `stripeCustomerId` field for linking users to Stripe customers
- Added `stripeSubscriptionId` field for tracking active subscriptions
- Storage methods: `updateUserStripeInfo()`, `updateUserTier()`

### MediaPipe Accessibility Features (November 15, 2025)

**Packages Installed:**
- `@mediapipe/tasks-vision` - Core ML models for vision tasks
- `@mediapipe/drawing_utils` - Visual rendering utilities
- `@mediapipe/camera_utils` - Webcam integration helpers

**Planned Features (Phased Rollout):**

**Phase 1 - Gesture Controls (Free Tier):**
- Hand tracking for hands-free video navigation
- Play/pause, seek, volume control via hand gestures
- Highest accessibility impact for motor-impaired users
- Available to all tiers to support platform mission

**Phase 2 - Sign Language Overlay (Premium/Cooperative):**
- Real-time sign language recognition during playback
- Visual overlay displaying recognized signs
- Educational tool for deaf/hard-of-hearing community
- Premium feature to support revenue goals

**Phase 3 - Pose Detection for Sports (Premium/Cooperative):**
- Body landmark tracking for sports content analysis
- Form analysis and coaching overlays
- Targeted at adaptive sports content
- Premium feature for specialized use cases

**Technical Architecture (Planned):**
- Unified MediaPipe manager for camera access and frame streaming
- Web Worker offloading for inference (<30fps throttling)
- Accessibility control tray on Watch page with opt-in toggles
- Privacy-conscious: explicit user permission, clear status indicators
- Graceful fallbacks for denied permissions or unsupported devices

**Performance Considerations:**
- Single camera session shared across features
- Lazy-load models to protect Able Player video playback
- Pause processing when video is paused
- Optimized for lower-end devices