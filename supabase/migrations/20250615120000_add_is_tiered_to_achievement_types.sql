
-- Add is_tiered field to achievement_types table
ALTER TABLE achievement_types 
ADD COLUMN is_tiered boolean NOT NULL DEFAULT false;

-- Update existing records to set appropriate values
UPDATE achievement_types 
SET is_tiered = true 
WHERE name LIKE '%Juara%' OR name LIKE '%Peringkat%';
