const monthlyLink =
  import.meta.env.VITE_STRIPE_PAYMENT_LINK_MONTHLY ||
  import.meta.env.VITE_STRIPE_PAYMENT_LINK;

const yearlyLink =
  import.meta.env.VITE_STRIPE_PAYMENT_LINK_YEARLY ||
  monthlyLink;

const portalUrl = import.meta.env.VITE_STRIPE_PORTAL_URL;

const openExternal = (url: string) => {
  if (typeof window === 'undefined') return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

export function startCheckout(billingPeriod: 'monthly' | 'yearly') {
  const target = billingPeriod === 'yearly' ? yearlyLink : monthlyLink;
  if (!target) {
    throw new Error(
      'Missing Stripe payment link. Set VITE_STRIPE_PAYMENT_LINK (and optional VITE_STRIPE_PAYMENT_LINK_MONTHLY / VITE_STRIPE_PAYMENT_LINK_YEARLY).'
    );
  }
  openExternal(target);
}

export function openCustomerPortal() {
  if (!portalUrl) {
    throw new Error(
      'Missing Stripe customer portal URL. Set VITE_STRIPE_PORTAL_URL.'
    );
  }
  openExternal(portalUrl);
}


