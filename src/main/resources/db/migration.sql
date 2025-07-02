-- Migration script to add resumeTips and learningRecommendations fields to analyses table
-- This is optional since Hibernate ddl-auto=update will handle it automatically

-- Add resumeTips column if it doesn't exist
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS resume_tips LONGTEXT 
COMMENT 'JSON array of resume improvement tips';

-- Add learningRecommendations column if it doesn't exist  
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS learning_recommendations LONGTEXT 
COMMENT 'JSON array of learning and skill development recommendations';

-- Update existing records to have empty arrays instead of NULL
UPDATE analyses 
SET resume_tips = '[]' 
WHERE resume_tips IS NULL;

UPDATE analyses 
SET learning_recommendations = '[]' 
WHERE learning_recommendations IS NULL;

-- Migration for recruiter dashboard features: candidate notes and favorites
-- Add notes column to leaderboard_entries if it doesn't exist
ALTER TABLE leaderboard_entries 
ADD COLUMN IF NOT EXISTS notes LONGTEXT 
COMMENT 'Recruiter notes about the candidate';

-- Add isFavorite column to leaderboard_entries if it doesn't exist
ALTER TABLE leaderboard_entries 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE 
COMMENT 'Whether the candidate is marked as favorite by the recruiter';

-- Update existing records to have default values
UPDATE leaderboard_entries 
SET notes = '' 
WHERE notes IS NULL;

UPDATE leaderboard_entries 
SET is_favorite = FALSE 
WHERE is_favorite IS NULL;
