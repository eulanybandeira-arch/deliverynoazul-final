-- Add status column to recipes table for draft/complete status
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'complete';

-- Add comment for clarity
COMMENT ON COLUMN public.recipes.status IS 'Recipe status: complete (all ingredients matched) or draft (missing ingredients)';