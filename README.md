# Nusavira: Clash of Artifacts

> *Kumpulkan artefak legendaris Nusantara, susun taktikmu, dan selamatkan lini masa dalam RPG Gacha retro 16-bit!*

**Play Live:** [https://nusavira.vercel.app/](https://nusavira.vercel.app/)

**Nusavira** is a web-based, 16-bit retro Gacha RPG built with React (Vite) and Supabase. Players take on the role of a Curator, excavating legendary artifacts from Indonesian history and mythology, assembling decks, and battling corrupted historical archetypes in a turn-based combat system.

**Genre:** 16-bit Retro Gacha RPG, Turn-Based Strategy, Historical Fantasy, Rogue-lite Elements

## Features

* **Excavation (Gacha System):** Pull from banners using in-game currencies (Coins and Gems) to unlock beautifully crafted pixel-art characters (e.g., Gajah Mada, Ken Dedes) and artifacts (e.g., Keris, Batik).
* **The Grand Hall (Deck Builder):** Manage your inventory, equip one Character, up to two Weapons, and one Armor to build your ultimate combat deck.
* **Turn-Based Arena Combat:** Battle through a dynamic combat engine featuring critical hits, dodging, elemental synergies (Physical, Mystical, Thermal, Ethereal), and armor mitigation.
* **Story Campaign:** Progress through stages accompanied by visual novel-style dialogues featuring characters like Aria (The Guide), Mad Archivist, and Nyai Vex.
* **Global Leaderboards:** Submit your Arena Win Streak to a global leaderboard powered by Supabase.
* **The Black Market (Syndicates & Raids):** Form or join a Syndicate (Clan) and collaborate with other players to defeat massive Raid Bosses like Overlord Ravana.
* **Research (Skill Tree):** Spend Skill Points to unlock permanent passive upgrades for your account.
* **Guest-First Architecture:** Play immediately! Core gameplay data (inventory, coins, levels) is stored locally. An account is only required to participate in online features like Leaderboards and Syndicates.
* **Progressive Web App (PWA):** Nusavira can be installed directly to your device for a native-like full-screen experience.
* **Resilient Anti-Crash System:** A custom retro-themed Error Boundary ensures that even if a critical failure occurs, the game will gracefully catch it without losing your save data.

## Tech Stack

* **Frontend:** React + Vite
* **State Management:** Zustand (for highly responsive game state) + Local Storage
* **Styling:** Custom CSS (16-bit retro aesthetics, CSS animations, glassmorphism)
* **Backend as a Service:** Supabase (PostgreSQL, Authentication, Row Level Security)
* **Deployment:** Local development via `npm run dev`, optimized for production via `npm run build`

## Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd nusavira
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Supabase Setup:**
   * Create a new project on [Supabase](https://supabase.com/).
   * Run the SQL queries found in `supabase_setup.sql`, `supabase_syndicate.sql`, and `auth_migrations.sql` in your Supabase SQL Editor to create the required tables and RLS policies.
   * Obtain your `Project URL` and `anon key` from the Supabase API Settings.

4. **Environment Variables:**
   Copy `.env.example` to `.env.local` in the root directory and fill in your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local`:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5174` in your browser to play!

## Roadmap / TODO

- [ ] Publish the game on itch.io as an HTML5 web game.

## Database Schema (Supabase)

* **`profiles`**: Stores player aliases linked to their Authentication User ID.
* **`leaderboard`**: Tracks the highest Win Streaks for Global Arena Champions.
* **`syndicates`**: Stores clan data and unique Join Codes.
* **`syndicate_members`**: Tracks clan members and their total raid damage contributions.
* **`syndicate_boss`**: Tracks the persistent HP of the current Syndicate Raid Boss.

## Art & Design
All pixel-art assets, character portraits, and UI elements were generated to capture a nostalgic 90s JRPG vibe combined with authentic Indonesian cultural elements.

---
*Created with passion. Protect the history, build your legacy.*

**Support the Creator:** [Saweria](https://saweria.co/dailycisea)
