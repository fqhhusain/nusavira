import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from './App';
import * as RijksmuseumAPI from './api/rijksmuseum';

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

describe('Syndicate Theft System', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
    vi.spyOn(RijksmuseumAPI, 'fetchCampaignBoss').mockResolvedValue({
      id: 'boss-1',
      title: 'The Overpowered Boss',
      description: 'A mock boss designed to one-shot the player.',
      maxHp: 500,
      attack: 999999,
      difficultyMultiplier: 1,
      deck: [
        { id: 'b_wep', title: 'Doom Sword', role: 'weapon', element: 'Physical', stats: { Lethality: 999999, 'Critical Edge': 0 } }
      ]
    });
    vi.spyOn(RijksmuseumAPI, 'fetchRandomArtifact').mockResolvedValue({
      id: 'random-1',
      title: 'Random Stolen Artifact',
      role: 'relic',
      rarity: 'Common',
      stats: {},
      element: 'Aura',
      imageUrl: '/fallback-relic.png'
    });
  });

  const setupDeckWithTarget = () => {
    const mockInventory = [
      { id: 'char1', title: 'Test Character', rarity: 'Legendary', role: 'character', stats: { 'Cultural Impact': 100 }, element: 'Natura' },
      { id: 'wep1', title: 'Test Sword', rarity: 'Legendary', role: 'weapon', stats: { Lethality: 50 }, element: 'Metallum' },
      { id: 'target_artifact', title: 'Priceless Vase', rarity: 'Epic', role: 'relic', stats: {}, element: 'Aura' },
      { id: 'spare_card', title: 'Spare Junk', rarity: 'Common', role: 'relic', stats: {}, element: 'Physical' }
    ];
    
    // Equip the deck (Leave target_artifact UNEQUIPPED so it can be stolen)
    const mockDeck = { activeCharacter: null, character: ['char1'], weapon: ['wep1'], armor: [], accessory: [], relic: [], arena: [] };

    localStorage.setItem('gacha_inventory', JSON.stringify(mockInventory));
    localStorage.setItem('gacha_deck', JSON.stringify(mockDeck));
    localStorage.setItem('gacha_unlockedSkills', JSON.stringify([]));
    localStorage.setItem('gacha_player_exp', '-99999'); // Prevent LEVEL UP! modal from triggering
    localStorage.setItem('gacha_player_hp', '1'); // Force player HP to 1 so the enemy one-shots them
  };

  it('steals an unequipped artifact upon defeat in Campaign', async () => {
    setupDeckWithTarget();
    render(<App />);

    // Fast forward to clear daily modal
    await waitFor(() => {
      const comeBackBtn = screen.queryByRole('button', { name: /COME BACK TOMORROW|Claim Reward/i });
      if (comeBackBtn) fireEvent.click(comeBackBtn);
    }, { timeout: 1500 }).catch(() => {});

    // Enter Story Mode
    const storyTab = screen.getByText('STORY');
    fireEvent.click(storyTab);

    await waitFor(() => {
      expect(screen.getByText(/Stage 1/i)).toBeInTheDocument();
    });

    // Click Stage 1 Node
    const stageNode = screen.getByText(/Stage 1/i);
    fireEvent.click(stageNode);

    // Click Battle Start
    const battleStartBtn = screen.getByText('BATTLE START!');
    fireEvent.click(battleStartBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/emerges from the/i)).toBeInTheDocument();
    });

    // Let player attack (triggering enemy turn)
    const weaponCard = screen.getByText('Test Sword').closest('.mini-card');
    fireEvent.click(weaponCard);

    // Wait for the defeat screen
    const defeatMessage = await screen.findByText(/You have been defeated!/i, {}, { timeout: 4000 });
    console.log("DEFEAT MODAL TEXT:", defeatMessage.textContent);
    
    expect(defeatMessage.textContent).toMatch(/The Syndicate stole your/i);
  }, 10000);

  it('restricts equipping stolen artifacts in The Vault', async () => {
    setupDeckWithTarget();
    
    // Pre-steal the artifact
    const stolenData = [{ cardId: 'target_artifact', stageId: 0 }];
    localStorage.setItem('gacha_stolen_artifacts', JSON.stringify(stolenData));

    render(<App />);

    // Clear modal
    await waitFor(() => {
      const comeBackBtn = screen.queryByRole('button', { name: /COME BACK TOMORROW|Claim Reward/i });
      if (comeBackBtn) fireEvent.click(comeBackBtn);
    }, { timeout: 1500 }).catch(() => {});

    // Go to Vault
    const vaultTab = screen.getByText('The Vault');
    fireEvent.click(vaultTab);

    // Click the stolen artifact
    const stolenCard = screen.getByText('Priceless Vase').closest('.mini-card');
    fireEvent.click(stolenCard);

    // Assert that STOLEN BY SYNDICATE is displayed
    await waitFor(() => {
      expect(screen.getByText(/STOLEN BY/i)).toBeInTheDocument();
    });
    
    // Assert that EQUIP button is NOT present (because it's stolen)
    expect(screen.queryByRole('button', { name: /EQUIP TO DECK/i })).not.toBeInTheDocument();
  });

  it('reclaims stolen artifacts upon defeating the thief boss', async () => {
    setupDeckWithTarget();
    
    // Pre-steal the artifact for Stage 1
    const stolenData = [{ cardId: 'target_artifact', stageId: 0 }];
    localStorage.setItem('gacha_stolen_artifacts', JSON.stringify(stolenData));
    
    // Make the player overpower so they one-shot the boss
    const mockInventory = JSON.parse(localStorage.getItem('gacha_inventory'));
    mockInventory[1].stats.Lethality = 999999;
    localStorage.setItem('gacha_inventory', JSON.stringify(mockInventory));
    localStorage.setItem('gacha_player_hp', '1000'); // Restore HP

    render(<App />);

    await waitFor(() => {
      const comeBackBtn = screen.queryByRole('button', { name: /COME BACK TOMORROW|Claim Reward/i });
      if (comeBackBtn) fireEvent.click(comeBackBtn);
    }, { timeout: 1500 }).catch(() => {});

    // Enter Story Mode
    const storyTab = screen.getByText('STORY');
    fireEvent.click(storyTab);

    await waitFor(() => {
      expect(screen.getByText(/Stage 1/i)).toBeInTheDocument();
    });

    // Click Stage 1 Node
    const stageNode = screen.getByText(/Stage 1/i);
    fireEvent.click(stageNode);

    // Click Battle Start
    const battleStartBtn = screen.getByText('BATTLE START!');
    fireEvent.click(battleStartBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/emerges from the/i)).toBeInTheDocument();
    });

    // One-shot the boss
    const weaponCard = screen.getByText('Test Sword').closest('.mini-card');
    fireEvent.click(weaponCard);

    // Wait for victory modal and reclamation message
    await waitFor(() => {
      expect(screen.getByAltText('Victory')).toBeInTheDocument();
      // It should display the reclamation message in the combat log!
      expect(screen.getByText(/You reclaimed your stolen Priceless Vase/i)).toBeInTheDocument();
    }, { timeout: 4000 });
  }, 10000);
});
