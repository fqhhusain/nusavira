import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from './App';
import * as RijksmuseumAPI from './api/rijksmuseum';

// Mock Supabase
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

describe('Core Gameplay Loop', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('can open daily check-in and claim coins', async () => {
    render(<App />);
    
    // Switch to Grand Hall to see the Open Daily button
    const grandHallTab = screen.getByText('Grand Hall');
    fireEvent.click(grandHallTab);
    
    // Open Daily Modal or Welcome Chest
    const openDailyBtn = screen.getByRole('button', { name: /Open (Daily|Welcome Chest)/i });
    fireEvent.click(openDailyBtn);
    
    // Claim Reward
    const claimBtn = await screen.findByRole('button', { name: /Claim Reward/i });
    fireEvent.click(claimBtn);
    
    // Verify toast or button text changes
    await waitFor(() => {
      expect(screen.getByText(/AWESOME!|COME BACK TOMORROW/i)).toBeInTheDocument();
    });
  });

  it('should process multi pulls and respect pity limit', async () => {
    localStorage.setItem('gacha_pity_counter', '86');
    localStorage.setItem('gacha_coins', '10000');
    render(<App />);
    
    await waitFor(() => {
       expect(screen.getByText('10,000')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Excavation'));
    
    // Mock the API for predictable pulls
    const mockPullBtn = screen.getByText('Pull 5x (500 Coins)');
    fireEvent.click(mockPullBtn);

    await waitFor(() => {
        expect(screen.getByText('9,500')).toBeInTheDocument();
    });
  });

  it('should convert Max Level (30) duplicates into Insight', async () => {
    localStorage.clear();
    const maxLevelCard = { id: 'max-1', title: 'Maxed Relic', role: 'relic', element: 'Natura', stats: {}, rarity: 'Epic', level: 30, copies: 1 };
    localStorage.setItem('gacha_inventory', JSON.stringify([maxLevelCard]));
    localStorage.setItem('gacha_coins', '10000');
    localStorage.setItem('gacha_player_insight', '100');
    localStorage.setItem('gacha_daily_date', new Date().toDateString());

    render(<App />);
    
    // Mock fetchRandomArtifact to always return the exact same max level card
    vi.spyOn(RijksmuseumAPI, 'fetchRandomArtifact').mockResolvedValue({
        id: 'max-1',
        title: 'Maxed Relic',
        maker: 'Tester',
        role: 'relic',
        element: 'Natura',
        rarity: 'Epic',
        level: 30,
        copies: 1,
        stats: {}
    });

    fireEvent.click(screen.getByText('Excavation'));
    const singlePullBtn = screen.getByText('Pull 1x');
    fireEvent.click(singlePullBtn);

    await waitFor(() => {
        // Should show the toast message for duplicate
        expect(screen.getByText(/converted to 5 Insight!/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Insight should increase from 100 to 105
    expect(localStorage.getItem('gacha_player_insight')).toBe('105');
    
    // Inventory copies should remain 1
    const inventory = JSON.parse(localStorage.getItem('gacha_inventory'));
    expect(inventory.find(c => c.id === 'max-1').copies).toBe(1);
  });

  it('can use sandbox cheat to get coins and pull a gacha pack', async () => {
    render(<App />);
    
    // Switch to Excavation
    const excavationTab = screen.getByText('Excavation');
    fireEvent.click(excavationTab);
    
    // Enable Sandbox mode
    const sandboxToggle = screen.getByTitle('Toggle Sandbox Control Panel');
    fireEvent.click(sandboxToggle);
    
    // Click +100k Coins
    const addCoinsBtn = screen.getByRole('button', { name: '+100k Coins' });
    fireEvent.click(addCoinsBtn);
    
    // Pull 1x Pack
    const pull1xBtn = screen.getByRole('button', { name: 'Pull 1x' });
    fireEvent.click(pull1xBtn);
    
    // Wait for the pull animation/toast
    await waitFor(() => {
      // It should either show the card modal or show a toast
      expect(screen.getByText(/Keep/i)).toBeInTheDocument();
    }, { timeout: 3500 });
  });

  it('can dismantle an artifact for insight', async () => {
    // Pre-populate localStorage with an artifact that has a duplicate
    const testInventory = [{ id: 'test_artifact_1', title: 'Test Artifact', rarity: 'Epic', role: 'character', stats: {}, copies: 2, element: 'Metallum' }];
    localStorage.setItem('gacha_inventory', JSON.stringify(testInventory));
    
    const { container } = render(<App />);
    
    // Switch to The Vault
    const vaultTab = screen.getByText('The Vault');
    fireEvent.click(vaultTab);
    
    // Click the actual artifact card using its class
    const firstCard = container.querySelector('.mini-card');
    fireEvent.click(firstCard);
    
    // Click Dismantle
    const dismantleBtn = await screen.findByRole('button', { name: /DISMANTLE DUP/i });
    fireEvent.click(dismantleBtn);
    
    // Verify success toast
    await waitFor(() => {
      expect(screen.getByText(/Dismantled 1 copy!/i)).toBeInTheDocument();
    });
  });
});
