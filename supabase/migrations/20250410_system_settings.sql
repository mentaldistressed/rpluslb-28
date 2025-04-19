-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create changelog table
CREATE TABLE IF NOT EXISTS public.changelog_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  description TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable row level security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;

-- Insert initial system version and last update
INSERT INTO public.system_settings (key, value)
VALUES 
  ('system_version', '1.1.2.1'),
  ('last_update', '2025-04-18 18:08'),
  ('news_banner', 'Добро пожаловать в систему управления тикетами!')
ON CONFLICT (key) DO NOTHING;

-- Add RLS policies for system_settings
CREATE POLICY "Anyone can read system_settings" ON public.system_settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify system_settings" ON public.system_settings
  FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Add RLS policies for changelog
CREATE POLICY "Anyone can read changelog" ON public.changelog_entries
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify changelog" ON public.changelog_entries
  FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Make sure tables are part of the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.changelog_entries;
