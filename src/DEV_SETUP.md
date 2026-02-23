# NestRecon - Developer Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Basic knowledge of React, TypeScript, and Tailwind CSS
- Code editor (VS Code recommended with Cursor AI extension)

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
# Navigate to http://localhost:5173
```

### Stripe links for Upgrade/Portal buttons
Add these to your `.env` and restart `npm run dev` so the Upgrade and Manage Billing buttons open real Stripe pages:
```
VITE_STRIPE_PAYMENT_LINK_MONTHLY=https://buy.stripe.com/eVqaEQ9Ra9mV4zc5bhg3601
VITE_STRIPE_PAYMENT_LINK_YEARLY=https://buy.stripe.com/28EfZa0gA56F3v8avBg3600
VITE_STRIPE_PORTAL_URL=<customer portal link - optional>
```

### Stripe → Supabase plan sync (Edge Function)
Deploy `supabase/functions/stripe-webhook` and set these secrets in Supabase:
```
STRIPE_SECRET_KEY=<your stripe secret key>
STRIPE_WEBHOOK_SECRET=<signing secret for this webhook>
SUPABASE_URL=<your supabase url>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```
In Stripe, set the Payment Link "After payment" redirect to your app (e.g., https://nestrecon.com/account?payment=success). On `checkout.session.completed`, the webhook sets `users.plan='pro'` (matched by checkout email) and clears `trial_ends_at`. The success query parameter triggers a payment success message on the account page.

### Saved Properties & Sharing (Edge Functions)
Deploy `supabase/functions/properties-save` and `supabase/functions/properties-share`, then set these secrets in Supabase:
```
RESEND_API_KEY=<your resend api key>
RESEND_FROM_EMAIL="NestRecon <share@nestrecon.com>"
SUPABASE_URL=<your supabase url>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```
**Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are already set if you've configured the Stripe webhook above.

**Resend Setup:**
1. Create a Resend account at https://resend.com
2. Get your API key from the Resend dashboard
3. Verify your domain (nestrecon.com) in Resend for production emails
4. Add the API key and from email to Supabase Edge Function secrets

**Database Migration:**
Run the migration file `supabase/migrations/2025-01-10-create-saved-properties-tables.sql` in your Supabase SQL Editor to create the required tables and RLS policies.

---

## 📂 File Structure Guide

### Essential Files (Start Here)
```
/App.tsx                     # ⭐ Main application - routing & state
/styles/globals.css          # ⭐ Color system & typography
/components/listing-panel.tsx # ⭐ Core feature - property analysis
```

### Component Categories

#### **Public Pages** (No login required)
- `landing-page.tsx` - Marketing homepage
- `pricing-page.tsx` - Subscription plans

#### **User Flow** (Authentication required)
- `onboarding-chat.tsx` - Initial setup wizard
- `settings-page.tsx` - Preference management
- `listing-panel.tsx` - Main product (property analysis)

#### **Subscription System**
- `upgrade-modal.tsx` - Upgrade CTA popup
- `trial-flow.tsx` - 7-day trial signup
- `checkout-redirect.tsx` - Pre-Stripe confirmation
- `success-page.tsx` - Post-purchase success
- `manage-subscription.tsx` - Billing management
- `soft-lock-screen.tsx` - Expired trial state

#### **Reusable Components**
- `rover-icon.tsx` - Mascot SVG
- `metric-row.tsx` - Property metric display
- `tag-chip.tsx` - Status badges (Good/Okay/Poor)

---

## 🎨 Design System Reference

### Colors (Use These Exact Values)

```css
/* Primary Colors */
--olive: #556B2F;        /* Main brand - buttons, headers */
--navy: #1e3a5f;         /* Secondary - accents */
--orange: #FF6B35;       /* Alert/Premium - warnings, PRO features */

/* Backgrounds */
--bg-primary: white;
--bg-secondary: #f9fafb; /* gray-50 */
--bg-olive-subtle: rgba(85, 107, 47, 0.05);
--bg-orange-subtle: rgba(255, 107, 53, 0.1);

