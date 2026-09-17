-- Supabase Schema for Sur Sangeet - Phase 2

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  mobile TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bhajans Table
CREATE TABLE IF NOT EXISTS public.bhajans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  deity TEXT NOT NULL,
  cover_image TEXT,
  lyrics JSONB NOT NULL,
  status TEXT DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites Table
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  bhajan_id UUID REFERENCES public.bhajans(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, bhajan_id)
);

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bhajans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow public read bhajans" ON public.bhajans FOR SELECT USING (true);

CREATE POLICY "Allow public read favorites" ON public.favorites FOR SELECT USING (true);
CREATE POLICY "Allow public insert favorites" ON public.favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete favorites" ON public.favorites FOR DELETE USING (true);
