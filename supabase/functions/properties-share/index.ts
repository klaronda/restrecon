// Supabase Edge Function: Share Property
// Endpoint: POST /functions/v1/properties/share
// Purpose: Share a saved property via email, optionally including user's preference summary

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "NestRecon <share@nestrecon.com>";

interface SharePropertyRequest {
  savedPropertyId: string; // UUID
  recipientEmail: string;
  message?: string;
  includePreferences: boolean;
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
    console.error("[properties-share] Error resolving user ID:", error);
    return null;
  }

  return data?.id || null;
}

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Gets badge colors based on match label (matching extension panel.css)
 */
function getBadgeColors(matchLabel: string | null): { bg: string; text: string } {
  if (!matchLabel) return { bg: '#f3f4f6', text: '#6b7280' };
  if (matchLabel.includes('Great')) return { bg: '#dfe9c7', text: '#2f3c20' };
  if (matchLabel.includes('Fair')) return { bg: '#e9f1d8', text: '#3f4f24' };
  if (matchLabel.includes('Poor')) return { bg: '#fde7c3', text: '#8a5b00' };
  if (matchLabel.includes('Not a Match')) return { bg: '#fbd2d2', text: '#9f1d1d' };
  return { bg: '#f3f4f6', text: '#6b7280' };
}

/**
 * Generates HTML email template with tactical NestRecon branding
 */
