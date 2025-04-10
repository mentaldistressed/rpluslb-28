
-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable row level security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Insert an empty news banner
INSERT INTO public.system_settings (key, value)
VALUES ('news_banner', 'Добро пожаловать в систему управления тикетами!')
ON CONFLICT (key) DO NOTHING;

-- Add RLS policy for read access
CREATE POLICY "Anyone can read system_settings" ON public.system_settings
  FOR SELECT USING (true);

-- Add RLS policy for admin write access
CREATE POLICY "Only admins can modify system_settings" ON public.system_settings
  FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Make sure the table is part of the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
