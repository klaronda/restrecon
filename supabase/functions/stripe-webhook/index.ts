// @ts-nocheck
// Supabase Edge Function: Stripe webhook handler
// Purpose: When Stripe checkout completes, set the user plan to "pro" in public.users.
// Match users by email (from checkout.session.customer_details.email).
// Env vars required:
// - STRIPE_SECRET_KEY
// - STRIPE_WEBHOOK_SECRET
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY

// deno-lint-ignore-file no-explicit-any
import Stripe from "npm:stripe@^12.18.0";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.4";

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
  console.error("Missing required environment variables for Stripe webhook.");
}

const stripe = new Stripe(stripeSecret ?? "", {
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(supabaseUrl ?? "", serviceRoleKey ?? "", {
  auth: { autoRefreshToken: false, persistSession: false },
});

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!signature || !webhookSecret) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return new Response("Bad signature", { status: 400 });
  }

  console.log("stripe_webhook_event", {
    id: event.id,
    type: event.type,
  });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email =
        session.customer_details?.email ??
        session.customer_email ??
        null;

      if (email) {
        try {
          await updateUserPlanByEmail(email, "pro", null);
          console.log("checkout.completed → plan=pro", { email });
        } catch (error) {
          console.error("Failed to update user plan (checkout)", error);
          return new Response("Update failed", { status: 500 });
        }
      } else {
        console.warn("No email on checkout.session; cannot map user.");
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const status = sub.status;
      const email = await extractEmailFromSubscription(sub);

      if (!email) {
        console.warn("No email on subscription.updated; cannot map user.");
        break;
      }

      // Map Stripe status to plan
      if (status === "active" || status === "trialing") {
        try {
          await updateUserPlanByEmail(email, "pro", null);
          console.log("subscription.updated → plan=pro", { email, status });
        } catch (error) {
          console.error("Failed to update user plan (subscription.updated)", error);
          return new Response("Update failed", { status: 500 });
        }
      } else if (status === "past_due" || status === "unpaid" || status === "canceled" || status === "incomplete_expired") {
        try {
          await updateUserPlanByEmail(email, "trial_expired", new Date().toISOString());
          console.log("subscription.updated → plan=trial_expired", { email, status });
        } catch (error) {
          console.error("Failed to downgrade user (subscription.updated)", error);
          return new Response("Update failed", { status: 500 });
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const email = await extractEmailFromSubscription(sub);
      if (!email) {
        console.warn("No email on subscription.deleted; cannot map user.");
        break;
      }
      try {
        await updateUserPlanByEmail(email, "trial_expired", new Date().toISOString());
        console.log("subscription.deleted → plan=trial_expired", { email });
      } catch (error) {
        console.error("Failed to downgrade user (subscription.deleted)", error);
        return new Response("Update failed", { status: 500 });
      }
      break;
    }

    default:
      // Ignore other events
      break;
  }

  return new Response("ok", { status: 200 });
});

async function updateUserPlanByEmail(email: string, plan: string, trialEndsAt: string | null) {
  const { error } = await supabase
    .from("users")
    .update({
      plan,
      trial_ends_at: trialEndsAt,
    })
    .eq("email", email);

  if (error) throw error;
}

async function extractEmailFromSubscription(sub: Stripe.Subscription): Promise<string | null> {
  // Try to get email from customer_details (if attached) or retrieve the customer
  if (typeof sub.customer === "string") {
    const customer = await stripe.customers.retrieve(sub.customer);
    // deno-lint-ignore no-explicit-any
    const custAny = customer as any;
    return custAny.email ?? null;
  } else if (sub.customer && (sub.customer as Stripe.Customer).email) {
    return (sub.customer as Stripe.Customer).email ?? null;
  }
  return null;
}

