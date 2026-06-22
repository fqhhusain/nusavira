import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from './App';

// Mock Supabase to prevent network calls
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

// Mock AudioContext to prevent errors in JSDOM
window.AudioContext = vi.fn().mockImplementation(() => ({
  createOscillator: vi.fn(() => ({
    type: 'sine',
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
  })),
  destination: {},
  currentTime: 0,
  resume: vi.fn(),
}));

describe('Arena Combat System', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // Removed fake timers teardown

  const setupValidDeck = () => {
    const mockInventory = [
      { id: 'char1', title: 'Test Character', rarity: 'Legendary', role: 'character', stats: { 'Cultural Impact': 100 }, element: 'Natura' },
      { id: 'wep1', title: 'Test Sword', rarity: 'Legendary', role: 'weapon', stats: { Lethality: 500 }, element: 'Metallum' },
    ];
    
    // Equip the deck
    const mockDeck = {
      character: ['char1'],
      weapon: ['wep1'],
      armor: [],
      accessory: [],
      arena: []
    };

    localStorage.setItem('gacha_inventory', JSON.stringify(mockInventory));
    localStorage.setItem('gacha_deck', JSON.stringify(mockDeck));
    localStorage.setItem('gacha_unlockedSkills', JSON.stringify([]));
  };

  it('prevents entering the arena without a character card', async () => {
    render(<App />);
    const arenaTab = screen.getByText('ENTER ARENA');
    fireEvent.click(arenaTab);
    
    // Toast should appear
    await waitFor(() => {
      expect(screen.getByText('You must equip a Character card first!')).toBeInTheDocument();
    });
  });

  it('can initialize combat, perform an attack, and process enemy turn', async () => {
    setupValidDeck();
    render(<App />);
    
    // Close daily check-in if it pops up
    await waitFor(() => {
      const comeBackBtn = screen.queryByRole('button', { name: /COME BACK TOMORROW|Claim Reward/i });
      if (comeBackBtn) fireEvent.click(comeBackBtn);
    }, { timeout: 1500 }).catch(() => {}); // ignore if it doesn't appear
    
    // Enter Arena
    const arenaTab = screen.getByText('ENTER ARENA');
    fireEvent.click(arenaTab);
    
    // Wait for async fetchRandomArtifact promises to resolve in startBattle
    await waitFor(() => {
      expect(screen.getByText(/challenges you!/i)).toBeInTheDocument();
    });

    // Check if player HP is displayed (1000 base + bonus)
    expect(screen.getByText(/You:/i)).toBeInTheDocument();

    // Verify weapon card is available in hand
    const weaponCard = screen.getByText('Test Sword').closest('.mini-card');
    expect(weaponCard).toBeInTheDocument();

    // --- PLAYER TURN ---
    // Attack the enemy!
    fireEvent.click(weaponCard);
    
    // The combat log should update with the attack damage
    await waitFor(() => {
      expect(screen.getByText(/You attack with Test Sword for/i)).toBeInTheDocument();
    });
    
    // --- ENEMY TURN ---
    // Enemy should execute an action after 1.5s
    await waitFor(() => {
      expect(screen.getByText(/damage with|DODGED|defends using/i)).toBeInTheDocument();
    }, { timeout: 4000 });

    // Player should be able to click cards again after another 1.5s
    await waitFor(() => {
      expect(screen.queryByText(/Enemy Turn/i)).not.toBeInTheDocument();
    }, { timeout: 4000 });
  }, 10000);

  it('triggers victory screen when enemy is defeated', async () => {
    setupValidDeck();
    
    // Overpower the weapon to one-shot the boss
    const OPInventory = [
      { id: 'char1', title: 'Test Character', rarity: 'Legendary', role: 'character', stats: { 'Cultural Impact': 100 }, element: 'Natura' },
      { id: 'wep1', title: 'One Punch Sword', rarity: 'Legendary', role: 'weapon', stats: { Lethality: 999999 }, element: 'Metallum' },
    ];
    localStorage.setItem('gacha_inventory', JSON.stringify(OPInventory));
    
    render(<App />);
    
    // Fast forward to clear daily modal (now using real timers, wait for it or click if present)
    await waitFor(() => {
      const comeBackBtn = screen.queryByRole('button', { name: /COME BACK TOMORROW|Claim Reward/i });
      if (comeBackBtn) fireEvent.click(comeBackBtn);
    }, { timeout: 1500 }).catch(() => {}); // ignore if it doesn't appear

    // Enter Arena
    const arenaTab = screen.getByText('ENTER ARENA');
    fireEvent.click(arenaTab);
    
    await waitFor(() => {
      expect(screen.getByText(/challenges you!/i)).toBeInTheDocument();
    });

    // Attack to one-shot the boss
    const weaponCard = screen.getByText('One Punch Sword').closest('.mini-card');
    fireEvent.click(weaponCard);

    // Victory modal should appear after animations!
    await waitFor(() => {
      expect(screen.getByAltText('Victory')).toBeInTheDocument();
    }, { timeout: 4000 });
  }, 10000);
});
