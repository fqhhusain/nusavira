// Switching to The Metropolitan Museum of Art API which requires NO API KEY and is 100% free!

let cachedIndonesianIds = null;

// Categories based on object types to map to your RPG mechanics
const TYPE_MAPPING = {
  weapon: ['weapon', 'sword', 'keris', 'kris', 'shield', 'cannon', 'dagger', 'spear', 'blade', 'axe', 'arm', 'knife', 'whip', 'bow', 'arrow', 'club', 'mace'],
  armor: ['textile', 'clothing', 'batik', 'garment', 'shield', 'cloth', 'silk', 'fabric', 'helmet', 'mail'],
  character: ['sculpture', 'carving', 'wayang', 'figure', 'statue', 'deity', 'puppet', 'figurine', 'mask', 'buddha'],
  arena: ['painting', 'drawing', 'print', 'panel', 'scroll', 'mural'],
  event: ['photograph', 'document', 'manuscript', 'folio', 'codex'],
  accessory: ['jewelry', 'ornament', 'ring', 'crown', 'bracelet', 'necklace', 'earring', 'metalwork', 'pendant'],
  relic: ['furniture', 'chest', 'chair', 'basket', 'vessel', 'bowl', 'dish', 'iron', 'bronze', 'copper', 'wood', 'stone', 'ceramic']
};

/**
 * Determines the RPG role of an artifact based on its object name and classification
 */
export const determineRole = (objectName, classification) => {
  const combinedStr = `${objectName || ''} ${classification || ''}`.toLowerCase();
  
  for (const [role, keywords] of Object.entries(TYPE_MAPPING)) {
    if (keywords.some(k => combinedStr.includes(k))) return role;
  }
  return 'relic'; // Default fallback so random misc items don't become characters
};

/**
 * Determines the RPG Element (Damage Type) based on materials
 */
export const determineElement = (medium, classification, title) => {
  const combinedStr = `${medium || ''} ${classification || ''} ${title || ''}`.toLowerCase();
  
  if (['gold', 'silver', 'diamond', 'wayang', 'mask', 'deity'].some(k => combinedStr.includes(k))) {
    return 'Aura'; // ✨
  }
  if (['bronze', 'copper', 'brass', 'iron', 'steel', 'metal'].some(k => combinedStr.includes(k))) {
    return 'Metallum'; // ⚔️
  }
  // Default to Natura for wood, stone, horn, cotton, terracotta, etc.
  return 'Natura'; // 🌿
};

/**
 * Calculates level based on permanent rarity
 */
export const calculateLevel = (rarity) => {
  if (rarity === 'Legendary') return 20;
  if (rarity === 'Epic') return 10;
  if (rarity === 'Rare') return 5;
  return 1;
};

/**
 * Generates polymorphic game stats based on category role and rarity/level
 */
export const generateStats = (role, rarity, level) => {
  const multipliers = {
    'Common': 1,
    'Rare': 1.5,
    'Epic': 2.5,
    'Legendary': 4
  };
  
  const mult = (multipliers[rarity] || 1) * (1 + (level * 0.1));
  const condition = Math.floor((Math.random() * 50 + 50) * mult);
  
  const stats = { Condition: condition };

  switch (role) {
    case 'character':
      stats['Cultural Impact'] = Math.floor(20 * mult * (Math.random() * 0.5 + 0.8));
      stats['Authenticity'] = Math.floor(15 * mult * (Math.random() * 0.5 + 0.8));
      stats['Provenance'] = Math.floor(30 * mult * (Math.random() * 0.5 + 0.8));
      break;
    case 'weapon':
      stats['Lethality'] = Math.floor(25 * mult * (Math.random() * 0.5 + 0.8));
      stats['Weight'] = Math.floor(10 * mult);
      stats['Critical Edge'] = Math.floor(Math.min(100, 5 * mult)) + '%';
      break;
    case 'armor':
      stats['Damage Mitigation'] = Math.floor(20 * mult * (Math.random() * 0.5 + 0.8));
      stats['Material Resilience'] = Math.floor(Math.min(100, 10 * mult)) + '%';
      break;
    case 'accessory':
      stats['Aura Power'] = Math.floor(Math.min(100, 5 * mult)) + '%';
      stats['Luck'] = Math.floor(Math.min(100, 8 * mult)) + '%';
      break;
    case 'arena':
      stats['Field Bias'] = `+${Math.floor(15 * mult)}% ATK`;
      stats['Atmosphere'] = `-${Math.floor(10 * mult)}% Enemy SPD`;
      break;
    case 'relic':
    default:
      stats['Coin Yield'] = `+${Math.floor(5 * mult)}/hr`;
      break;
  }
  
  return stats;
};

import artifactsData from '../data/artifacts.json';

/**
 * Fetch a random artifact from our pristine local database!
 */
