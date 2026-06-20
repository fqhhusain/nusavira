-- 1. Create the Global Leaderboard table
CREATE TABLE leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name TEXT NOT NULL,
  win_streak INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow anyone to read the leaderboard
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access for Leaderboard" ON leaderboard FOR SELECT USING (true);

-- Allow anyone to insert/update their score (for simplicity in Phase 1)
CREATE POLICY "Public Insert Access for Leaderboard" ON leaderboard FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access for Leaderboard" ON leaderboard FOR UPDATE USING (true);

-- 2. Create the Cloud Saves table
CREATE TABLE cloud_saves (
  sync_code TEXT PRIMARY KEY,
  save_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow anyone to read and write saves (they need to know the secret sync_code to read it)
ALTER TABLE cloud_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access for Cloud Saves" ON cloud_saves FOR SELECT USING (true);
CREATE POLICY "Public Insert Access for Cloud Saves" ON cloud_saves FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access for Cloud Saves" ON cloud_saves FOR UPDATE USING (true);
