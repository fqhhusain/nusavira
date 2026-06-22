import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from './App';

vi.mock('./api/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [] }),
    single: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
  }
}));

window.AudioContext = vi.fn().mockImplementation(() => ({
  createOscillator: vi.fn(() => ({ type: 'sine', connect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } })),
  createGain: vi.fn(() => ({ connect: vi.fn(), gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } })),
  destination: {},
  currentTime: 0,
  resume: vi.fn(),
}));

describe('Skill Tree System', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const setupMockData = (insight = 500) => {
    localStorage.setItem('gacha_player_insight', insight.toString());
    localStorage.setItem('gacha_player_exp', '0');
  };

  it('allows unlocking a skill if the user has enough insight and enforces tier limits', async () => {
    setupMockData(1500); // Plenty of insight to unlock Tier 1 and more
    render(<App />);

    // Fast forward to clear daily modal
    await waitFor(() => {
      const comeBackBtn = screen.queryByRole('button', { name: /COME BACK TOMORROW|Claim Reward/i });
      if (comeBackBtn) fireEvent.click(comeBackBtn);
    }, { timeout: 1500 }).catch(() => {});

    // Navigate to Grand Hall (Skill Tree)
    const grandHallTab = screen.getByText('Research');
    fireEvent.click(grandHallTab);

    await waitFor(() => {
      expect(screen.getByText('Curator Research Tree')).toBeInTheDocument();
    });

    // Verify player insight is displayed correctly
    expect(screen.getByText('1500')).toBeInTheDocument();

    // Check that Tier 1 skills are displayed. For example, "The Tycoon I"
    expect(screen.getByText('The Tycoon I')).toBeInTheDocument();
    expect(screen.getByText('The Scholar I')).toBeInTheDocument();

    // All unlock buttons in Tier 1 should be present
    const unlockButtons = screen.getAllByRole('button', { name: 'UNLOCK' });
    expect(unlockButtons.length).toBeGreaterThan(0);

    // Click UNLOCK on The Tycoon I
    const tycoonSkillContainer = screen.getByText('The Tycoon I').parentElement;
    const tycoonUnlockBtn = tycoonSkillContainer.querySelector('button');
    
    expect(tycoonUnlockBtn).not.toBeNull();
    fireEvent.click(tycoonUnlockBtn);

    // Verify it changes to UNLOCKED and insight is deducted (Cost is 500)
    await waitFor(() => {
      expect(screen.getByText('1400')).toBeInTheDocument(); // 1500 - 100 = 1400
      const updatedTycoonContainer = screen.getByText('The Tycoon I').parentElement;
      expect(updatedTycoonContainer.textContent).toContain('UNLOCKED');
    });

    // Verify the other skill in Tier 1 (The Scholar I) is now LOCKED
    const scholarContainer = screen.getByText('The Scholar I').parentElement;
    expect(scholarContainer.textContent).toContain('LOCKED');
    expect(scholarContainer.querySelector('button')).toBeNull(); // No unlock button anymore
    
    // Also verify that we saved the skill to localStorage
    const savedSkills = JSON.parse(localStorage.getItem('gacha_unlocked_skills'));
    expect(savedSkills).toContain('tycoon_1');
  });

  it('prevents unlocking a skill if insight is insufficient', async () => {
    setupMockData(50); // Not enough to unlock Tier 1 (Cost: 100)
    render(<App />);

    await waitFor(() => {
      const comeBackBtn = screen.queryByRole('button', { name: /COME BACK TOMORROW|Claim Reward/i });
      if (comeBackBtn) fireEvent.click(comeBackBtn);
    }, { timeout: 1500 }).catch(() => {});

    const grandHallTab = screen.getByText('Research');
    fireEvent.click(grandHallTab);

    await waitFor(() => {
      expect(screen.getByText('Curator Research Tree')).toBeInTheDocument();
    });

    // Try to unlock The Tycoon I
    const tycoonSkillContainer = screen.getByText('The Tycoon I').parentElement;
    const tycoonUnlockBtn = tycoonSkillContainer.querySelector('button');
    
    expect(tycoonUnlockBtn).toHaveClass('disabled');
    fireEvent.click(tycoonUnlockBtn);

    // Verify toast or failure (Insight shouldn't be deducted)
    await waitFor(() => {
      expect(screen.getByText(/Not enough Insight/i)).toBeInTheDocument();
    });
    
    expect(screen.getAllByText('50').length).toBeGreaterThan(0); // Insight remains 50
    
    const savedSkills = JSON.parse(localStorage.getItem('gacha_unlocked_skills') || '[]');
    expect(savedSkills).toHaveLength(0);
  });
});
