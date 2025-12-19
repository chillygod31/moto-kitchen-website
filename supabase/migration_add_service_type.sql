-- Migration: Add service_type column to quote_requests table
-- Run this in your Supabase SQL editor if you have an existing database

-- Add the service_type column
ALTER TABLE quote_requests 
ADD COLUMN IF NOT EXISTS service_type TEXT;

-- Add index for filtering/searching by service type
CREATE INDEX IF NOT EXISTS idx_quote_requests_service_type ON quote_requests(service_type);

