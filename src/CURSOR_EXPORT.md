# NestRecon Website - Export for Cursor

**Export Date:** December 9, 2025  
**Purpose:** Complete website package ready for Cursor IDE

---

## 📦 What's Included

This is the **NestRecon marketing website and account portal** - a standalone React application separate from the Chrome extension.

### Website Pages (6 total)
1. **Landing Page** (`/`) - Marketing homepage
2. **Sign Up** (`/signup`) - Account creation
3. **Login** (`/login`) - Authentication
4. **Account Portal** (`/account`) - User dashboard (protected)
5. **Billing** (`/billing`) - Plan selection & upgrade (protected)
6. **Trial Ended** (`/trial-ended`) - Trial expiration screen (protected)

---

## 🎯 Recent Changes

### Latest Updates (Just Completed)
✅ **Removed all "AI" references** - Replaced with military-themed alternatives:
- "AI-Powered Home Intelligence" → "Advanced Home Intelligence"
- "AI Recon for Homebuyers" → "Tactical Recon for Homebuyers"
- "AI Recon Summaries" → "Intel Briefs"
- Updated across landing page, pricing, testimonials, and footer

✅ **Added Last Name field** to signup form (`/signup`)

✅ **Removed Rover peeking image** from signup page

✅ **Added Chrome Extension download button** in Account Portal → Devices & Security section

---

## 📁 Key Files to Work With

### Main Application Files
```
/App.tsx                                    # Router & state management
/styles/globals.css                         # Global styles & CSS variables
```

### Website Components
```
/components/website/landing-page.tsx        # Marketing homepage
/components/website/signup-page.tsx         # Account creation form
/components/website/login-page.tsx          # Login form
/components/website/account-portal.tsx      # User dashboard
/components/website/billing-plan-page.tsx   # Plan selection & upgrade
/components/website/trial-ended-screen.tsx  # Trial expiration lock screen
```

### Assets
- **Rover Logo:** `https://eqqbsiuqjnqpiiuumanu.supabase.co/storage/v1/object/public/site_assets/temp/Rover.svg`
- All images served from Supabase storage

---

## 🎨 Design System

### Brand Colors
```css
--tactical-olive: #556B2F    /* Primary CTA, headers */
--tactical-navy: #1C2A40     /* Secondary accents */
--tactical-sand: #D6C9A2     /* Warm neutral backgrounds */
--signal-orange: #F3A712     /* Premium features, alerts */
--signal-yellow: #FFCE44     /* Highlights */
```

### Visual Theme
- **Military reconnaissance aesthetic**
- Rover mascot (tactical recon robot)
- Radar rings, dot grid patterns, tactical brackets
- Military vocabulary: "Commander," "Intel Briefs," "Mission Control," "Recon deployed"

### Typography
⚠️ **Important:** Do NOT use Tailwind font-size classes (text-xl, text-2xl, etc.) unless explicitly requested. Typography is handled in `/styles/globals.css` via semantic HTML elements.

---

## 🔐 Authentication Flow

### Current Implementation (Simulated)
```typescript
// In App.tsx - state-based authentication (no backend yet)
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('none');
const [userName, setUserName] = useState('Alex');
const [trialDaysRemaining, setTrialDaysRemaining] = useState(7);
```

### Subscription States
- `'none'` - Free user
- `'trial'` - 7-day trial active
- `'trial_expired'` - Trial ended, needs upgrade
- `'active'` - Paid Pro subscriber
- `'cancelled'` - Cancelled but still in billing period

---

## 💳 Pricing Structure

### Free Plan
- Basic Recon Score (DOM-only data)
- Limited sidebar panel
- ❌ No intel briefs, no environment data, no personalization

### Pro Plan ($9/month or $79/year)
- ✅ Full Fit Score (0-100)
- ✅ Intel briefs (was "AI summaries")
- ✅ Environmental intel (air, sound, light)
- ✅ Real commute distances
- ✅ Proximity scoring (preschools, skateparks, etc.)
- ✅ Personalized preferences
- ✅ Unlimited analysis
- 🎁 7-day free trial (no credit card required)

---

## 🛠️ Tech Stack