function generateEmailHTML(
  senderName: string,
  recipientName: string,
  property: any,
  preferenceSummary: string | null,
  customMessage: string | null
): string {
  const currentYear = new Date().getFullYear();
  const badgeColors = getBadgeColors(property.match_label);
  
  // Build metrics rows (2-column grid)
  const metrics = property.summary_metrics || {};
  const metricRows: string[] = [];
  
  if (metrics.schoolAvg !== undefined) {
    const val = typeof metrics.schoolAvg === 'number' ? metrics.schoolAvg.toFixed(1) : metrics.schoolAvg;
    metricRows.push(`<td style="padding: 6px 0;"><span style="font-weight: 600; color: #1a1a1a;">School Rating:</span> <span style="color: #4a5568;">${val}/10</span></td>`);
  }
  if (metrics.walkability !== undefined) {
    metricRows.push(`<td style="padding: 6px 0;"><span style="font-weight: 600; color: #1a1a1a;">Walkability:</span> <span style="color: #4a5568;">${metrics.walkability}/100</span></td>`);
  }
  if (metrics.noise) {
    metricRows.push(`<td style="padding: 6px 0;"><span style="font-weight: 600; color: #1a1a1a;">Sound Score:</span> <span style="color: #4a5568;">${metrics.noise}</span></td>`);
  }
  if (metrics.bikeScore !== undefined) {
    metricRows.push(`<td style="padding: 6px 0;"><span style="font-weight: 600; color: #1a1a1a;">Bike Score:</span> <span style="color: #4a5568;">${metrics.bikeScore}/100</span></td>`);
  }
  if (metrics.transitScore !== undefined) {
    metricRows.push(`<td style="padding: 6px 0;"><span style="font-weight: 600; color: #1a1a1a;">Transit Score:</span> <span style="color: #4a5568;">${metrics.transitScore}/100</span></td>`);
  }
  if (metrics.airQuality) {
    metricRows.push(`<td style="padding: 6px 0;"><span style="font-weight: 600; color: #1a1a1a;">Air Quality:</span> <span style="color: #4a5568;">${metrics.airQuality}</span></td>`);
  }
  if (metrics.stargazeScore) {
    // Convert stargaze score to label
    const numVal = typeof metrics.stargazeScore === 'number' ? metrics.stargazeScore : parseFloat(metrics.stargazeScore);
    let stargazeLabel = metrics.stargazeScore;
    if (!isNaN(numVal)) {
      if (numVal <= 2) stargazeLabel = 'Excellent';
      else if (numVal <= 3) stargazeLabel = 'Good';
      else if (numVal <= 4) stargazeLabel = 'Okay';
      else if (numVal <= 5) stargazeLabel = 'Not Great';
      else stargazeLabel = 'Not Good';
    }
    metricRows.push(`<td style="padding: 6px 0;"><span style="font-weight: 600; color: #1a1a1a;">Stargaze Score:</span> <span style="color: #4a5568;">${stargazeLabel}</span></td>`);
  }

  // Build 2-column metric grid
  let metricsHTML = '';
  if (metricRows.length > 0) {
    metricsHTML = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 14px; line-height: 1.6;">';
    for (let i = 0; i < metricRows.length; i += 2) {
      metricsHTML += '<tr>';
      metricsHTML += metricRows[i];
      if (metricRows[i + 1]) {
        metricsHTML += metricRows[i + 1];
      } else {
        metricsHTML += '<td></td>';
      }
      metricsHTML += '</tr>';
    }
    metricsHTML += '</table>';
  }

  // Custom message section (amber left-border) - appears BEFORE preferences
  const messageSection = customMessage
    ? `
      <tr>
        <td style="padding: 0 40px 24px 40px;">
          <div style="background-color: #fffbeb; border-left: 3px solid #F3A712; padding: 16px; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">
              Message from ${senderName}:
            </p>
            <p style="margin: 0; color: #4a5568; font-size: 13px; line-height: 1.6; font-style: italic;">
              "${customMessage}"
            </p>
          </div>
        </td>
      </tr>
    `
    : '';

  // Preferences section (green left-border) - appears AFTER message
  const preferencesSection = preferenceSummary
    ? `
      <tr>
        <td style="padding: 0 40px 24px 40px;">
          <div style="background-color: #f9fafb; border-left: 3px solid #556B2F; padding: 16px; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">
              ${senderName}'s Preferences:
            </p>
            <p style="margin: 0; color: #4a5568; font-size: 13px; line-height: 1.6;">
              ${preferenceSummary}
            </p>
          </div>
        </td>
      </tr>
    `
    : '';

  // What is NestRecon section - always shown
  const aboutSection = `
      <tr>
        <td style="padding: 0 40px 24px 40px;">
          <div style="background: linear-gradient(135deg, rgba(85, 107, 47, 0.08) 0%, rgba(214, 201, 162, 0.12) 100%); border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">
              What is NestRecon?
            </p>
            <p style="margin: 0 0 12px 0; color: #4a5568; font-size: 13px; line-height: 1.6;">
              NestRecon is an intelligence-driven home search tool that scores properties based on what matters most to you — schools, walkability, noise levels, and more.
            </p>
            <a href="https://nestrecon.com" style="color: #556B2F; font-size: 13px; font-weight: 600; text-decoration: none;">
              Learn more at nestrecon.com →
            </a>
          </div>
        </td>
      </tr>
    `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Property Shared - NestRecon</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; -webkit-font-smoothing: antialiased;">
  
  <!-- Email Container -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Main Content Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
          
          <!-- Header with Tactical Styling -->
          <tr>
            <td style="background: linear-gradient(135deg, #556B2F 0%, #4a5e28 100%); padding: 40px 40px 36px 40px; text-align: center; position: relative;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <img src="https://eqqbsiuqjnqpiiuumanu.supabase.co/storage/v1/object/public/site_assets/email/Email_Logo.png" alt="NestRecon" width="56" height="56" style="display: block; margin: 0 auto 12px auto;" />
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 0.02em;">NestRecon</h1>
                    <div style="margin-top: 16px;">
                      <span style="display: inline-block; background-color: #F3A712; color: #ffffff; padding: 10px 24px; border-radius: 24px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                        [ PROPERTY INTEL SHARED ]
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 8px 40px 16px 40px;">
              <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                Hi ${recipientName},
              </p>
              <p style="margin: 12px 0 0 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                <strong>${senderName}</strong> shared a property with you from their NestRecon reconnaissance.
              </p>
            </td>
          </tr>

          <!-- Property Card -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <div style="background: linear-gradient(135deg, rgba(85, 107, 47, 0.05) 0%, rgba(214, 201, 162, 0.08) 100%); border: 1px solid #e5e7eb; padding: 24px; border-radius: 8px;">
                
                <!-- Address -->
                <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 18px; font-weight: 600; line-height: 1.4;">
                  ${property.address}
                </h2>
                
                <!-- Score and Badge -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                  <tr>
                    <td style="vertical-align: middle;">
                      <span style="font-size: 32px; font-weight: 800; color: #556B2F;">${property.nestrecon_score}</span>
                      <span style="font-size: 16px; color: #6b7280; margin-left: 4px;">/ 100</span>
                    </td>
                    <td style="vertical-align: middle; padding-left: 16px;">
                      <span style="display: inline-block; background-color: ${badgeColors.bg}; color: ${badgeColors.text}; padding: 8px 16px; border-radius: 999px; font-size: 13px; font-weight: 700;">
                        ${property.match_label || 'No Match'}
                      </span>
                    </td>
                  </tr>
                </table>

                <!-- Metrics Grid -->
                ${metricsHTML ? `
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 8px;">
                    <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Intel Summary</p>
                    ${metricsHTML}
                  </div>
                ` : ''}

                <!-- View on Zillow Button -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 20px;">
                  <tr>
                    <td>
                      <a href="${property.zillow_url}" style="display: inline-block; background-color: #556B2F; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 12px rgba(85, 107, 47, 0.25);">
                        View on Zillow
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          ${messageSection}
          ${preferencesSection}
          ${aboutSection}

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
              
              <!-- Tactical Brackets -->
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="color: #556B2F; font-size: 18px; opacity: 0.3;">[ • ]</span>
              </div>

              <!-- Footer Links -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <a href="https://nestrecon.com" style="color: #6b7280; text-decoration: none; font-size: 13px; margin: 0 12px;">Home</a>
                    <span style="color: #d1d5db;">|</span>
                    <a href="https://nestrecon.com/login" style="color: #6b7280; text-decoration: none; font-size: 13px; margin: 0 12px;">Login</a>
                    <span style="color: #d1d5db;">|</span>
                    <a href="https://nestrecon.com/faq" style="color: #6b7280; text-decoration: none; font-size: 13px; margin: 0 12px;">FAQ</a>
                  </td>
                </tr>
              </table>

              <!-- Company Info -->
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px; line-height: 1.5; text-align: center;">
                NestRecon - Intelligence-Driven Home Search<br>
                Helping home buyers make informed decisions
              </p>

            </td>
          </tr>

        </table>
        <!-- End Main Content Card -->

        <!-- Spacer -->
        <div style="height: 20px;"></div>

        <!-- Fine Print -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px;">
          <tr>
            <td style="color: #9ca3af; font-size: 11px; line-height: 1.5; text-align: center; padding: 0 20px;">
              © ${currentYear} NestRecon. All rights reserved.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
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
      console.error("[properties-share] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve auth.uid() to users.id
    const actualUserId = await resolveUserId(supabaseAdmin, user.id);
    if (!actualUserId) {
      console.error("[properties-share] Could not resolve user ID for:", user.id);
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let body: SharePropertyRequest;
    try {
      body = await req.json();
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    if (!body.savedPropertyId || !body.recipientEmail || body.includePreferences === undefined) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: savedPropertyId, recipientEmail, includePreferences" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    if (!isValidEmail(body.recipientEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid recipient email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate savedPropertyId belongs to authenticated user
    const { data: savedProperty, error: propertyError } = await supabaseAdmin
      .from("saved_properties")
      .select("*")
      .eq("id", body.savedPropertyId)
      .eq("user_id", actualUserId)
      .maybeSingle();

    if (propertyError) {
      console.error("[properties-share] Error fetching property:", propertyError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!savedProperty) {
      return new Response(
        JSON.stringify({ error: "Saved property not found or access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch sender's name from users table
    const { data: senderUser, error: senderError } = await supabaseAdmin
      .from("users")
      .select("first_name, email")
      .eq("id", actualUserId)
      .maybeSingle();

    if (senderError) {
      console.error("[properties-share] Error fetching sender:", senderError);
    }

    const senderName = senderUser?.first_name || senderUser?.email || "A NestRecon user";

    // Fetch preference summary if requested
    let preferenceSummary: string | null = null;
    if (body.includePreferences) {
      const { data: preferenceProfile, error: prefError } = await supabaseAdmin
        .from("preference_profiles")
        .select("summary_text")
        .eq("user_id", actualUserId)
        .maybeSingle();

      if (!prefError && preferenceProfile?.summary_text) {
        preferenceSummary = preferenceProfile.summary_text;
      }
    }

    // Insert share record
    const { data: shareRecord, error: shareError } = await supabaseAdmin
      .from("property_shares")
      .insert({
        saved_property_id: body.savedPropertyId,
        sender_user_id: actualUserId,
        recipient_email: body.recipientEmail,
        include_preferences: body.includePreferences,
        message: body.message || null,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (shareError) {
      console.error("[properties-share] Error inserting share record:", shareError);
      return new Response(
        JSON.stringify({ error: "Failed to record share" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email via Resend
    if (!resendApiKey) {
      console.error("[properties-share] RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recipientName = body.recipientEmail.split("@")[0];
    const emailHTML = generateEmailHTML(
      senderName,
      recipientName,
      savedProperty,
      preferenceSummary,
      body.message || null
    );

    const emailSubject = `${senderName} shared ${savedProperty.address} with you`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: body.recipientEmail,
        subject: emailSubject,
        html: emailHTML,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.json();
      console.error("[properties-share] Resend API error:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send email",
          details: error 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailResult = await emailResponse.json();
    console.log("[properties-share] Email sent successfully:", emailResult.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        shareId: shareRecord.id,
        emailId: emailResult.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[properties-share] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
