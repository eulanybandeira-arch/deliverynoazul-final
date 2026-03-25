-- Create knowledge base table for Lucra
CREATE TABLE public.knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual', -- 'manual' or 'file'
  file_url TEXT,
  file_name TEXT,
  tags TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own knowledge base" 
ON public.knowledge_base 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own knowledge base" 
ON public.knowledge_base 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge base" 
ON public.knowledge_base 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own knowledge base" 
ON public.knowledge_base 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_knowledge_base_updated_at
BEFORE UPDATE ON public.knowledge_base
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for knowledge documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-docs', 'knowledge-docs', false);

-- Storage policies for knowledge docs
CREATE POLICY "Users can view own knowledge docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'knowledge-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own knowledge docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'knowledge-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own knowledge docs"
ON storage.objects FOR DELETE
USING (bucket_id = 'knowledge-docs' AND auth.uid()::text = (storage.foldername(name))[1]);