```json
{
  "framework": "React 18",
  "language": "TypeScript",
  "styling": "Tailwind CSS v4.0",
  "routing": "React Router v6",
  "icons": "Lucide React",
  "build": "Vite"
}
```

---

## 🚀 Quick Start in Cursor

### 1. Open the Project
```bash
# The project is ready to run - all dependencies are set up
# Just open the folder in Cursor
```

### 2. Key Files to Review First
1. **`/WEBSITE_README.md`** - Complete website documentation
2. **`/App.tsx`** - Routing and state management
3. **`/components/website/landing-page.tsx`** - See the brand voice and design patterns
4. **`/styles/globals.css`** - Understand the design system

### 3. Common Tasks

#### Update Pricing
- Edit `/components/website/billing-plan-page.tsx`
- Update landing page pricing section
- Update account portal subscription cards

#### Add New Pro Feature
- Add to billing page feature list
- Update landing page Pro features
- Update trial-ended screen locked features

#### Modify Branding
- Update CSS variables in `/styles/globals.css`
- Search for hex codes (`#556B2F`, `#F3A712`, etc.)
- Update copy in landing page hero section

---

## ⚠️ Important Notes

### This is NOT the Chrome Extension
The website handles **marketing and account management only**. The actual property analysis tool is a **separate Chrome extension codebase**.

### No Real Backend Yet
- Authentication is **simulated** (state-based in React)
- Stripe integration is **placeholder** (no real checkout)
- All user data is **mock/hardcoded**
- **Future:** Connect to Supabase for real auth/data

### Brand Evolution
- **Old brand:** HomeFit (fully replaced)
- **Current brand:** NestRecon
- **Theme:** Military tactical reconnaissance
- **Tone:** Professional, mission-focused, friendly
- **Mascot:** Rover (the recon robot)

---

## 📝 Development Guidelines

### When Adding Features
1. ✅ Use military/tactical vocabulary consistently
2. ✅ Maintain olive/navy/orange color scheme
3. ✅ Include Rover mascot for personality
4. ✅ Follow existing component patterns
5. ❌ Don't use font-size Tailwind classes without request
6. ❌ Don't mention "AI" - use "Intel Briefs" or "Advanced intelligence"

### Code Style
- TypeScript strict mode
- Functional React components (no classes)
- Tailwind for all styling
- Lucide React for icons
- Descriptive variable names

---

## 📞 Need Help?

### Documentation
- **`/WEBSITE_README.md`** - Full website docs
- **`/DEV_SETUP.md`** - Development setup guide
- **`/CURSOR_PROMPT.md`** - AI assistant context
- **`/Attributions.md`** - Third-party assets

### File Structure
```
/components/website/     # All 6 website pages
/components/             # Chrome extension components (separate)
/styles/globals.css      # Global styles & design system
/App.tsx                 # Main router & state
```

---

## 🎯 What to Build Next

### Immediate Priorities
1. **Real authentication** - Supabase Auth integration
2. **Stripe checkout** - Replace placeholder with real billing
3. **Chrome extension detection** - Show install status in account portal
4. **User preferences** - Build the preference setup flow

### Enhancement Ideas
- Email notifications (trial ending, welcome emails)
- Social proof (real user count, testimonials)
- Blog/content section for SEO
- Referral program
- Team/family plans

---

## ✅ Quality Checklist

Before pushing changes:
- [ ] Test all 6 pages (public + protected routes)
- [ ] Verify routing (login/logout redirects)
- [ ] Check mobile responsiveness
- [ ] Ensure military theme consistency
- [ ] Validate form inputs
- [ ] Test trial flow (signup → account → billing)
- [ ] Check for "AI" references (should be "Intel Briefs")
- [ ] Verify color palette adherence

---

## 🚢 Ready to Ship

This website is **production-ready** for the marketing/auth layer. It needs:
1. Backend connection (Supabase recommended)
2. Real Stripe integration
3. Email service (transactional emails)
4. Analytics (PostHog, Mixpanel, or similar)

The UI, UX, and branding are complete and battle-tested! 🎖️

---

**Package Version:** 1.0  
**Last Updated:** December 9, 2025  
**Exported for:** Cursor IDE  
**Brand:** NestRecon (Military Tactical Recon for Home Buyers)
