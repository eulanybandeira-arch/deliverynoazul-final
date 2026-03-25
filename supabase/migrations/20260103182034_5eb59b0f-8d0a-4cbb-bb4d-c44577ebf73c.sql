-- Create storage policies for knowledge-docs bucket to allow admin access

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin can upload knowledge docs" ON storage.objects;
DROP POLICY IF EXISTS "Admin can view knowledge docs" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete knowledge docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own knowledge docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own knowledge docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own knowledge docs" ON storage.objects;

-- Create policy for admin to upload files
CREATE POLICY "Admin can upload knowledge docs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'knowledge-docs' 
  AND public.is_knowledge_admin()
);

-- Create policy for admin to view files
CREATE POLICY "Admin can view knowledge docs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'knowledge-docs' 
  AND public.is_knowledge_admin()
);

-- Create policy for admin to delete files
CREATE POLICY "Admin can delete knowledge docs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'knowledge-docs' 
  AND public.is_knowledge_admin()
);

-- Create policy for users to upload their own knowledge docs
CREATE POLICY "Users can upload own knowledge docs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'knowledge-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to view their own knowledge docs
CREATE POLICY "Users can view own knowledge docs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'knowledge-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to delete their own knowledge docs
CREATE POLICY "Users can delete own knowledge docs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'knowledge-docs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);