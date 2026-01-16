// Supabase Edge Function: Save/Toggle Property
// Endpoint: POST /functions/v1/properties/save
// Purpose: Save or unsave a property for the authenticated user (idempotent toggle)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

interface SavePropertyRequest {
  zillowUrl: string;
  address: string;
  score: number; // 0-100
  matchLabel: string;
  summaryMetrics?: {
    schoolAvg?: number;
    noise?: string;
    walkability?: number;
    bikeScore?: number;
    transitScore?: number;
    airQuality?: string;
    stargazeScore?: string;
    [key: string]: any; // Allow flexible metrics
  };
}

interface SavePropertyResponse {
  saved: boolean;
  savedProperty?: {
    id: string;
    address: string;
    zillowUrl: string;
    nestreconScore: number;
    matchLabel: string | null;
    summaryMetrics: any;
    createdAt: string;
    lastScannedAt: string;
  };
}

/**
 * Resolves auth.uid() to users.id by looking up auth_user_id
 */
async function resolveUserId(
  supabase: any,
  authUserId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    console.error("[properties-save] Error resolving user ID:", error);
    return null;
  }

  return data?.id || null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create Supabase client with user's token for auth operations
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      console.error("[properties-save] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve auth.uid() to users.id
    const actualUserId = await resolveUserId(supabaseAdmin, user.id);
    if (!actualUserId) {
      console.error("[properties-save] Could not resolve user ID for:", user.id);
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let body: SavePropertyRequest;
    try {
      body = await req.json();
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    if (!body.zillowUrl || !body.address || body.score === undefined || !body.matchLabel) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: zillowUrl, address, score, matchLabel" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if property already exists for this user
    const { data: existing, error: checkError } = await supabaseAdmin
      .from("saved_properties")
      .select("*")
      .eq("user_id", actualUserId)
      .eq("zillow_url", body.zillowUrl)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine
      console.error("[properties-save] Error checking existing property:", checkError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existing) {
      // Property exists - delete it (toggle off)
      const { error: deleteError } = await supabaseAdmin
        .from("saved_properties")
        .delete()
        .eq("id", existing.id);

      if (deleteError) {
        console.error("[properties-save] Error deleting property:", deleteError);
        return new Response(
          JSON.stringify({ error: "Failed to unsave property" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ saved: false } as SavePropertyResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Property doesn't exist - insert it (toggle on)
      const now = new Date().toISOString();
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("saved_properties")
        .insert({
          user_id: actualUserId,
          address: body.address,
          zillow_url: body.zillowUrl,
          nestrecon_score: body.score,
          match_label: body.matchLabel,
          summary_metrics: body.summaryMetrics || {},
          created_at: now,
          last_scanned_at: now,
        })
        .select()
        .single();

      if (insertError) {
        console.error("[properties-save] Error inserting property:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to save property" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response: SavePropertyResponse = {
        saved: true,
        savedProperty: {
          id: inserted.id,
          address: inserted.address,
          zillowUrl: inserted.zillow_url,
          nestreconScore: inserted.nestrecon_score,
          matchLabel: inserted.match_label,
          summaryMetrics: inserted.summary_metrics,
          createdAt: inserted.created_at,
          lastScannedAt: inserted.last_scanned_at,
        },
      };

      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("[properties-save] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
