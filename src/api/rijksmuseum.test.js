import { describe, it, expect, vi } from 'vitest';
import { determineRole, generateStats, calculateLevel, fetchCampaignBoss } from './rijksmuseum';

describe('API pure functions', () => {
  describe('determineRole', () => {
    it('should map sword to weapon', () => {
      expect(determineRole('sword', 'metalwork')).toBe('weapon');
    });

    it('should map batik to armor', () => {
      expect(determineRole('batik', 'textile')).toBe('armor');
    });

    it('should map buddha to character', () => {
      expect(determineRole('buddha', 'sculpture')).toBe('character');
    });

    it('should default to relic if no match', () => {
      expect(determineRole('random', 'unknown')).toBe('relic');
    });
  });

  describe('calculateLevel', () => {
    it('should respect forcedRarity', () => {
      const level = calculateLevel('Epic');
      expect(level).toBe(10);
    });
  });

  describe('generateStats', () => {
    it('should generate weapon stats correctly', () => {
      const stats = generateStats('weapon', 'Common', 1);
      expect(stats).toHaveProperty('Lethality');
      expect(stats).toHaveProperty('Critical Edge');
    });

    it('should scale stats based on level and rarity', () => {
      const stats = generateStats('character', 'Epic', 10);
      expect(stats).toHaveProperty('Cultural Impact');
      expect(stats).toHaveProperty('Authenticity');
      expect(stats['Cultural Impact']).toBeGreaterThan(20); 
    });
  });
});

describe('fetchCampaignBoss', () => {
  it('returns the correct fabricated stats and element for Stage 0 (The Clay Golem)', async () => {
    // Mock the global fetch
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ objectIDs: [12345] })
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ title: "Real MET Artifact Title", culture: "Ancient Near East", primaryImage: "image.png" })
      });

    const boss = await fetchCampaignBoss(0);

    expect(boss.id).toBe('boss-0');
    expect(boss.title).toBe('The Clay Golem');
    expect(boss.realTitle).toBe('Real MET Artifact Title');
    expect(boss.element).toBe('Thermal');
    expect(boss.hp).toBe(500);
    expect(boss.attack).toBe(30);
    expect(boss.role).toBe('character');
    expect(boss.imageUrl).toBe('image.png');
    expect(boss.difficultyMultiplier).toBe(1.5);
  });

  it('falls back gracefully when the API fails', async () => {
    // Mock the global fetch to throw an error
    global.fetch = vi.fn().mockRejectedValue(new Error("API Down"));

    const boss = await fetchCampaignBoss(1);

    expect(boss.id).toBe('boss-1');
    expect(boss.title).toBe('The Bronze Knight');
    expect(boss.realTitle).toBe('System Error Entity');
    expect(boss.element).toBe('Metallum');
    expect(boss.hp).toBe(1200);
    expect(boss.attack).toBe(80);
    expect(boss.role).toBe('character');
    expect(boss.imageUrl).toBe('/fallback-arena.png');
  });
});
