# DisabilityFour+ Streaming Platform Design Guidelines

## Design Approach

**Reference-Based Design**: Drawing from Netflix's content-first approach, BBC iPlayer's accessibility excellence, and Spotify's browsing patterns, combined with bold brand expression for disability advocacy.

**Community & Warmth**: Incorporating elements from Australian Disability Ltd (community engagement), Attitude.org.au (cinematic storytelling), and DisabilityBusters (accessibility-first messaging) to create a platform that feels both professional and welcoming.

## Brand Expression

**Primary Colors**:
- Bold Blue (#0047AB): Primary backgrounds, navigation, key UI elements
- Golden Yellow (#FFD700): CTAs, highlights, upgrade prompts, focus indicators
- High contrast pairings throughout for WCAG AA compliance

**Extended Color Palette**:
- Warm Beige (#F5EDE3): Community sections, testimonials, softer backgrounds
- Deeper Navy (#002B5C): Enhanced hero overlays for better text contrast
- Soft Gray (#F8F9FA): Alternative background for content variety
- White (#FFFFFF): Primary text surfaces, cards

**Color Usage Guidelines**:
- Use warm beige for community-focused sections (testimonials, updates, mission)
- Use deeper navy for hero gradient overlays (opacity 0.7-0.85)
- Maintain bold blue for navigation and primary brand touchpoints
- Golden yellow remains prominent for CTAs and accessibility highlights

## Typography System

**Font Families** (via Google Fonts):
- Primary: Inter (UI, body text, labels) - weights 400, 500, 600, 700
- Display: Poppins (headlines, hero text) - weights 600, 700

**Typography Refinements**:
- Poppins headlines: letter-spacing of 0.02em for elegance
- Reduced maximum weight from 800 to 700 for softer appearance
- Maintain clear hierarchy while reducing visual aggression

**Hierarchy**:
- Hero Headlines: 48px/56px desktop, 32px/40px mobile (Poppins Bold, letter-spacing 0.02em)
- Hero Taglines: 20px/28px desktop, 16px/24px mobile (Inter Medium)
- Section Titles: 32px/40px desktop, 24px/28px mobile (Poppins SemiBold)
- Card Titles: 18px/24px (Inter SemiBold)
- Body Text: 16px/24px (Inter Regular)
- Metadata/Labels: 14px/20px (Inter Medium)

## Layout & Spacing System

**Tailwind Spacing Units**: Use 4, 8, 12, 16, 24, 32 (p-4, gap-8, py-12, px-16, etc.)
- Consistent section padding: py-16 md:py-24 lg:py-32
- Card spacing: gap-4 md:gap-6
- Container max-width: max-w-7xl with px-4 md:px-8

**Grid Systems**:
- Content cards: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6
- Feature sections: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Accessibility features: grid-cols-1 md:grid-cols-3

## Core Components

**Navigation Bar**:
- Fixed top navigation with bold blue background
- Logo left, search center, account/upgrade right
- Horizontal category menu below on desktop, hamburger on mobile
- Golden yellow upgrade button (prominent)

**Hero Banner** (Enhanced):
- Full-width carousel with 16:9 aspect ratio imagery
- Deeper navy gradient overlay (rgba(0, 43, 92, 0.75) bottom to rgba(0, 43, 92, 0.3) top)
- Powerful tagline above title: "Authentic Stories. Powerful Voices." (20px/28px, Inter Medium)
- White display text with golden yellow CTA buttons (blurred backgrounds)
- Prev/next controls with clear focus states
- Cinematic production stills from actual content

**Content Cards**:
- 16:9 thumbnail with hover scale effect
- Title below thumbnail (2-line max with ellipsis)
- Tier badge overlay: "FREE with Ads" or "Premium" (golden yellow)
- Content type icon (series/movie/live)
- Division badge (News/Production/Streaming) using lucide-react icons

**Horizontal Scrollers**:
- Section title with "View All" link
- Scrollable row of 5-7 cards visible at desktop
- Scroll indicators (fade edges)
- Keyboard navigable

**Filter Bar** (Browse page):
- Horizontal pills for categories
- Active state: golden yellow background
- Sticky positioning below main nav

**CTAs & Upgrade Prompts**:
- Dismissible banner with golden yellow background
- Clear value proposition text
- Action button with hover states

## New Components

**Accessibility Features Callout**:
- 3-column grid layout (1 column mobile, 3 desktop)
- Positioned immediately below hero carousel
- Each feature includes:
  - Icon from lucide-react (Captions, AudioLines, Keyboard)
  - Bold title (Inter SemiBold, 18px)
  - Brief description (Inter Regular, 14px)
- White background with subtle shadow
- Golden yellow icon accents
- Purpose: Highlight platform accessibility commitment

**Testimonial Block**:
- Warm beige background (#F5EDE3)
- Maximum width container (max-w-4xl)
- Rotating quote display with:
  - Large quote text (20px/32px, Inter Regular)
  - Attribution: Name, title, organization (16px, Inter Medium)
  - Small circular photo (80px diameter)
- Quote marks in golden yellow
- Positioned between content rows for visual break
- Purpose: Build credibility and community connection

**Community Updates Section**:
- Horizontal scroller similar to content rows
- Warm beige or soft gray background
- Cards display:
  - Small thumbnail or icon
  - Update headline (Inter SemiBold, 16px)
  - Brief description (Inter Regular, 14px)
  - Timestamp (Inter Medium, 12px, muted)
- Updates include: cooperative news, upcoming events, member spotlights
- "View All News" link to future news page
- Purpose: Engage community and show active organization

**Membership CTA Banner**:
- Full-width section with warm beige background
- Grid layout: content left (2/3), action right (1/3)
- Content:
  - Headline: "Become a Member of DisabilityFour+"
  - Benefits list (3-4 bullet points)
  - Supporting text about cooperative mission
- Action:
  - Primary button: "Join Today" (golden yellow)
  - Secondary text: Pricing or membership tiers
- Purpose: Convert visitors to cooperative members

**Enhanced Footer**:
- Multi-column layout
- Sections:
  1. Mission statement (Our Values, brief about cooperative)
  2. Category links (Documentary, Drama, Sports, News)
  3. About links (About DisabilityFour, Accessibility, Join Cooperative, Contact)
  4. Social proof numbers (Members, Videos, Hours of Content)
- Warm beige or bold blue background
- Copyright and legal links at bottom
- Purpose: Comprehensive navigation and mission communication

## Icon System

**Content Division Icons** (lucide-react):
- News: Newspaper icon
- Production: Film icon
- Streaming: Radio icon

**Accessibility Feature Icons** (lucide-react):
- Captions: Captions icon
- Audio Description: AudioLines icon
- Keyboard Navigation: Keyboard icon

**Service Icons** (rounded badges):
- Circular background with icon
- Used in features callout, footer, about sections
- Consistent 64px size for feature highlights
- 32px size for smaller references

## Accessibility Requirements

**Focus States**: 
- 3px golden yellow outline with 2px offset
- Visible on all interactive elements (both :focus and :focus-visible)

**ARIA Implementation**:
- Descriptive labels on all controls
- Live regions for dynamic content
- Landmark roles for navigation

**Keyboard Navigation**:
- Tab order follows visual hierarchy
- Arrow keys for carousel/grid navigation
- Escape to dismiss modals/overlays

**Color Contrast**:
- All text minimum 4.5:1 ratio
- UI components 3:1 ratio
- Yellow text on dark backgrounds only
- Test warm beige backgrounds for sufficient contrast with dark text

## Images

**Hero Section**: Large feature images (1920x1080) showcasing current shows/events with diverse disability representation - authentic documentary stills, behind-the-scenes production shots, or promotional artwork. Use cinematic production photography from actual content.

**Content Thumbnails**: 16:9 show posters/stills (640x360) for all video cards

**Category Headers**: Wide banner images (1440x400) representing each genre

**Profile/Team**: Authentic photos of cooperative members and content creators (for testimonials)

**Community Updates**: Small thumbnails (200x200) or icon placeholders for news items

All images should feature genuine disability representation, not stock imagery.

## Page-Specific Layouts

**Home Page** (Enhanced Visual Rhythm):
1. Hero carousel (3-5 featured items) with deeper overlays and taglines
2. **Accessibility Features callout** (new - 3-column grid)
3. Trending content row
4. **Community Updates section** (new - warm background)
5. Documentary content row
6. **Testimonial block** (new - rotating quote)
7. Drama content row
8. Sports content row
9. **Membership CTA banner** (new - warm background)
10. News content row
11. **Enhanced footer** with mission statement

**Browse Page**:
- Category filter bar (sticky)
- Search bar (prominent, top-right)
- Content grid (6 columns desktop, responsive)
- Sort dropdown (top-right)

**Watch Page**:
- JW Player container (16:9, responsive)
- Episode list sidebar (desktop) or below player (mobile)
- Related content section
- Bold blue branded player controls

## Animations

**Minimal Motion**:
- Card hover: subtle scale (1.05) and shadow increase
- Carousel transitions: fade only (accessibility)
- No autoplay, no parallax, no scroll-triggered effects
- Loading states: simple spinner (golden yellow)
- Testimonial rotation: gentle fade transition (optional, user-controlled)

## Design Inspiration Integration

**From Australian Disability Ltd**:
- Warm, welcoming color palette (beige backgrounds)
- Community engagement focus (news, updates)
- Service icon system for clear communication
- Membership/cooperative emphasis

**From Attitude.org.au**:
- Clean, professional presentation
- Cinematic full-width photography from actual productions
- Powerful, concise taglines
- Elegant typography with breathing room

**From DisabilityBusters**:
- Accessibility features prominently highlighted
- Academic/institutional testimonials for credibility
- Creator/founder storytelling emphasis
- Dark overlays for better hero text contrast

This evolved design creates a professional, accessible streaming experience that centers disability voices while building genuine community connection and warmth. The platform maintains competitive visual quality with major streaming services while expressing the unique mission of the DisabilityFour+ cooperative.
