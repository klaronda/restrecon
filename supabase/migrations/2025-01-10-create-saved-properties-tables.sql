-- Migration: Create saved_properties and property_shares tables
-- Date: 2025-01-10
-- Description: Tables for saving properties from Chrome extension and sharing them via email

-- Create saved_properties table
CREATE TABLE IF NOT EXISTS saved_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address text NOT NULL,
  zillow_url text NOT NULL,
  nestrecon_score integer NOT NULL,
  match_label text, -- e.g., "Great Match", "Fair Match", "Poor Match", "Not a Match"
  summary_metrics jsonb, -- { school_avg: number, noise: string, walkability: number, ... }
  created_at timestamp with time zone DEFAULT now(),
  last_scanned_at timestamp with time zone DEFAULT now(),
  
  -- Unique constraint: one saved property per user per Zillow URL
  UNIQUE(user_id, zillow_url)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_zillow_url ON saved_properties(zillow_url);

-- Create property_shares table
CREATE TABLE IF NOT EXISTS property_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_property_id uuid NOT NULL REFERENCES saved_properties(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  include_preferences boolean DEFAULT false,
  message text,
  sent_at timestamp with time zone DEFAULT now()
);

-- Create indexes for property_shares
CREATE INDEX IF NOT EXISTS idx_property_shares_saved_property_id ON property_shares(saved_property_id);
CREATE INDEX IF NOT EXISTS idx_property_shares_sender_user_id ON property_shares(sender_user_id);

-- Enable Row Level Security
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_properties
-- Users can only view their own saved properties
CREATE POLICY "Users can view their own saved properties"
  ON saved_properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = saved_properties.user_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Users can insert their own saved properties
CREATE POLICY "Users can insert their own saved properties"
  ON saved_properties FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = saved_properties.user_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Users can update their own saved properties
CREATE POLICY "Users can update their own saved properties"
  ON saved_properties FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = saved_properties.user_id
      AND u.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = saved_properties.user_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Users can delete their own saved properties
CREATE POLICY "Users can delete their own saved properties"
  ON saved_properties FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = saved_properties.user_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- RLS Policies for property_shares
-- Users can view shares for their own saved properties
CREATE POLICY "Users can view shares for their own properties"
  ON property_shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM saved_properties sp
      JOIN users u ON u.id = sp.user_id
      WHERE sp.id = property_shares.saved_property_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Users can create shares for their own properties
CREATE POLICY "Users can create shares for their own properties"
  ON property_shares FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saved_properties sp
      JOIN users u ON u.id = sp.user_id
      WHERE sp.id = property_shares.saved_property_id
      AND u.auth_user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = property_shares.sender_user_id
      AND u.auth_user_id = auth.uid()
    )
  );