export const fetchRandomArtifact = async (preferredRole = null, forcedRarity = null) => {
  try {
    let pool = artifactsData;

    let targetRarity = forcedRarity;
    
    // 1. Roll for Decoupled Rarity if no Cheat/Pity is active
    if (!targetRarity) {
       const roll = Math.random() * 100;
       if (roll <= 1.5) targetRarity = 'Legendary';
       else if (roll <= 6.5) targetRarity = 'Epic'; // 1.5 + 5.0 = 6.5
       else if (roll <= 36.5) targetRarity = 'Rare'; // 6.5 + 30.0 = 36.5
       else targetRarity = 'Common';
    }

    // 2. Filter Pool by Rolled Rarity and Preferred Role
    const filteredPool = pool.filter(data => {
      const role = determineRole(data.classification || data.title, data.classification);
      const matchesRole = preferredRole ? role === preferredRole : true;
      const matchesRarity = data.rarity === targetRarity;
      return matchesRole && matchesRarity;
    });
    
    if (filteredPool.length > 0) {
      pool = filteredPool;
    } else {
      console.warn(`No artifacts found matching criteria (Role: ${preferredRole}, Rarity: ${targetRarity}). Falling back to full pool.`);
    }

    // 3. Select a random artifact from the finalized sub-pool
    const data = pool[Math.floor(Math.random() * pool.length)];
    
    // Parse into our Game Card format
    const role = determineRole(data.title, data.classification);
    const element = determineElement(data.medium, data.classification, data.title);
    const rarity = data.rarity || 'Common'; // Read baked permanent rarity
    const level = calculateLevel(rarity);
    const stats = generateStats(role, rarity, level);
    
    return {
      id: data.id.toString(),
      title: data.title || "Unknown Artifact",
      maker: data.maker || data.culture || "Indonesia",
      imageUrl: data.imageUrl || `/fallback-${role}.png`,
      description: `Medium: ${data.medium || "Unknown"}. Date: ${data.year || "Unknown"}. Department: ${data.department || "Unknown"}.`,
      year: data.year || "Unknown",
      type: data.classification || "artifact",
      role: role,
      element: element,
      rarity: rarity,
      level: level,
      copies: 0,
      stats: stats
    };
  } catch (error) {
    console.error("Error fetching from local database:", error);
    throw new Error("Failed to fetch local artifact");
  }
};

/**
 * Fetch a specific Campaign Boss directly from the MET API
 */
export const fetchCampaignBoss = async (stageIndex) => {
  const BOSS_CONFIG = [
    {
      name: "The Clay Golem",
      query: "golem",
      departmentId: 3, // Ancient Near Eastern Art
      element: "Thermal",
      hp: 500,
      attack: 30,
      difficulty: 1.5,
      role: "arena",
      lore: "This golem throws searing earth to blind you and weaken your attacks! Use Natura to heal through the damage, or Aura to stun it!"
    },
    {
      name: "The Bronze Knight",
      query: "armor",
      departmentId: 4, // Arms and Armor
      element: "Metallum",
      hp: 1200,
      attack: 80,
      difficulty: 2.0,
      role: "arena",
      lore: "A possessed armor that hits with devastating critical strikes! Ethereal cards can help you dodge its heavy blows!"
    },
    {
      name: "The Pharaoh's Shadow",
      query: "pharaoh",
      departmentId: 10, // Egyptian Art
      element: "Ethereal",
      hp: 3500,
      attack: 150,
      difficulty: 2.5,
      role: "arena",
      lore: "An ancient curse from the Egyptian wing. It dodges attacks frequently! Rely on Aura to stun it so it can't escape!"
    },
    {
      name: "The Jade Dragon",
      query: "jade dragon",
      departmentId: 6, // Asian Art
      element: "Natura",
      hp: 8000,
      attack: 300,
      difficulty: 3.0,
      role: "arena",
      lore: "A spiritual beast that drains your life to heal itself! Use Metallum to burst it down with critical strikes before it recovers!"
    },
    {
      name: "The Primeval Curator",
      query: "statue",
      departmentId: 13, // Greek and Roman Art
      element: "Aura",
      hp: 18000,
      attack: 600,
      difficulty: 4.0,
      role: "arena",
      lore: "The embodiment of all lost history. It will constantly try to stun you! Bring your best cards and hope to survive!"
    }
  ];

  const config = BOSS_CONFIG[stageIndex] || BOSS_CONFIG[0];

  try {
    const searchUrl = `https://collectionapi.metmuseum.org/public/collection/v1/search?departmentId=${config.departmentId}&hasImages=true&q=${config.query}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.objectIDs || searchData.objectIDs.length === 0) {
      throw new Error("No artifacts found for boss query.");
    }

    const objectId = searchData.objectIDs[0];
    const objectRes = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectId}`);
    const data = await objectRes.json();

    return {
      id: `boss-${stageIndex}`,
      title: config.name,
      realTitle: data.title,
      maker: data.culture || "Unknown Civilization",
      imageUrl: data.primaryImage || data.primaryImageSmall || "/fallback-arena.png",
      description: config.lore,
      element: config.element,
      role: "character", // The boss acts as a character
      hp: config.hp,
      maxHp: config.hp,
      attack: config.attack,
      difficultyMultiplier: config.difficulty
    };

  } catch (error) {
    console.error("Error fetching campaign boss:", error);
    // Fallback if API fails
    return {
      id: `boss-${stageIndex}`,
      title: config.name,
      realTitle: "System Error Entity",
      maker: "The Void",
      imageUrl: "/fallback-arena.png",
      description: config.lore,
      element: config.element,
      role: "character",
      hp: config.hp,
      maxHp: config.hp,
      attack: config.attack,
      difficultyMultiplier: config.difficulty
    };
  }
};