/* Text */
--text-primary: #111827;   /* gray-900 */
--text-secondary: #6b7280; /* gray-500 */
--text-muted: #9ca3af;     /* gray-400 */
```

### Spacing Scale (Tailwind)
```
gap-2   = 8px
gap-3   = 12px
mb-4    = 16px
p-6     = 24px
mb-8    = 32px
```

### Border Radius
```
rounded-lg   = 8px   (most cards)
rounded-xl   = 12px  (featured cards)
rounded-2xl  = 16px  (hero sections)
rounded-full = 9999px (badges, avatar)
```

---

## 🧭 Navigation Flow

### Route Structure (in App.tsx)
```typescript
/                      → Landing Page (not logged in)
/onboarding           → Onboarding Chat (first login)
/settings             → Settings Page (logged in)
/panel                → Listing Panel (main feature)
/pricing              → Pricing Page
/trial                → Trial Flow
/checkout             → Checkout Redirect
/success              → Success Page
/manage               → Manage Subscription
/soft-lock            → Soft Lock Screen (expired)
```

### State Management
```typescript
// Main state in App.tsx
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [subscriptionStatus, setSubscriptionStatus] = useState<
  'none' | 'trial' | 'trial_expired' | 'active' | 'cancelled' | 'expired'
>('none');
```

---

## 🔧 Common Development Tasks

### Task 1: Add a New Metric to Listing Panel

1. **Open** `/components/listing-panel.tsx`
2. **Find** the section (e.g., "Environment & Night Sky")
3. **Add** a new `<MetricRow>`:
   ```tsx
   <MetricRow 
     label="Your New Metric" 
     level="good"  // or "okay" | "not-great"
     subtitle="Optional context"
   />
   ```
4. **Test** in both FREE and PRO modes

### Task 2: Update Color Scheme

1. **Open** `/styles/globals.css`
2. **Modify** CSS variables:
   ```css
   :root {
     --olive: #556B2F;  /* Change this */
   }
   ```
3. **Search** codebase for hardcoded hex values (e.g., `#556B2F`)
4. **Replace** throughout components
5. **Test** visual consistency

### Task 3: Add New Subscription Feature

1. **Update** `pricing-page.tsx` - add to PRO features list
2. **Add** to `listing-panel.tsx` - wrap in `{isLoggedIn && (...)}`
3. **Update** `upgrade-modal.tsx` - mention in benefits
4. **Update** `soft-lock-screen.tsx` - show as locked in free mode

### Task 4: Modify User Preferences

1. **Add** to `settings-page.tsx` - new preference UI
2. **Add** to `onboarding-chat.tsx` - include in setup flow
3. **Use** in `listing-panel.tsx` - display personalized result
4. **Update** Priority Match Status section

---

## 🎯 Testing Checklist

### Visual Testing
- [ ] Landing page loads with rover animation
- [ ] Colors match tactical theme (olive/navy/orange)
- [ ] All text is readable (no font-size issues)
- [ ] Responsive on mobile (test at 375px width)
- [ ] No console errors

### Flow Testing
- [ ] Login → Onboarding → Settings works
- [ ] Upgrade modal appears when clicking PRO features
- [ ] Trial flow completes successfully
- [ ] Subscription management shows correct state
- [ ] Soft lock appears for expired trial

### FREE vs PRO Testing
- [ ] FREE: Shows basic metrics only
- [ ] FREE: No AI recommendations
- [ ] FREE: No Priority Match Status section
- [ ] PRO: All features visible
- [ ] PRO: Personalized scoring active

---

## 🚨 Common Pitfalls

### ❌ DON'T
```tsx
// Don't use font Tailwind classes
<h1 className="text-2xl font-bold">Title</h1>

// Don't hardcode image URLs
<img src="https://example.com/image.png" />

// Don't modify protected files
// /components/figma/ImageWithFallback.tsx

// Don't add spaces before attribute values
<div className= "flex" />
```

### ✅ DO
```tsx
// Use semantic HTML (styled in globals.css)
<h1>Title</h1>

// Use ImageWithFallback for new images
<ImageWithFallback src={...} alt="..." />

// Use proper syntax
<div className="flex" />

// Use military vocabulary
"Deploy Mission", "Intel Confirmed", "Recon Complete"
```

---

## 📊 Data Structure Examples

### Mock Listing Data
```typescript
interface Listing {
  address: string;
  price: number;
  zestimate: number;
  walkScore: number;
  bikeScore: number;
  transitScore: number;
  soundScore: 'good' | 'okay' | 'not-great';
  airQuality: 'good' | 'okay' | 'not-great';
  stargazeScore: 'good' | 'okay' | 'not-great';
}
```

### User Preferences
```typescript
interface UserPreferences {
  airQualityImportance: 'excellent' | 'good' | 'okay';
  soundTolerance: 'excellent' | 'good' | 'okay';
  stargazeImportance: 'excellent' | 'good' | 'okay';
  skateparkDistance: string; // e.g., "8 miles"
  skateparkImportance: 'high' | 'medium' | 'low';
  preschoolDistance: string;
  preschoolImportance: 'high' | 'medium' | 'low';
  farmersMarketImportance: 'high' | 'medium' | 'low';
  minSchoolRating: number; // e.g., 7
}
```

