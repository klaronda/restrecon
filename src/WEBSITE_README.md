# NestRecon Website

This is the **marketing website and account portal** for NestRecon — separate from the Chrome extension.

## 🎯 Purpose

The website handles:
- **Marketing & conversion** (landing page)
- **User authentication** (signup, login)
- **Account management** (profile, preferences, subscription)
- **Billing** (plan selection, upgrade flows)
- **Trial management** (trial-ended lock screen)

**The actual product** (property analysis on Zillow) lives in the **Chrome extension** (separate codebase).

---

## 📄 Pages Overview

### 1. **Landing Page** (`/`)
- Hero section with value proposition
- Feature showcase (3 columns)
- How it works (3 steps)
- Pricing comparison (Free vs Pro)
- Testimonials
- FAQ
- Full navigation and footer

**Route:** `/`  
**Component:** `/components/website/landing-page.tsx`

---

### 2. **Sign Up Page** (`/signup`)
- Account creation form
- Fields: First Name, Email, Password
- Trial badge (7-day free trial, no credit card)
- Link to login

**Route:** `/signup`  
**Component:** `/components/website/signup-page.tsx`

---

### 3. **Login Page** (`/login`)
- Email + password authentication
- "Forgot password" link
- Link to sign up

**Route:** `/login`  
**Component:** `/components/website/login-page.tsx`

---

### 4. **Account Portal** (`/account`)
- **Protected route** (login required)
- Dashboard greeting with rover and radar
- Profile summary (name, email, edit button)
- Subscription status (Free / Trial / Pro)
- Preference summary (read-only, with edit link)
- Devices & security (session management)
- Upgrade CTA banner (if Free)

**Route:** `/account`  
**Component:** `/components/website/account-portal.tsx`

---

### 5. **Billing / Plan Page** (`/billing`)
- **Protected route** (login required)
- Plan selection (Free vs Pro)
- Billing toggle (Monthly $9 / Yearly $79)
- Feature comparison table
- Upgrade button (simulated Stripe redirect)
- "Top Secret" themed design

**Route:** `/billing`  
**Component:** `/components/website/billing-plan-page.tsx`

---

### 6. **Trial Ended Screen** (`/trial-ended`)
- **Protected route** (shown when trial expires)
- "Mission Intel Restricted" messaging
- Sad rover with low signal
- Locked features list
- Upgrade CTA
- Link to continue with Free plan

**Route:** `/trial-ended`  
**Component:** `/components/website/trial-ended-screen.tsx`

---

## 🎨 Design System

### Colors
```css
--tactical-olive: #556B2F    /* Primary brand color */
--tactical-navy: #1C2A40     /* Secondary accents */
--tactical-sand: #D6C9A2     /* Warm neutral */
--signal-orange: #F3A712     /* Alerts, premium features */
--signal-yellow: #FFCE44     /* Highlights */
```

### Visual Elements
- **Rover Mascot:** External SVG from uxwing.com
- **Dot Grid Pattern:** Radial gradient background texture
- **Radar Rings:** Animated pulse effects (ping/pulse)
- **Tactical Brackets:** Corner borders on cards
- **Military Vocabulary:** "Commander," "Mission Control," "Intel," "Recon"

### Typography
- Handled by `/styles/globals.css`
- Semantic HTML elements (h1, h2, h3, p) auto-styled
- **Never use font-size Tailwind classes** unless specifically requested

---

## 🔐 Authentication Flow

### Sign Up
1. User fills form (name, email, password)
2. Account created → Auto-login
3. Subscription status set to `'trial'`
4. Trial days set to `7`
5. Redirect to `/account`

### Login
1. User enters email + password
2. Login successful → Set `isLoggedIn = true`
3. Redirect to `/account`

### Logout
1. Click "Logout" in nav
2. Clear session state
3. Redirect to `/` (landing page)

---

## 💳 Subscription States

```typescript
type SubscriptionStatus = 
  | 'none'           // Free user (no trial, no paid)
  | 'trial'          // 7-day trial active
  | 'trial_expired'  // Trial ended, needs upgrade
  | 'active'         // Paid Pro subscriber
  | 'cancelled'      // Cancelled but still in billing period
```

### Free Tier (`none`)
- Basic Recon Score
- DOM-only data
- Limited sidebar panel
- ❌ No AI, no environment intel, no personalization

### Pro Tier (`active` or `trial`)
- ✅ Real commute distances
- ✅ Air/sound/light intel
- ✅ Proximity scoring
- ✅ Personalized preferences
- ✅ Full Fit Score (0-100)
- ✅ AI recon summaries
- ✅ Unlimited analysis

