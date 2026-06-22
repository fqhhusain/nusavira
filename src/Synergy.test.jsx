import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Elemental Synergy Mechanics', () => {
  beforeEach(() => {
    localStorage.clear();
    
    // Setup a deck with 3 Metallum cards (Executioner Synergy)
    const mockInventory = [
      { id: '1', title: 'Metallum Sword', role: 'weapon', element: 'Metallum', stats: { Lethality: 100, 'Critical Edge': '100%' }, rarity: 'Legendary', level: 10, copies: 0 },
      { id: '2', title: 'Metallum Shield', role: 'armor', element: 'Metallum', stats: { 'Damage Mitigation': 50 }, rarity: 'Legendary', level: 10, copies: 0 },
      { id: '3', title: 'Metallum Ring', role: 'accessory', element: 'Metallum', stats: {}, rarity: 'Legendary', level: 10, copies: 0 },
      { id: '4', title: 'Hero', role: 'character', element: 'Aura', stats: { 'Cultural Impact': 500, 'Authenticity': 500 }, rarity: 'Legendary', level: 10, copies: 0 }
    ];
    
    const mockDeck = {
      character: ['4'],
      weapon: ['1'],
      armor: ['2'],
      accessory: ['3']
    };

    localStorage.setItem('gacha_inventory', JSON.stringify(mockInventory));
    localStorage.setItem('gacha_deck', JSON.stringify(mockDeck));
    localStorage.setItem('gacha_unlocked_skills', JSON.stringify([])); // No warlord_2
    localStorage.setItem('gacha_daily_date', new Date().toDateString());
  });

  it('Executioner Synergy applies 300% Crit Damage instead of 200%', async () => {
    render(<App />);
    // Enter Arena Battle
    const arenaBtn = screen.getByText(/ENTER ARENA/i);
    fireEvent.click(arenaBtn);

    await waitFor(() => {
        expect(screen.getByText(/challenges you!/)).toBeInTheDocument();
    });

    // Find Metallum Sword and attack
    const swordBtn = await screen.findByText(/Metallum Sword/i);
    fireEvent.click(swordBtn);

    // Should see EXECUTIONER log
    await waitFor(() => {
        expect(screen.getByText(/EXECUTIONER!/)).toBeInTheDocument();
    });

    // 100 Lethality * 3 (Executioner) = 300 damage
    await waitFor(() => {
        expect(screen.getAllByText('300').length).toBeGreaterThan(0);
    });
  });
});