---

## 🎨 Component Patterns

### Standard Card Layout
```tsx
<div className="bg-white rounded-xl border border-gray-200 p-6">
  <h3 className="text-gray-900 mb-4">Section Title</h3>
  <div className="space-y-3">
    {/* Content */}
  </div>
</div>
```

### PRO Feature Wrapper
```tsx
{isLoggedIn && (
  <div className="mb-6">
    <h3 className="text-gray-900 mb-3">PRO Feature</h3>
    {/* PRO-only content */}
  </div>
)}
```

### Status Badge Pattern
```tsx
<TagChip 
  label="Good" 
  variant="success"  // or "warning" | "danger"
  size="sm" 
/>
```

---

## 🔍 Debugging Tips

### Check Component Rendering
```tsx
console.log('isLoggedIn:', isLoggedIn);
console.log('subscriptionStatus:', subscriptionStatus);
```

### Verify Color Application
1. Inspect element in DevTools
2. Check if CSS variable is applied
3. Verify hex value matches design system

### Test Routing
1. Check `App.tsx` for route definition
2. Verify exact path match
3. Test navigation with browser back/forward

---

## 📝 Code Style Guide

### TypeScript
```typescript
// Use explicit types
interface Props {
  label: string;
  isActive: boolean;
}

// Use functional components
export function MyComponent({ label, isActive }: Props) {
  return <div>{label}</div>;
}
```

### Tailwind
```tsx
// Group utilities logically
<div className="
  flex items-center gap-3
  bg-white rounded-lg border border-gray-200
  p-4 mb-6
  hover:shadow-lg transition-shadow
">
```

### File Naming
```
ComponentName.tsx     → PascalCase (React components)
utility-functions.ts  → kebab-case (utilities)
```

---

## 🆘 Getting Help

### When Stuck
1. **Check** `/CURSOR_PROMPT.md` for context
2. **Review** `/README.md` for examples
3. **Search** codebase for similar patterns
4. **Test** in isolation (comment out other code)
5. **Ask Cursor AI** with specific context

### Useful Search Patterns
```bash
# Find all uses of a component
grep -r "MetricRow" components/

# Find all color references
grep -r "#556B2F" components/

# Find subscription logic
grep -r "subscriptionStatus" .
```

---

## 🎓 Learning Path

### Day 1: Orientation
- [ ] Read `/CURSOR_PROMPT.md`
- [ ] Explore `/App.tsx` routing
- [ ] Review `/styles/globals.css`
- [ ] Run app locally and click through

### Day 2: Component Deep Dive
- [ ] Study `/components/listing-panel.tsx`
- [ ] Understand `MetricRow` and `TagChip`
- [ ] Review subscription flow components
- [ ] Test FREE vs PRO modes

### Day 3: Make First Change
- [ ] Update a metric label
- [ ] Change a color value
- [ ] Add a new preference field
- [ ] Test and verify

---

## 🔮 Roadmap Context

### Current State (v2.0)
✅ Full rebrand to NestRecon
✅ Tactical military theme
✅ Complete subscription system (7 components)
✅ FREE and PRO tier separation
✅ Rover mascot integration

### Planned Features (Not Built Yet)
- Real Stripe integration
- Backend API (Supabase or similar)
- Chrome extension packaging
- Zillow DOM parsing logic
- User authentication (OAuth)
- Real environmental data API
- Geolocation services

---

## 📞 Quick Reference

### Key Files
| File | Purpose |
|------|---------|
| `App.tsx` | Routing + state management |
| `listing-panel.tsx` | Main product feature |
| `globals.css` | Design system foundation |
| `pricing-page.tsx` | Subscription plans |
| `settings-page.tsx` | User preferences |

### Key State Variables
| Variable | Type | Location |
|----------|------|----------|
| `isLoggedIn` | boolean | App.tsx |
| `subscriptionStatus` | string | App.tsx |
| `userName` | string | settings-page.tsx |
| `userPreferences` | object | settings-page.tsx |

### Key Colors
| Name | Hex | Usage |
|------|-----|-------|
| Olive | `#556B2F` | Primary brand |
| Orange | `#FF6B35` | Premium/Alert |
| Navy | `#1e3a5f` | Secondary |

---

**Ready to develop!** Start with the landing page and work your way through the subscription flow to understand the complete user journey.

**Last Updated**: December 9, 2025
