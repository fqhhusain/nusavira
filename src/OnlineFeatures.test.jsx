import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from './App';

// Mock the Supabase Client so we don't make real network requests during tests
vi.mock('./api/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [{ display_name: 'test_champion', win_streak: 10 }] }),
    single: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
  }
}));

describe('App Online Features (Supabase)', () => {
  beforeEach(() => {
    // Reset local storage and mocks before each test to ensure a clean state
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('fetches leaderboard data and shows Auth Modal when trying to submit score logged out', async () => {
    render(<App />);
    
    // 1. Open Leaderboard
    const lbBtn = screen.getByText(/GLOBAL LEADERBOARD/i);
    fireEvent.click(lbBtn);
    
    expect(screen.getByText('GLOBAL ARENA CHAMPIONS')).toBeInTheDocument();
    
    // 2. Wait for the mocked leaderboard fetch to resolve and render
    await waitFor(() => {
       expect(screen.getByText('test_champion')).toBeInTheDocument();
    });
    
    // 3. Click submit score (which requires login)
    const submitBtn = screen.getByText(/Submit Score:/i);
    fireEvent.click(submitBtn);
    
    // 4. The Auth Modal should block the action and appear
    expect(await screen.findByText(/Login or Register/i)).toBeInTheDocument();
  });

  it('shows Auth Modal when attempting to access Syndicate Raid while logged out', async () => {
    render(<App />);
    
    // 1. Try to open the Syndicate menu
    const raidBtn = screen.getByText(/SYNDICATE RAID/i);
    fireEvent.click(raidBtn);
    
    // 2. The Auth Modal should intercept the navigation
    expect(await screen.findByText(/Login or Register/i)).toBeInTheDocument();
  });
});