---

## 🚀 Development

### Key State (in App.tsx)
```typescript
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('none');
const [userName, setUserName] = useState('Alex');
const [trialDaysRemaining, setTrialDaysRemaining] = useState(7);
```

### Adding a New Page
1. Create component in `/components/website/your-page.tsx`
2. Add route in `/App.tsx`
3. Add navigation link where needed
4. Follow tactical theme (olive, navy, orange colors)
5. Use rover mascot for personality

### Modifying Colors
1. Update CSS variables in `/styles/globals.css`
2. Search for hardcoded hex values (e.g., `#556B2F`)
3. Replace throughout components
4. Test visual consistency

---

## 📦 File Structure

```
/components/website/
  ├── landing-page.tsx           # Homepage (marketing)
  ├── signup-page.tsx            # Account creation
  ├── login-page.tsx             # Authentication
  ├── account-portal.tsx         # User dashboard
  ├── billing-plan-page.tsx      # Plan selection & upgrade
  └── trial-ended-screen.tsx     # Trial expiration lock
```

---

## 🔗 Navigation Structure

```
Public Routes:
  /               → Landing Page
  /signup         → Sign Up Page
  /login          → Login Page

Protected Routes (require login):
  /account        → Account Portal
  /billing        → Billing / Plan Page
  /trial-ended    → Trial Ended Screen (only if trial expired)
```

---

## 🎯 Key Features

### Landing Page
- Full marketing site with hero, features, pricing, testimonials
- Sticky navigation with CTAs
- Pricing toggle (monthly/yearly with 25% savings badge)
- Screenshot placeholder for extension demo
- Complete footer with links

### Account Portal
- Personalized greeting with user's name
- Subscription status cards (color-coded by plan)
- Trial countdown (if on trial)
- Preference summary (generated from user input)
- Upgrade prompts for free users

### Billing Page
- Side-by-side plan comparison
- Detailed feature table
- Billing interval toggle
- "Top Secret" badge on Pro plan
- Simulated Stripe checkout flow

### Trial Ended Screen
- Sympathetic messaging (not aggressive)
- Visual indicators (sad rover, low signal bars)
- Clear locked features list
- Easy upgrade path
- Option to continue with Free

---

## 🛠️ Tech Stack

- **React** - UI components
- **TypeScript** - Type safety
- **Tailwind CSS v4.0** - Styling
- **React Router** - Client-side routing
- **Lucide React** - Icon library

---

## ⚠️ Important Notes

### This is NOT the Chrome Extension
The website handles marketing and account management only.  
The actual property analysis tool is a **separate Chrome extension codebase**.

### No Real Backend Yet
- Authentication is **simulated** (state-based)
- Stripe integration is **placeholder** (no real checkout)
- All data is **mock/hardcoded**
- Future: Connect to Supabase or similar backend

### Brand Consistency
- **Old brand:** HomeFit
- **Current brand:** NestRecon
- **Theme:** Military tactical reconnaissance
- **Tone:** Professional, mission-focused, friendly
- **Mascot:** Rover (recon robot)

---

## 📞 Common Tasks

### Update Pricing
1. Edit values in `billing-plan-page.tsx`
2. Update landing page pricing section
3. Update account portal subscription cards
4. Ensure consistency across all mentions

### Add New Feature to Pro Plan
1. Update `billing-plan-page.tsx` feature list
2. Update landing page Pro features
3. Update trial-ended screen locked features
4. Update account portal upgrade prompts

### Modify Trial Length
1. Change `trialDaysRemaining` initial value in `App.tsx`
2. Update copy mentioning "7-day" trial
3. Test countdown logic in account portal

---

## 🎓 Getting Started

1. **Review the landing page** to understand brand voice
2. **Check account portal** to see user dashboard flow
3. **Explore billing page** to understand subscription model
4. **Test the trial flow** from signup → account → billing
5. **Review state management** in `App.tsx`

---

## 🔮 Roadmap

### Current (v1.0)
✅ Complete marketing website  
✅ Full account portal  
✅ Billing & subscription UI  
✅ Trial management  
✅ Tactical branding throughout  

### Future
- Real authentication (OAuth, magic links)
- Stripe integration (actual checkout)
- Backend API (Supabase)
- Email notifications (trial ending, etc.)
- Chrome extension install detection
- User onboarding flow (preference setup)

---

**Last Updated:** December 9, 2025  
**Version:** 1.0 (NestRecon Website Launch)
