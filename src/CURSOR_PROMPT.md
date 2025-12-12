# NestRecon - Cursor Development Prompt

## Project Overview
NestRecon is a desktop web app and Chrome extension that helps home buyers evaluate properties on Zillow listings with a **military reconnaissance theme**. The app provides property scoring and analysis with a tactical, intel-focused user experience.

## Current Project Status
**Fully operational** with complete subscription system, rebranded UI, and tactical theming across all 6+ screens.

---

## 🎯 Core Features

### Two Operating Modes
1. **FREE Mode** (not logged in):
   - Basic NestRecon Score
   - Walk/Bike/Transit scores from Zillow
   - School ratings overview
   - Basic environmental data (Sound Score, Air Quality, Stargaze Score)
   - No AI recommendations
   - No personalization or proximity scoring

2. **PRO Mode** (logged in with active subscription):
   - Full AI-powered scoring engine
   - Real commute distances
   - Personalized proximity scoring (skateparks, preschools, farmers markets, etc.)
   - Environmental intel with custom thresholds
   - AI mission recommendations
   - Multi-device sync

---

## 🎨 Design System

### Color Palette (Tactical Recon Theme)
- **Primary Olive**: `#556B2F` - Main brand color, primary CTAs
- **Navy**: `#1e3a5f` - Secondary accents, depth
- **Signal Orange**: `#FF6B35` - Alerts, premium features, warnings
- **Neutrals**: Gray scale for text and backgrounds

### Visual Elements
- **Rover Mascot**: External SVG icon (`https://...rover-mascot-v2.svg`)
- **Dot Grid Pattern**: Background texture in hero sections
- **Radar Effect**: Animated pulse on landing page
- **Military Vocabulary**: "Mission," "Intel," "Recon," "Target," "Deploy"

### Typography
- Custom typography system defined in `/styles/globals.css`
- **Do NOT use Tailwind font classes** (text-2xl, font-bold, etc.) unless explicitly requested
- System handles all font sizing and weights via HTML elements

---

## 📁 Project Structure

```
/
├── App.tsx                          # Main router and state management
├── styles/
│   └── globals.css                  # Color tokens, typography system
├── components/
│   ├── landing-page.tsx             # Public homepage (not logged in)
│   ├── onboarding-chat.tsx          # First-time user preferences setup
│   ├── settings-page.tsx            # User preferences dashboard
│   ├── listing-panel.tsx            # Property analysis sidebar (main feature)
│   ├── pricing-page.tsx             # Subscription plans comparison
│   ├── upgrade-modal.tsx            # Upgrade prompt for free users
│   ├── trial-flow.tsx               # 7-day trial signup
│   ├── checkout-redirect.tsx        # Pre-Stripe confirmation
│   ├── success-page.tsx             # Post-purchase success
│   ├── manage-subscription.tsx      # Subscription management
│   ├── soft-lock-screen.tsx         # Expired trial state
│   ├── rover-icon.tsx               # Mascot component
│   ├── metric-row.tsx               # Reusable metric display
│   ├── tag-chip.tsx                 # Status badges (Good/Okay/Poor)
│   └── figma/
│       └── ImageWithFallback.tsx    # Protected system file
└── README.md                        # Project documentation
```

---

## 🔑 Key Metrics & Terminology

### Metrics Displayed (FREE + PRO)
- **Sound Score** (formerly "Noise Pollution") - quiet is better
- **Air Quality** - higher is better
- **Stargaze Score** - night sky visibility
- **Walk/Bike/Transit Scores** - from Zillow data
- **School Quality** - Elementary/Middle/High ratings

### PRO-Only Features
- **Priority Match Status** - checks against user preferences
- **Commute Distance** - to work address
- **Proximity Scoring** - skateparks, preschools, farmers markets, etc.
- **AI Mission Brief** - personalized recommendations

---

## 🛠️ Technical Stack

### Core Technologies
- **React** (functional components, hooks)
- **TypeScript** - full type safety
- **Tailwind CSS v4.0** - utility-first styling
- **React Router** - client-side routing
- **Lucide React** - icon library

### State Management
- useState/useEffect for local state
- Props drilling for shared state
- Simulated auth state (not real backend yet)

### Special Libraries
- `motion/react` - animations (import as Motion, NOT Framer Motion)
- `sonner@2.0.3` - toast notifications
- `react-hook-form@7.55.0` - form handling (version required)

---

## 🚨 Critical Rules

### Protected Files - DO NOT MODIFY
- `/components/figma/ImageWithFallback.tsx`

### Tailwind Typography Rule
**NEVER use font-size, font-weight, or line-height Tailwind classes** unless explicitly requested:
- ❌ `text-2xl`, `font-bold`, `leading-tight`
- ✅ Use HTML elements (h1, h2, p) - styled in globals.css

### JSX Syntax Rules
1. Escape special characters in text:
   - `<` → `<` or `{'<'}`
   - `>` → `>` or `{'>'}`
   - Apostrophes in strings: use `\'` or `"` or backticks

