-- Migration: Add expanded branding columns to tenant_branding table
-- Run this in Supabase SQL Editor

-- Add new branding columns if they don't exist
ALTER TABLE tenant_branding 
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#FAF6EF',
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#1F1F1F',
ADD COLUMN IF NOT EXISTS muted_color TEXT DEFAULT '#4B4B4B',
ADD COLUMN IF NOT EXISTS font_heading TEXT DEFAULT 'Cormorant Garamond',
ADD COLUMN IF NOT EXISTS font_body TEXT DEFAULT 'Work Sans',
ADD COLUMN IF NOT EXISTS radius_sm TEXT DEFAULT '0.25rem',
ADD COLUMN IF NOT EXISTS radius_md TEXT DEFAULT '0.5rem',
ADD COLUMN IF NOT EXISTS radius_lg TEXT DEFAULT '0.75rem',
ADD COLUMN IF NOT EXISTS logo_dark_url TEXT,
ADD COLUMN IF NOT EXISTS shadow_sm TEXT DEFAULT '0 1px 2px rgba(0,0,0,0.05)',
ADD COLUMN IF NOT EXISTS shadow_md TEXT DEFAULT '0 4px 6px rgba(0,0,0,0.1)';

-- Update existing Moto Kitchen branding with default values if null
UPDATE tenant_branding
SET 
  background_color = COALESCE(background_color, '#FAF6EF'),
  text_color = COALESCE(text_color, '#1F1F1F'),
  muted_color = COALESCE(muted_color, '#4B4B4B'),
  font_heading = COALESCE(font_heading, 'Cormorant Garamond'),
  font_body = COALESCE(font_body, 'Work Sans'),
  radius_sm = COALESCE(radius_sm, '0.25rem'),
  radius_md = COALESCE(radius_md, '0.5rem'),
  radius_lg = COALESCE(radius_lg, '0.75rem'),
  shadow_sm = COALESCE(shadow_sm, '0 1px 2px rgba(0,0,0,0.05)'),
  shadow_md = COALESCE(shadow_md, '0 4px 6px rgba(0,0,0,0.1)')
WHERE tenant_id IN (SELECT id FROM tenants WHERE slug = 'moto-kitchen');

-- Create tenant_branding record for Moto Kitchen if it doesn't exist
INSERT INTO tenant_branding (
  tenant_id,
  primary_color,
  secondary_color,
  background_color,
  text_color,
  muted_color,
  font_heading,
  font_body,
  radius_sm,
  radius_md,
  radius_lg,
  shadow_sm,
  shadow_md
)
SELECT 
  id,
  '#C9653B',
  '#3A2A24',
  '#FAF6EF',
  '#1F1F1F',
  '#4B4B4B',
  'Cormorant Garamond',
  'Work Sans',
  '0.25rem',
  '0.5rem',
  '0.75rem',
  '0 1px 2px rgba(0,0,0,0.05)',
  '0 4px 6px rgba(0,0,0,0.1)'
FROM tenants
WHERE slug = 'moto-kitchen'
ON CONFLICT (tenant_id) DO NOTHING;

