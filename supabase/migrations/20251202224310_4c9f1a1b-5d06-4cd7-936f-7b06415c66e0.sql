-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('estoque_baixo', 'conta_vencer', 'analise_semanal', 'sistema')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Service role can insert (for edge functions)
CREATE POLICY "Service role can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);