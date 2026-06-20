-- 1. Create a Profiles table to store Player Aliases permanently
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access for Profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Link Leaderboard to Auth Users
ALTER TABLE leaderboard ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Update Leaderboard Policies to enforce Authentication
DROP POLICY IF EXISTS "Public Insert Access for Leaderboard" ON leaderboard;
DROP POLICY IF EXISTS "Public Update Access for Leaderboard" ON leaderboard;

CREATE POLICY "Authenticated users can insert scores" ON leaderboard 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their scores" ON leaderboard 
  FOR UPDATE USING (auth.uid() = user_id);


-- 3. Link Syndicate Members to Auth Users
ALTER TABLE syndicate_members ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Update Syndicate Members Policies to enforce Authentication
DROP POLICY IF EXISTS "Public Insert Access for Syndicate Members" ON syndicate_members;

CREATE POLICY "Authenticated users can join syndicates" ON syndicate_members 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Optional: If you want to require authentication to CREATE a syndicate
ALTER TABLE syndicates ADD COLUMN creator_id UUID REFERENCES auth.users(id);
