-- 3. Create Syndicates Table
CREATE TABLE syndicates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  join_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE syndicates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access for Syndicates" ON syndicates FOR SELECT USING (true);
CREATE POLICY "Public Insert Access for Syndicates" ON syndicates FOR INSERT WITH CHECK (true);

-- 4. Create Syndicate Members Table
CREATE TABLE syndicate_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  syndicate_id UUID REFERENCES syndicates(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  total_damage BIGINT DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(syndicate_id, player_name)
);

ALTER TABLE syndicate_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access for Syndicate Members" ON syndicate_members FOR SELECT USING (true);
CREATE POLICY "Public Insert Access for Syndicate Members" ON syndicate_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access for Syndicate Members" ON syndicate_members FOR UPDATE USING (true);

-- 5. Create Syndicate Boss Table
CREATE TABLE syndicate_boss (
  syndicate_id UUID PRIMARY KEY REFERENCES syndicates(id) ON DELETE CASCADE,
  hp BIGINT NOT NULL,
  max_hp BIGINT NOT NULL,
  status TEXT DEFAULT 'alive'
);

ALTER TABLE syndicate_boss ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access for Syndicate Boss" ON syndicate_boss FOR SELECT USING (true);
CREATE POLICY "Public Insert Access for Syndicate Boss" ON syndicate_boss FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access for Syndicate Boss" ON syndicate_boss FOR UPDATE USING (true);
