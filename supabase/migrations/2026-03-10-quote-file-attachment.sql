-- Add file attachment columns to quote_requests
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS quote_file TEXT;
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS quote_file_name TEXT;
