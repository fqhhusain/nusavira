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

describe('Deck Builder & Inventory Management', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const setupMockInventory = () => {
    const mockInventory = [
      { id: 'char1', title: 'Test Character', rarity: 'Legendary', role: 'character', stats: { HP: 1000, ATK: 50 }, element: 'Physical' },
      { id: 'char2', title: 'Second Character', rarity: 'Epic', role: 'character', stats: { HP: 800, ATK: 40 }, element: 'Magic' },
      { id: 'wep1', title: 'Sword of Truth', rarity: 'Legendary', role: 'weapon', stats: { Lethality: 50 }, element: 'Metallum' },
    ];
    localStorage.setItem('gacha_inventory', JSON.stringify(mockInventory));
    localStorage.setItem('gacha_player_exp', '0');
  };

  it('can equip a character and enforce the role limit', async () => {
    setupMockInventory();
    render(<App />);

    // Fast forward to clear daily modal
    await waitFor(() => {
      const comeBackBtn = screen.queryByRole('button', { name: /COME BACK TOMORROW|Claim Reward/i });
      if (comeBackBtn) fireEvent.click(comeBackBtn);
    }, { timeout: 1500 }).catch(() => {});

    // Navigate to The Vault
    const vaultTab = screen.getByText('The Vault');
    fireEvent.click(vaultTab);

    await waitFor(() => {
      expect(screen.getByText('Test Character')).toBeInTheDocument();
      expect(screen.getByText('Second Character')).toBeInTheDocument();
    });

    // Equip first character
    const char1 = screen.getByText('Test Character').closest('.mini-card');
    fireEvent.click(char1);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /EQUIP TO DECK/i })).toBeInTheDocument();
    });
    const equipBtn = screen.getByRole('button', { name: /EQUIP TO DECK/i });
    fireEvent.click(equipBtn);

    // Verify it is equipped (shows "EQUIPPED" badge)
    await waitFor(() => {
      expect(screen.getByText('EQUIPPED')).toBeInTheDocument();
    });

    // Try to equip second character
    const char2 = screen.getByText('Second Character').closest('.mini-card');
    fireEvent.click(char2);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /EQUIP TO DECK/i })).toBeInTheDocument();
    });
    const equipBtn2 = screen.getByRole('button', { name: /EQUIP TO DECK/i });
    fireEvent.click(equipBtn2);

    // Verify toast shows that slots are full
    await waitFor(() => {
      expect(screen.getByText(/slots are full!/i)).toBeInTheDocument();
    });
    
    // Verify only one EQUIPPED badge exists overall (for characters)
    // There are 'EQUIPPED' elements, but we expect exactly 1 for characters.
    // We can check local storage since deck state is saved there synchronously!
    const savedDeck = JSON.parse(localStorage.getItem('gacha_deck'));
    expect(savedDeck.character).toEqual(['char1']);
  });

  it('can unequip an item successfully', async () => {
    setupMockInventory();
    // Pre-equip char1
    localStorage.setItem('gacha_deck', JSON.stringify({
      character: ['char1'], weapon: [], armor: [], accessory: [], arena: [], relic: [], lobby: []
    }));
    
    render(<App />);

    await waitFor(() => {
      const comeBackBtn = screen.queryByRole('button', { name: /COME BACK TOMORROW|Claim Reward/i });
      if (comeBackBtn) fireEvent.click(comeBackBtn);
    }, { timeout: 1500 }).catch(() => {});

    const vaultTab = screen.getByText('The Vault');
    fireEvent.click(vaultTab);

    // Wait for inventory to render
    await waitFor(() => {
      expect(screen.getByText('Test Character')).toBeInTheDocument();
    });

    const char1 = screen.getByText('Test Character').closest('.mini-card');
    fireEvent.click(char1);

    // Click UNEQUIP
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /UNEQUIP/i })).toBeInTheDocument();
    });
    const unequipBtn = screen.getByRole('button', { name: /UNEQUIP/i });
    fireEvent.click(unequipBtn);

    // Wait for EQUIPPED badge to disappear
    await waitFor(() => {
      expect(screen.queryByText('EQUIPPED')).not.toBeInTheDocument();
    });

    // Verify localStorage
    const savedDeck = JSON.parse(localStorage.getItem('gacha_deck'));
    expect(savedDeck.character).toEqual([]);
  });
});
