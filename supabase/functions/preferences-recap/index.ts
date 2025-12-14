// @ts-nocheck
// Supabase Edge Function: preferences recap via OpenAI
// Env required: OPENAI_API_KEY, OPENAI_MODEL (default gpt-4o-mini-2024-07-18), OPENAI_TIMEOUT_MS (ms)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import OpenAI from "npm:openai@4.38.2";

const apiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini-2024-07-18";
const timeoutMs = Number(Deno.env.get("OPENAI_TIMEOUT_MS") ?? "12000");

const client = apiKey ? new OpenAI({ apiKey, timeout: timeoutMs }) : null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  let payload;
  try {
    payload = await req.json();
  } catch (_err) {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }

  const { userId, preferences } = payload ?? {};
  if (!userId || !preferences) {
    return new Response("Missing userId or preferences", { status: 400, headers: corsHeaders });
  }

  if (!client || !apiKey) {
    console.error("OpenAI API key missing");
    return new Response("OpenAI not configured", { status: 500, headers: corsHeaders });
  }

  const { tags = [], toggles = {} } = preferences;

  const tagsText = tags
    .map((t: any) => t.label)
    .join(", ") || "none provided";

  const togglesText = Object.entries(toggles || {})
    .filter(([, v]) => v)
    .map(([k]) => {
      // Human-readable labels for the toggles
      const labels: Record<string, string> = {
        walkScore: "walkability",
        bikeScore: "bikeability",
        transitScore: "transit access",
        airQuality: "good air quality",
        soundScore: "low noise levels",
        stargazeScore: "good stargazing conditions"
      };
      return labels[k] || k;
    })
    .join(", ") || "none";

const prompt = `
Write a warm, human one-paragraph summary (under 80 words) in second person: "You are looking for… You also want…".
Simply restate their inputs (place types and environmental preferences) without asking for anything,
without promising listings, and without sales language. Make it readable and personal.

Place types: ${tagsText}
Environmental preferences: ${togglesText}

Return plain text only.`;

  try {
    const resp = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.3,
    });

    const recap = resp.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ recap }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("OpenAI recap error", err);
    return new Response("OpenAI error", { status: 500, headers: corsHeaders });
  }
});

