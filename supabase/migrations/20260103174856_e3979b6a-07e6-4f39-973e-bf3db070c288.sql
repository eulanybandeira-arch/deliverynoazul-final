-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_knowledge_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    WHERE auth.jwt() ->> 'email' IN ('lanyabandeira@gmail.com')
  );
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own knowledge base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Users can insert own knowledge base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Users can update own knowledge base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Users can delete own knowledge base" ON public.knowledge_base;

-- Create new policies that allow admin full access
CREATE POLICY "Users and admins can view knowledge base" 
ON public.knowledge_base 
FOR SELECT 
USING (auth.uid() = user_id OR public.is_knowledge_admin());

CREATE POLICY "Users and admins can insert knowledge base" 
ON public.knowledge_base 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR public.is_knowledge_admin());

CREATE POLICY "Users and admins can update knowledge base" 
ON public.knowledge_base 
FOR UPDATE 
USING (auth.uid() = user_id OR public.is_knowledge_admin());

CREATE POLICY "Users and admins can delete knowledge base" 
ON public.knowledge_base 
FOR DELETE 
USING (auth.uid() = user_id OR public.is_knowledge_admin());