2. No spaces before attribute values:
   - ❌ `value= {data}`
   - ✅ `value={data}`

3. Wrap sibling elements in fragments or parent div

### Image Handling
- **New images**: Use `unsplash_tool` - never hardcode URLs
- **Raster imports**: `import img from "figma:asset/abc123.png"` (no path prefix!)
- **SVG imports**: `import svg from "./imports/svg-xyz"`
- **New image tags**: Use `<ImageWithFallback>` component instead of `<img>`

---

## 💳 Subscription Flow

### User Journey
1. **Landing Page** → Free user sees basic features
2. **Onboarding Chat** → First login, sets preferences
3. **Settings Page** → Manage preferences
4. **Listing Panel** → Main property analysis view
5. **Upgrade Modal** → Triggered when clicking PRO features
6. **Trial Flow** → 7-day free trial signup
7. **Checkout Redirect** → Confirmation before Stripe
8. **Success Page** → Post-purchase confirmation
9. **Manage Subscription** → Cancel/update billing
10. **Soft Lock Screen** → Shown when trial expires

### Subscription States (Simulated)
```typescript
type SubscriptionStatus = 
  | 'none'           // Free user
  | 'trial'          // 7-day trial active
  | 'trial_expired'  // Trial ended, needs upgrade
  | 'active'         // Paid subscriber
  | 'cancelled'      // Cancelled but still in billing period
  | 'expired'        // Subscription lapsed
```

---

## 🎯 Development Guidelines

### When Adding Features
1. **Check FREE vs PRO** - What should be accessible without login?
2. **Use recon vocabulary** - "Mission," "Intel," "Target," "Deploy," "Recon"
3. **Follow color system** - Olive primary, Orange for alerts/premium
4. **Mobile responsive** - All components should work on desktop (primary) and mobile
5. **Consistent spacing** - Use Tailwind spacing scale (mb-6, p-4, gap-3, etc.)

### When Modifying UI
1. Review `/styles/globals.css` for color tokens
2. Don't override typography unless requested
3. Use `<RoverIcon>` component for mascot (not inline SVG)
4. Maintain military aesthetic - dot grids, sharp corners, tactical feel

### When Working with Data
- All data is currently **mocked/simulated**
- No real API calls (use mock responses)
- Subscription status managed in App.tsx state
- User preferences stored in local component state

---

## 📋 Recent Changes (Latest Session)

1. ✅ Changed "Noise Pollution" → "Sound Score" across all components
2. ✅ Removed "Light Pollution" (was duplicate of Stargaze Score)
3. ✅ Updated FREE tier features to match actual UI visibility
4. ✅ Updated all subscription components with sound terminology
5. ✅ Verified pricing page accuracy against listing panel

---

## 🚀 Common Tasks

### Update a Metric Name
1. Search for old name in codebase
2. Update in `listing-panel.tsx`, `settings-page.tsx`, `soft-lock-screen.tsx`
3. Update any modal/marketing copy mentioning it
4. Update README examples

### Add New Proximity Preference
1. Add to `settings-page.tsx` preferences section
2. Add to `listing-panel.tsx` Priority Match Status (PRO only)
3. Add to `onboarding-chat.tsx` setup flow
4. Update pricing page feature list

### Modify Color Scheme
1. Edit color tokens in `/styles/globals.css`
2. Search for hardcoded hex values (e.g., `#556B2F`)
3. Update throughout components
4. Test contrast for accessibility

---

## 🔐 No Real Backend (Yet)
- Authentication is **simulated** (boolean state)
- Stripe integration is **placeholder** (no real keys)
- All data is **mock/hardcoded**
- Future: Connect to Supabase or similar backend

---

## 📞 Support Context

### Brand Identity
- **Old Name**: HomeFit
- **Current Name**: NestRecon
- **Theme**: Military tactical reconnaissance
- **Tone**: Professional, mission-focused, intel-driven
- **Mascot**: Rover (reconnaissance robot)

### Target User
Home buyers who want data-driven property analysis with personalized scoring based on their lifestyle preferences (proximity to skateparks, preschools, air quality, school ratings, etc.)

---

## ✨ Key Differentiators
1. **Themed Experience** - Not just data, but a "mission" with "intel"
2. **Personalization** - Scores based on YOUR priorities
3. **Zillow Integration** - Works as sidebar on Zillow listings
4. **Free Tier** - Basic features available without login
5. **Visual Appeal** - Tactical aesthetic with rover mascot

---

## 🎓 Quick Start for New Devs

1. **Read this prompt first**
2. **Review `/README.md`** for setup instructions
3. **Check `/App.tsx`** for routing and state structure
4. **Explore `/components/listing-panel.tsx`** - main feature
5. **Review `/styles/globals.css`** - design system foundation
6. **Test the subscription flow** - all 7 steps

---

**Last Updated**: December 9, 2025
**Current Version**: v2.0 (NestRecon Rebrand + Full Subscription System)
