import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './api/supabaseClient';
import { playClick, playHit, playEpic, playLegendary, playBGM, stopBGM, toggleMute, getMuteStatus } from './utils/audio';
import { fetchRandomArtifact, fetchCampaignBoss } from './api/rijksmuseum';
import artifactsData from './data/artifacts.json';
import './index.css';

const activeProfile = localStorage.getItem('gacha_active_profile') || 'main';
const getKey = (base) => activeProfile === 'main' ? `gacha_${base}` : `gacha_sandbox_${base}`;

function App() {
  const [view, setView] = useState('grand_hall'); // excavation, grand_hall, vault, arena_combat
  const selectedCardRef = useRef(null);
  const [selectedVaultCard, setSelectedVaultCard] = useState(null);
  const [inventory, setInventory] = useState(() => JSON.parse(localStorage.getItem(getKey('inventory')) || '[]'));
  const [winStreak, setWinStreak] = useState(() => parseInt(localStorage.getItem(getKey('win_streak')) || '0'));
  const [summoningBoss, setSummoningBoss] = useState(false);
  const [coins, setCoins] = useState(() => parseInt(localStorage.getItem(getKey('coins')) || '1000'));
  const [playerLevel, setPlayerLevel] = useState(() => parseInt(localStorage.getItem(getKey('player_level')) || '1'));
  const [playerExp, setPlayerExp] = useState(() => parseInt(localStorage.getItem(getKey('player_exp')) || '0'));

  // Auth State
  const [session, setSession] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authIsLogin, setAuthIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [levelUpRewards, setLevelUpRewards] = useState(null); // { newLevel, coins, card }
  const [playerInsight, setPlayerInsight] = useState(() => parseInt(localStorage.getItem(getKey('player_insight')) || '0'));
  const [unlockedSkills, setUnlockedSkills] = useState(() => JSON.parse(localStorage.getItem(getKey('unlocked_skills')) || '[]'));
  const [stolenArtifacts, setStolenArtifacts] = useState(() => JSON.parse(localStorage.getItem(getKey('stolen_artifacts')) || '[]'));
  const [pityCounter, setPityCounter] = useState(() => parseInt(localStorage.getItem(getKey('pity_counter')) || '0'));
  const [discoveredArtifacts, setDiscoveredArtifacts] = useState(() => JSON.parse(localStorage.getItem(getKey('discovered_artifacts')) || '[]'));
  const PITY_LIMIT = 90;
  const PACK_COST = 100;

  // Supabase State
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardName, setLeaderboardName] = useState(localStorage.getItem('gacha_player_name') || '');
  const [syncCode, setSyncCode] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Syndicate State
  const [syndicateData, setSyndicateData] = useState(null);
  const [syndicateMembers, setSyndicateMembers] = useState([]);
  const [syndicateBoss, setSyndicateBoss] = useState(null);
  const [syndicateInputCode, setSyndicateInputCode] = useState('');
  const [syndicateNewName, setSyndicateNewName] = useState('');
  const [loadingSyndicate, setLoadingSyndicate] = useState(false);
  const [raidAttacksToday, setRaidAttacksToday] = useState(() => parseInt(localStorage.getItem('gacha_raid_attacks') || '0'));
  const [raidLastReset, setRaidLastReset] = useState(() => localStorage.getItem('gacha_raid_reset') || '');


  const ELEMENT_ICONS = {
    'Natura': <img src="/icons/Natura.png" alt="Natura" style={{ width: '20px', height: '20px', verticalAlign: 'middle', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' }} />,
    'Metallum': <img src="/icons/Metallum.png" alt="Metallum" style={{ width: '20px', height: '20px', verticalAlign: 'middle', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' }} />,
    'Aura': <img src="/icons/Aura.png" alt="Aura" style={{ width: '20px', height: '20px', verticalAlign: 'middle', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' }} />
  };

  const CoinIcon = <img src="/icons/coin.png" alt="Coins" style={{ width: '1em', height: '1em', verticalAlign: 'text-bottom', display: 'inline-block', margin: '0 2px' }} />;
  const GiftIcon = <img src="/icons/Hadiah_harian.png" alt="Gift" style={{ width: '1.2em', height: '1.2em', verticalAlign: 'text-bottom', display: 'inline-block' }} />;
  const StreakIcon = <img src="/icons/Win_Streak.png" alt="Streak" style={{ width: '1.2em', height: '1.2em', verticalAlign: 'text-bottom', display: 'inline-block' }} />;
  const SettingsIcon = <img src="/icons/Settings.png" alt="Settings" style={{ width: '1em', height: '1em', verticalAlign: 'text-bottom', display: 'inline-block' }} />;
  const InsightIcon = <img src="/icons/insight.png" alt="Insight" style={{ width: '1.2em', height: '1.2em', verticalAlign: 'text-bottom', display: 'inline-block', filter: 'drop-shadow(0 0 2px #d946ef)' }} />;
  const MapIcon = <img src="/icons/map.png" alt="Map" style={{ width: '1.2em', height: '1.2em', verticalAlign: 'text-bottom', display: 'inline-block' }} />;
  const BookIcon = <img src="/icons/book.png" alt="Book" style={{ width: '1.2em', height: '1.2em', verticalAlign: 'text-bottom', display: 'inline-block' }} />;
  const ProfileIcon = <img src="/icons/profile.png" alt="Profile" style={{ width: '1.5em', height: '1.5em', verticalAlign: 'middle', display: 'inline-block' }} />;
  const SandboxIcon = <img src="/icons/sandbox.png" alt="Sandbox" style={{ width: '1.2em', height: '1.2em', verticalAlign: 'text-bottom', display: 'inline-block' }} />;
  const NuclearIcon = <img src="/icons/nuclear_icon.png?v=2" alt="Nuclear" style={{ width: '1em', height: '1em', verticalAlign: 'text-bottom', display: 'inline-block', margin: '0 2px' }} />;
  const LockIcon = <img src="/icons/lock_icon.png?v=2" alt="Lock" style={{ width: '1em', height: '1em', verticalAlign: 'text-bottom', display: 'inline-block', margin: '0 2px' }} />;
  const TrophyIcon = <img src="/icons/trophy_icon.png?v=2" alt="Trophy" style={{ width: '1.2em', height: '1.2em', verticalAlign: 'text-bottom', display: 'inline-block', margin: '0 2px' }} />;
  const StarIcon = <img src="/icons/star_icon.png?v=2" alt="Star" style={{ width: '1em', height: '1em', verticalAlign: 'text-bottom', display: 'inline-block', margin: '0 2px' }} />;
  const CalendarIcon = <img src="/icons/calendar_icon.png?v=2" alt="Calendar" style={{ width: '1em', height: '1em', verticalAlign: 'text-bottom', display: 'inline-block', margin: '0 2px' }} />;

  const [pulling, setPulling] = useState(false);
  const [summonPhase, setSummonPhase] = useState(null);
  const [pulledCard, setPulledCard] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const [shakeScreen, setShakeScreen] = useState(false);
  const [criticalHitFlash, setCriticalHitFlash] = useState(false);
  const [activeSlash, setActiveSlash] = useState(null); // 'player' or 'enemy'
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);

  // Switch BGM based on current view
  // Add Supabase Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId, email) => {
    const { data } = await supabase.from('profiles').select('display_name').eq('id', userId).single();
    if (data) {
      setLeaderboardName(data.display_name);
      localStorage.setItem('gacha_player_name', data.display_name);
    } else if (email) {
      const newName = email.split('@')[0] + Math.floor(Math.random() * 100);
      const { error } = await supabase.from('profiles').insert({ id: userId, display_name: newName });
      if (!error) {
        setLeaderboardName(newName);
        localStorage.setItem('gacha_player_name', newName);
      }
    }
  };

  const handleAuth = async () => {
    if (!authEmail || !authPassword) return showToast("Enter email and password!");
    if (!authIsLogin && !leaderboardName) return showToast("Enter a Player Alias to register!");

    setAuthLoading(true);
    try {
      if (authIsLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
        showToast("Logged In Successfully!");
        setAuthModalOpen(false);
      } else {
        const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;
        if (data.user) {
          const { error: profileErr } = await supabase.from('profiles').insert({ id: data.user.id, display_name: leaderboardName });
          if (profileErr) {
            if (profileErr.message.includes('duplicate key') || profileErr.code === '23505') throw new Error("Alias already taken!");
            throw profileErr;
          }
        }

        if (!data.session) {
          showToast("Confirmation email sent! Please check your inbox.", "success");
        } else {
          showToast("Registered Successfully!", "success");
          setAuthModalOpen(false);
        }
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLeaderboardName('');
    localStorage.removeItem('gacha_player_name');
    showToast("Logged out");
  };


  const [preBattleLore, setPreBattleLore] = useState(null); // Holds the stage ID for the lore overlay
  const [isAutoBattle, setIsAutoBattle] = useState(false);
  const [showFleeModal, setShowFleeModal] = useState(false);
  const [battleResult, setBattleResult] = useState(null); // { status, stars, coins, message }

  const [toast, setToast] = useState(null);

  // Daily Login State
  const [loginStreak, setLoginStreak] = useState(() => parseInt(localStorage.getItem(getKey('streak')) || '1'));
  const [lastLoginDate, setLastLoginDate] = useState(() => localStorage.getItem(getKey('last_login')) || null);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [dailyRewardCard, setDailyRewardCard] = useState(null);

  // Deck State
  const DECK_LIMITS = {
    character: 1,
    arena: 1,
    weapon: 4,
    armor: 2,
    accessory: 2,
    relic: 1,
    lobby: 1
  };
  const [deck, setDeck] = useState(() => JSON.parse(localStorage.getItem(getKey('deck')) || '{"character": [], "weapon": [], "armor": [], "accessory": [], "arena": [], "relic": [], "lobby": []}'));

  // Achievement State
  const [achievements, setAchievements] = useState(() => JSON.parse(localStorage.getItem(getKey('achievements')) || '{"badges": []}'));
  const [totalStars, setTotalStars] = useState(() => parseInt(localStorage.getItem(getKey('stars')) || '0'));

  // Campaign & Guide State
  const [campaignProgress, setCampaignProgress] = useState(() => parseInt(localStorage.getItem(getKey('campaign_progress')) || '0'));
  const [showGuide, setShowGuide] = useState(false);
  const [guideDialogue, setGuideDialogue] = useState("Greetings, Curator! I am Aria, your guide to The Museum. What do you wish to know?");
  const [guideCategory, setGuideCategory] = useState(null);

  // Diminishing Returns Reset Logic
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA');
    if (raidLastReset !== today) {
      setRaidAttacksToday(0);
      setRaidLastReset(today);
      localStorage.setItem('gacha_raid_attacks', '0');
      localStorage.setItem('gacha_raid_reset', today);
    }
  }, [raidLastReset]);


  // Cheat Mode State
  const [cheatMode, setCheatMode] = useState(false);
  const [cheatRarity, setCheatRarity] = useState('Legendary');
  const [showCheatSandbox, setShowCheatSandbox] = useState(false);

  // Settings / Modal States
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  // Battle State
  const [battleState, setBattleState] = useState({
    active: false,
    playerHp: 0,
    playerMaxHp: 0,
    enemyHp: 0,
    enemyMaxHp: 0,
    turn: 'player',
    log: [],
    activeDefense: 0,
    enemyDeck: [],
    enemyCharacter: null,
    difficultyMultiplier: 1,
    activePlayerCard: null,
    activeEnemyCard: null,
    archetypeTitle: '',
    playerDodge: false,
    enemyDodge: false,
    playerAttackDebuff: false,
    enemyStunned: false,
    isCampaign: false,
    campaignStage: null,
    isRaid: false
  });

  useEffect(() => {
    if (!isAudioMuted) {
      if (view === 'arena_combat' || view === 'battle') {
        let speed = 1;
        if (battleState.active) {
          const playerLow = battleState.playerHp <= (battleState.playerMaxHp * 0.3);
          const enemyLow = battleState.enemyHp <= (battleState.enemyMaxHp * 0.3);
          if (playerLow || enemyLow) speed = 1.5;
        }
        playBGM(2, speed); // Track 2: Battle (Bleganjur)
      }
      else if (view === 'campaign_map' || view === 'campaign') playBGM(4); // Track 4: Story (Lingsir Wengi)
      else if (view === 'syndicate_intro' || view === 'syndicate_lobby') playBGM(5); // Track 5: Syndicate (Yamko Rambe)
      else playBGM(1); // Track 1: Lobby (Gundul Pacul)
    }
  }, [view, isAudioMuted, battleState.playerHp, battleState.enemyHp, battleState.active]);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const gainExp = (amount) => {
    setPlayerExp(prevExp => {
      let currentExp = prevExp + amount;
      let currentLevel = playerLevel;
      let leveledUp = false;
      let totalCoinsBonus = 0;
      let rewardedCard = null;

      while (currentExp >= currentLevel * 100) {
        currentExp -= currentLevel * 100;
        currentLevel += 1;
        leveledUp = true;
        totalCoinsBonus += currentLevel * 1000;
      }

      if (leveledUp) {
        setPlayerLevel(currentLevel);

        setPlayerInsight(prev => prev + 100);

        setCoins(c => c + totalCoinsBonus);
        const randomCard = artifactsData[Math.floor(Math.random() * artifactsData.length)];
        rewardedCard = { ...randomCard, id: Date.now().toString() + Math.random().toString(36).substr(2, 9), isNew: true };

        setInventory(prev => {
          const existingIndex = prev.findIndex(c => c.id === rewardedCard.id);
          if (existingIndex >= 0) {
            rewardedCard.isNew = false;
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], copies: (updated[existingIndex].copies || 0) + 1 };
            return updated;
          }
          return [...prev, rewardedCard];
        });

        setLevelUpRewards({
          newLevel: currentLevel,
          coins: totalCoinsBonus,
          card: rewardedCard
        });
      }

      return currentExp;
    });
  };

  const DAILY_COIN_REWARDS = {
    1: 100, 2: 150, 3: 200, 4: 250, 5: 300, 6: 400,
    7: 0, // Epic Artifact
    8: 400, 9: 450, 10: 500, 11: 550, 12: 600, 13: 700, 14: 800,
    15: 0 // Legendary Artifact
  };

  const CAMPAIGN_LORE = {
    0: {
      name: "The Mad Archivist",
      image: "/archivist.png",
      text: "You think a mere mortal can dismantle my clay guardian? The Golem of Prague has stood for centuries. Your brittle weapons will shatter against its ancient earthen shell!",
      winText: "Impossible! My masterpiece, reduced to rubble... You haven't seen the last of me!",
      loseText: "Hahaha! I told you! Your artifacts belong to my collection now!"
    },
    1: {
      name: "The Phantom Thief",
      image: "/thief.png",
      text: "Ah, my newest prize. The Bronze Knight. I stole it from your precious armory. You'll have to pry it from my cold, dead hands!",
      winText: "Tch! You got lucky this time. I'll be taking my leave before you take my mask as well.",
      loseText: "Too slow! Your deck is mine, and the Knight stays with me. Adieu!"
    },
    2: {
      name: "Chronos",
      image: "/chronos.png",
      text: "[SYSTEM ERROR] EGYPTIAN TIMELINE DETECTED. THE PHARAOH'S SHADOW IS SECURE. ELIMINATE INTRUDER.",
      winText: "[SYSTEM FAILURE] TEMPORAL ANOMALY DETECTED. SHUTTING DOWN...",
      loseText: "[TARGET ELIMINATED] TIMELINE SECURED. RESUMING PROTOCOL."
    },
    3: {
      name: "The Ronin Spirit",
      image: "/ronin.png",
      text: "You dare disturb the slumber of the Jade Dragon? It is the pride of the East! My cursed blade shall sever your soul!",
      winText: "My blade... broken... You are truly a warrior of honor. The Dragon is yours.",
      loseText: "Weak. Your spirit is as fragile as glass. Sleep for eternity."
    },
    4: {
      name: "The Void Herald",
      image: "/void_herald.png",
      text: "All history ends in the Void. You have made it far, Curator... but this is the end. I am the Primeval Curator. Your timeline is erased.",
      winText: "NO! The Void cannot be sealed! This timeline... is too strong... *fades away*",
      loseText: "Silence. The Void claims everything. Your museum is no more."
    }
  };

  const TAUNT_LORE = {
    0: "You are not even worthy of my Golem! Go back to your dusty Vault and collect some stronger relics, weakling!",
    1: "You wish to challenge me for the Bronze Knight? Your deck is pathetic. Don't waste my time until you're stronger.",
    2: "[ACCESS DENIED] INSUFFICIENT POWER LEVEL DETECTED. RETURN TO BASE IMMEDIATELY.",
    3: "Hah! A weakling approaches the Jade Dragon? Strengthen your spirit first, or my blade will cut you down before you even draw yours!",
    4: "You dare gaze into the Void? You are not ready for the Primeval Curator. Flee, before your existence is erased by simply standing here."
  };

  useEffect(() => {
    const savedInv = localStorage.getItem(getKey('inventory'));
    if (savedInv) {
      const parsedInv = JSON.parse(savedInv);
      setDiscoveredArtifacts(prev => {
        const newDiscovered = new Set(prev);
        parsedInv.forEach(item => newDiscovered.add(item.id));
        return Array.from(newDiscovered);
      });
    }

    const today = new Date().toLocaleDateString('en-CA');
    let timeoutId;
    if (lastLoginDate !== today) {
      timeoutId = setTimeout(() => setShowDailyModal(true), 600);
    }
    return () => clearTimeout(timeoutId);
  }, [lastLoginDate]);

  useEffect(() => {
    if (view === 'arena_combat' && isAutoBattle && battleState.turn === 'player') {
      const timer = setTimeout(() => {
        const handCards = [...(deck.weapon || []), ...(deck.armor || [])]
          .map(id => inventory.find(c => c.id === id))
          .filter(Boolean);
        if (handCards.length > 0) {
          const randomCard = handCards[Math.floor(Math.random() * handCards.length)];
          handleBattleAction(randomCard);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [view, isAutoBattle, battleState.turn, deck, inventory, battleState.active]);

  useEffect(() => {
    localStorage.setItem(getKey('inventory'), JSON.stringify(inventory));
    localStorage.setItem(getKey('coins'), coins.toString());
    localStorage.setItem(getKey('deck'), JSON.stringify(deck));
    localStorage.setItem(getKey('achievements'), JSON.stringify(achievements));
    localStorage.setItem(getKey('stars'), totalStars.toString());
    localStorage.setItem(getKey('stolen_artifacts'), JSON.stringify(stolenArtifacts));
    localStorage.setItem(getKey('win_streak'), winStreak.toString());
    localStorage.setItem(getKey('pity_counter'), pityCounter.toString());
    localStorage.setItem(getKey('player_level'), playerLevel.toString());
    localStorage.setItem(getKey('player_exp'), playerExp.toString());
    localStorage.setItem(getKey('player_insight'), playerInsight.toString());
    localStorage.setItem(getKey('unlocked_skills'), JSON.stringify(unlockedSkills));
    localStorage.setItem(getKey('discovered_artifacts'), JSON.stringify(discoveredArtifacts));
    localStorage.setItem(getKey('campaign_progress'), campaignProgress.toString());
    localStorage.setItem(getKey('streak'), loginStreak.toString());
    if (lastLoginDate) localStorage.setItem(getKey('last_login'), lastLoginDate);

    const newBadges = [];
    if (!achievements.badges.includes('The Grand Curator') && inventory.length >= 50) newBadges.push('The Grand Curator');

    let dupeCount = 0;
    inventory.forEach(c => { dupeCount += c.copies; });
    if (!achievements.badges.includes('Hoarder') && dupeCount >= 100) newBadges.push('Hoarder');

    const hasLegendaryNatura = inventory.some(c => c.rarity === 'Legendary' && c.element === 'Natura');
    const hasLegendaryMetallum = inventory.some(c => c.rarity === 'Legendary' && c.element === 'Metallum');
    const hasLegendaryAura = inventory.some(c => c.rarity === 'Legendary' && c.element === 'Aura');

    if (!achievements.badges.includes('Master of Elements') && hasLegendaryNatura && hasLegendaryMetallum && hasLegendaryAura) {
      newBadges.push('Master of Elements');
    }

    if (!achievements.badges.includes('Arena Gladiator') && totalStars >= 50) newBadges.push('Arena Gladiator');
    if (!achievements.badges.includes('Syndicate Slayer') && campaignProgress >= 5) newBadges.push('Syndicate Slayer');
    if (!achievements.badges.includes('Mad Scientist') && unlockedSkills.length >= 3) newBadges.push('Mad Scientist');

    if (newBadges.length > 0) {
      setAchievements(prev => ({ badges: [...prev.badges, ...newBadges] }));
      newBadges.forEach(b => setTimeout(() => showToast(<span>{TrophyIcon} BADGE UNLOCKED: {b}!</span>, 'success'), 1000));
    }

  }, [inventory, coins, deck, achievements, totalStars, stolenArtifacts, winStreak, pityCounter, playerLevel, playerExp, playerInsight, unlockedSkills, discoveredArtifacts, campaignProgress, loginStreak, lastLoginDate]);

  const handleEquipCard = (card) => {
    playClick();
    setDeck(prev => {
      const roleDeck = prev[card.role] || [];
      if (roleDeck.includes(card.id)) return prev;
      if (roleDeck.length >= DECK_LIMITS[card.role]) {
        showToast(`${card.role.toUpperCase()} slots are full! Unequip one first.`);
        return prev;
      }
      return { ...prev, [card.role]: [...roleDeck, card.id] };
    });
  };

  const handleRandomizeDeck = () => {
    playClick();
    const newDeck = {
      character: [], weapon: [], armor: [], accessory: [], arena: [], relic: [], lobby: []
    };

    const visibleInventory = inventory.filter(c => showCheatSandbox ? c.isCheated : !c.isCheated);

    const inventoryByRole = {
      character: visibleInventory.filter(c => c.role === 'character'),
      arena: visibleInventory.filter(c => c.role === 'arena'),
      weapon: visibleInventory.filter(c => c.role === 'weapon'),
      armor: visibleInventory.filter(c => c.role === 'armor'),
      accessory: visibleInventory.filter(c => c.role === 'accessory'),
      relic: visibleInventory.filter(c => c.role === 'relic'),
      lobby: visibleInventory.filter(c => c.role === 'lobby'),
    };

    const pickRandom = (arr, count) => {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count).map(c => c.id);
    };

    Object.keys(DECK_LIMITS).forEach(role => {
      newDeck[role] = pickRandom(inventoryByRole[role] || [], DECK_LIMITS[role]);
    });

    setDeck(newDeck);
    showToast("Deck auto-equipped with random artifacts!", "success");
  };

  const handleRemoveFromDeck = (role, cardId) => {
    playClick();
    setDeck(prev => ({
      ...prev,
      [role]: prev[role].filter(id => id !== cardId)
    }));
  };

  const calculateTotalStats = () => {
    const totals = {};
    Object.values(deck).flat().forEach(cardId => {
      const card = inventory.find(c => c.id === cardId);
      if (card && card.stats) {
        Object.entries(card.stats).forEach(([key, val]) => {
          if (typeof val === 'number') {
            totals[key] = (totals[key] || 0) + val;
          } else if (typeof val === 'string' && val.includes('%')) {
            const numRaw = val.replace(/[^0-9-]/g, '');
            if (numRaw) {
              const num = parseInt(numRaw, 10);
              totals[key] = (totals[key] || 0) + num;
            }
          }
        });
      }
    });
    return totals;
  };

  const getActiveRelic = () => {
    let relicId = null;
    if (deck.relic && deck.relic.length > 0) relicId = deck.relic[0];
    else if (deck.lobby && deck.lobby.length > 0) relicId = deck.lobby[0];
    if (!relicId) return null;
    return inventory.find(c => c.id === relicId);
  };

  const getActiveSynergies = () => {
    const counts = { Natura: 0, Metallum: 0, Aura: 0 };
    Object.values(deck).flat().forEach(cardId => {
      const card = inventory.find(c => c.id === cardId);
      if (card && counts[card.element] !== undefined) {
        counts[card.element]++;
      }
    });
    const active = [];
    if (counts.Natura >= 3) active.push('Natura');
    if (counts.Metallum >= 3) active.push('Metallum');
    if (counts.Aura >= 3) active.push('Aura');
    return active;
  };

  const getActivePityLimit = () => {
    if (unlockedSkills.includes('tycoon_3')) return 70;
    return PITY_LIMIT;
  };

  const startBattle = async () => {
    playClick();
    const playerCharIds = deck.character || [];
    const playerWeaponIds = deck.weapon || [];
    if (playerCharIds.length === 0) {
      showToast("You must equip a Character card first!");
      return;
    }
    if (playerWeaponIds.length === 0) {
      showToast("You must equip a Weapon in The Vault before entering combat!");
      return;
    }

    setSummoningBoss(true);

    try {
      const playerChar = inventory.find(c => c.id === playerCharIds[0]);
      let hpBonus = (playerChar.stats['Cultural Impact'] || 0) + (playerChar.stats['Authenticity'] || 0);
      let calculatedHp = 1000 + (hpBonus * 5);
      if (unlockedSkills.includes('warlord_1')) {
        calculatedHp = Math.floor(calculatedHp * 1.1);
      }

      const difficultyMultiplier = 1 + (winStreak * 0.2);

      const archetypes = [
        { type: 'Aggressor', title: 'The Ancient Aggressor', roles: ['weapon', 'weapon', 'weapon'] },
        { type: 'Ironclad', title: 'The Ironclad Guardian', roles: ['armor', 'armor', 'weapon'] },
        { type: 'Balanced', title: 'The Mystic Curator', roles: ['weapon', 'weapon', 'accessory'] }
      ];

      const selectedArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];

      const bossPromises = [
        fetchRandomArtifact('character'),
        ...selectedArchetype.roles.map(role => fetchRandomArtifact(role))
      ];

      const [bossCharData, ...bossDeckData] = await Promise.all(bossPromises);

      const enemyMaxHp = Math.floor(1200 * difficultyMultiplier);
      const enemyCharacter = {
        id: 'enemy-boss',
        title: bossCharData.title,
        imageUrl: bossCharData.imageUrl,
        rarity: 'Legendary',
        level: Math.floor(20 * difficultyMultiplier)
      };

      const enemyDeck = bossDeckData.map((card, idx) => {
        const stats = { ...card.stats };
        for (const key in stats) {
          if (typeof stats[key] === 'number') stats[key] = Math.floor(stats[key] * difficultyMultiplier);
        }
        return { ...card, id: `e-card-${idx}`, stats };
      });

      setBattleState({
        active: true,
        playerHp: calculatedHp,
        playerMaxHp: calculatedHp,
        enemyHp: enemyMaxHp,
        enemyMaxHp: enemyMaxHp,
        turn: 'player',
        log: [`${selectedArchetype.title} challenges you! (Win Streak: ${winStreak} | Difficulty: ${difficultyMultiplier.toFixed(1)}x)`],
        activeDefense: 0,
        enemyDeck: enemyDeck,
        enemyCharacter: enemyCharacter,
        difficultyMultiplier: difficultyMultiplier,
        activePlayerCard: null,
        activeEnemyCard: null,
        archetypeTitle: selectedArchetype.title,
        turnCount: 1,
        playerDodge: false,
        enemyDodge: false,
        playerAttackDebuff: false,
        enemyStunned: false,
        isCampaign: false,
        campaignStage: null,
        isRaid: false
      });

      setView('arena_combat');
    } catch (err) {
      console.error("Failed to summon boss:", err);
      showToast("Failed to summon Boss. The Museum APIs resisted!");
    } finally {
      setSummoningBoss(false);
    }
  };

  const startCampaignBattle = async (stageIndex) => {
    playClick();
    const playerCharIds = deck.character || [];
    if (playerCharIds.length === 0) {
      setToast({ type: 'error', message: "You must equip a Character in The Vault before entering the Campaign!" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    
    const playerWeaponIds = deck.weapon || [];
    if (playerWeaponIds.length === 0) {
      setToast({ type: 'error', message: "You must equip a Weapon in The Vault before entering combat!" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const activeDeckIds = [...(deck.character || []), ...(deck.weapon || []), ...(deck.armor || []), ...(deck.accessory || []), ...(deck.relic || [])];
    const availableCards = inventory.filter(c => !activeDeckIds.includes(c.id) && !stolenArtifacts.some(s => s.cardId === c.id));
    if (availableCards.length === 0) {
      setToast({ type: 'error', message: "The Syndicate refuses your challenge. You must have at least one unequipped artifact in your Vault to wager!" });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    setSummoningBoss(true);

    try {
      const playerChar = inventory.find(c => c.id === playerCharIds[0]);
      let hpBonus = (playerChar.stats['Cultural Impact'] || 0) + (playerChar.stats['Authenticity'] || 0);
      let maxHp = 1000 + (hpBonus * 5);
      if (unlockedSkills.includes('warlord_1')) maxHp = Math.floor(maxHp * 1.1);

      const bossCharData = await fetchCampaignBoss(stageIndex);

      const enemyMaxHp = bossCharData.maxHp;
      const enemyCharacter = bossCharData;

      const enemyDeck = [
        {
          id: 'boss-attack',
          title: "Devastating Blow",
          role: 'weapon',
          element: bossCharData.element,
          stats: { Lethality: bossCharData.attack }
        }
      ];

      setBattleState({
        active: true,
        playerHp: maxHp,
        playerMaxHp: maxHp,
        enemyHp: enemyMaxHp,
        enemyMaxHp: enemyMaxHp,
        enemyDeck: enemyDeck,
        log: [`A fearsome presence emerges from the MET Museum archives: ${bossCharData.title}!`, bossCharData.description],
        turn: 'player',
        activeDefense: 0,
        enemyCharacter: enemyCharacter,
        difficultyMultiplier: bossCharData.difficultyMultiplier,
        activePlayerCard: null,
        activeEnemyCard: null,
        archetypeTitle: bossCharData.title,
        turnCount: 1,
        playerDodge: false,
        enemyDodge: false,
        playerAttackDebuff: false,
        enemyStunned: false,
        isCampaign: true,
        campaignStage: stageIndex,
        isRaid: false
      });

      setView('arena_combat');
    } catch (err) {
      console.error("Failed to summon campaign boss:", err);
      showToast("Failed to summon Boss. The Museum APIs resisted!");
    } finally {
      setSummoningBoss(false);
    }
  };

  const triggerShake = () => {
    setShakeScreen(true);
    setTimeout(() => setShakeScreen(false), 400);
  };

  const triggerCriticalHit = () => {
    setCriticalHitFlash(true);
    triggerShake();
    setTimeout(() => setCriticalHitFlash(false), 800);
  };

  const triggerSlash = (target) => {
    setActiveSlash(target);
    setTimeout(() => setActiveSlash(null), 300);
  };

  const processEnemyTurn = (currentState) => {

    if (currentState.enemyStunned) {
      currentState.log.push(`🗿 ${currentState.archetypeTitle} is Petrified by clay and cannot move this turn!`);
      return { ...currentState, turn: 'player', activeDefense: 0, enemyStunned: false, activeEnemyCard: null };
    }

    const usableCards = currentState.enemyDeck.filter(c => c.role === 'weapon' || c.role === 'armor');
    const weapon = usableCards.length > 0
      ? usableCards[Math.floor(Math.random() * usableCards.length)]
      : currentState.enemyDeck[0];

    currentState.activeEnemyCard = weapon;
    currentState.activePlayerCard = null;

    let dmg = 0;
    const element = weapon.element || 'Physical';

    if (weapon.role === 'weapon') {
      dmg = weapon.stats.Lethality || Math.floor(100 * currentState.difficultyMultiplier);

      const critChance = parseInt(weapon.stats['Critical Edge'] || '0');
      if (Math.random() * 100 < critChance || (element === 'Physical' && Math.random() < 0.15)) {
        dmg *= 2;
        currentState.log.push(`${currentState.archetypeTitle} CRITS with ${weapon.title}!`);
        triggerShake();
      }

      if (currentState.playerDodge) {
        dmg = 0;
        currentState.log.push(`💨 You gracefully DODGED the attack using Ethereal agility!`);
        triggerShake();
      } else {
        if (currentState.activeDefense > 0 && element !== 'Mystical') {
          const mitigated = Math.floor(dmg * (currentState.activeDefense / 100));
          dmg -= mitigated;
          currentState.log.push(`Your armor mitigated ${mitigated} damage.`);
        } else if (element === 'Mystical' && currentState.activeDefense > 0) {
          currentState.log.push(`✨ The ${weapon.title} bypassed your armor entirely with Mystical energy!`);
        }
      }

      const turnCount = currentState.turnCount || 1;
      const suddenDeathStage = Math.floor(turnCount / 15);
      if (suddenDeathStage > 0 && dmg > 0) {
        dmg *= (suddenDeathStage + 1);
        if (turnCount % 15 === 0 && !currentState.log.some(l => l.includes(`SUDDEN DEATH STAGE ${suddenDeathStage}`))) {
          currentState.log.push(`⚔️ SUDDEN DEATH STAGE ${suddenDeathStage}! All damage is now ${suddenDeathStage + 1}x!`);
        }
      }

      if (dmg > 0) {
        currentState.playerHp -= dmg;
        playHit();
        currentState.log.push(`💥 ${currentState.archetypeTitle} dealt ${dmg} damage with ${weapon.title}!`);
        
        const activeSynergies = getActiveSynergies();
        const isIncomingReflection = currentState.isReflectionDamage === true;
        if (activeSynergies.includes('Aura') && !isIncomingReflection) {
          const reflectDmg = Math.floor(dmg * 0.25);
          if (reflectDmg > 0) {
            // Apply reflection damage (bypasses standard loop to prevent infinite recursion)
            currentState.enemyHp = Math.max(0, (currentState.enemyHp || 0) - reflectDmg);
            currentState.log.push(`✨ SPIRITUAL REFLECTION! ${reflectDmg} damage reflected back to the Boss!`);
          }
        }
        
        triggerShake();
        triggerSlash('player');
      }
    } else if (weapon.role === 'armor') {
      currentState.log.push(`${currentState.archetypeTitle} defends using ${weapon.title}!`);
    }

    let nextPlayerAttackDebuff = false;
    let nextEnemyDodge = false;
    if (element === 'Thermal') {
      nextPlayerAttackDebuff = true;
      currentState.log.push(`🔥 The boss throws searing earth, blinding you and weakening your next attack!`);
    } else if (element === 'Ethereal') {
      nextEnemyDodge = Math.random() < 0.5;
      if (nextEnemyDodge) currentState.log.push(`💨 The boss prepares to Dodge your next attack!`);
    }

    let newHp = Math.max(0, currentState.playerHp);

    if (newHp === 0) {
      if (currentState.isRaid) {
        handleRaidBattleEnd(currentState);
        return { ...currentState, playerHp: 0, turn: 'gameover' };
      }
      setWinStreak(0);
      currentState.log.push("You were defeated! Win Streak Reset!");

      let stolenName = null;
      if (currentState.isCampaign) {
        const activeDeckIds = [...deck.character, ...deck.weapon, ...deck.armor];
        const availableCards = inventory.filter(c => !activeDeckIds.includes(c.id) && !stolenArtifacts.some(s => s.cardId === c.id));
        const alreadyStolenForThisStage = stolenArtifacts.some(s => s.stageId === currentState.campaignStage);

        if (availableCards.length > 0 && !alreadyStolenForThisStage) {
          const stolen = availableCards[Math.floor(Math.random() * availableCards.length)];
          stolenName = stolen.title;
          setTimeout(() => {
            setStolenArtifacts(prev => {
              if (prev.some(s => s.stageId === currentState.campaignStage)) return prev;
              const updated = [...prev, { cardId: stolen.id, stageId: currentState.campaignStage }];
              return updated;
            });
          }, 0);
          currentState.log.push(`🚨 THEFT! The Syndicate stole your ${stolenName}! Rematch to get it back!`);
        }
      }

      setBattleResult({
        status: 'lose',
        stars: 0,
        coins: 0,
        message: stolenName
          ? `You have been defeated! The Syndicate stole your [${stolenName}]! Rematch Stage ${currentState.campaignStage} to get it back!`
          : 'You have been defeated! Your Win Streak is reset to 0.',
        isCampaign: currentState.isCampaign,
        campaignStageId: currentState.campaignStage
      });
      return { ...currentState, playerHp: 0, turn: 'gameover' };
    }

    const activeSynergies = getActiveSynergies();
    if (activeSynergies.includes('Natura') && newHp > 0) {
      const heal = Math.floor(currentState.playerMaxHp * 0.10);
      newHp = Math.min(currentState.playerMaxHp, newHp + heal);
      currentState.log.push(`🌿 REGROWTH! You naturally recovered ${heal} HP.`);
    }

    return { ...currentState, playerHp: newHp, turn: 'player', activeDefense: 0, playerDodge: false, enemyStunned: false, playerAttackDebuff: nextPlayerAttackDebuff, enemyDodge: nextEnemyDodge };
  };

  const handleBattleAction = (card) => {
    if (battleState.turn !== 'player') return;

    let newState = { ...battleState, log: [...battleState.log], activePlayerCard: card, activeEnemyCard: null };
    const element = card.element || 'Metallum';

    if (newState.enemyDodge) {
      newState.log.push(`💨 The Boss DODGED your attack completely!`);
      newState.enemyDodge = false;
      triggerShake();
    } else {
      if (card.role === 'weapon') {
        let dmg = card.stats.Lethality || 50;
        if (unlockedSkills.includes('scholar_3') && ['Natura', 'Metallum', 'Aura'].includes(element)) {
          dmg = Math.floor(dmg * 1.15);
        }

        if (newState.playerAttackDebuff) {
          dmg = Math.floor(dmg * 0.75);
          newState.log.push(`Your attack was weakened by the Boss's blinding earth!`);
        }

        let critChance = parseInt(card.stats['Critical Edge'] || '0');
        if (unlockedSkills.includes('warlord_2')) critChance += 10;
        if (Math.random() * 100 < critChance || (element === 'Metallum' && Math.random() < 0.25)) {
          const activeSynergies = getActiveSynergies();
          if (activeSynergies.includes('Metallum')) {
            dmg *= 3;
            newState.log.push(`⚔️ EXECUTIONER! Your Metallum synergy strikes critically for 300% damage!`);
          } else {
            dmg *= 2;
            newState.log.push(`⚔️ CRITICAL PIERCE! You strike with devastating forged power!`);
          }
          triggerCriticalHit();
        }

        const turnCount = battleState.turnCount || 1;
        const suddenDeathStage = Math.floor(turnCount / 15);
        if (suddenDeathStage > 0 && dmg > 0) {
          dmg *= (suddenDeathStage + 1);
          if (turnCount % 15 === 0 && !newState.log.some(l => l.includes(`SUDDEN DEATH STAGE ${suddenDeathStage}`))) {
            newState.log.push(`⚔️ SUDDEN DEATH STAGE ${suddenDeathStage}! All damage is now ${suddenDeathStage + 1}x!`);
          }
        }

        dmg = Math.max(1, dmg);

        if (element === 'Natura') {
          const lifesteal = Math.max(1, Math.floor(dmg * 0.3));
          newState.playerHp = Math.min(newState.playerMaxHp, newState.playerHp + lifesteal);
          newState.log.push(`🌿 Nature reclaims! You drain ${lifesteal} HP from the enemy.`);
        }

        newState.log.push(`You attack with ${card.title} for ${dmg} damage.`);
        newState.enemyHp = Math.max(0, newState.enemyHp - dmg);
        triggerSlash('enemy');

        if (newState.enemyHp === 0) {
          setWinStreak(s => s + 1);

          let earnedStars = 1;
          const hpPercent = newState.playerHp / newState.playerMaxHp;
          if (hpPercent === 1) earnedStars = 3;
          else if (hpPercent >= 0.5) earnedStars = 2;

          setTotalStars(s => s + earnedStars);

          let reward = Math.floor(500 * (newState.difficultyMultiplier || 1)) + (earnedStars * 100);
          const relic = getActiveRelic();
          if (relic && relic.element === 'Metallum') {
            reward = Math.floor(reward * 1.5);
          }

          if (newState.isCampaign) {
            if (newState.campaignStage === campaignProgress) {
              const nextProgress = campaignProgress + 1;
              setCampaignProgress(nextProgress);

              if (newState.campaignStage === 4) {
                setAchievements(prev => {
                  const badges = prev.badges.includes('Master of History') ? prev.badges : [...prev.badges, 'Master of History'];
                  return { ...prev, badges };
                });
                reward += 5000;
                newState.log.push(`🎉 YOU DEFEATED THE FINAL BOSS! 'Master of History' unlocked!`);
              } else {
                newState.log.push(<span>{MapIcon} NEW CAMPAIGN STAGE UNLOCKED!</span>);
              }
            }
          }

          newState.log.push(`VICTORY! ⭐ ${earnedStars} Stars Earned! (+${reward} Coins)`);
          setCoins(c => c + reward);
          if (newState.isCampaign) {
            setPlayerInsight(prev => prev + 25);

            const recovered = stolenArtifacts.find(s => s.stageId === newState.campaignStage);
            if (recovered) {
              const recoveredCard = inventory.find(c => c.id === recovered.cardId);
              if (recoveredCard) {
                newState.log.push(<span>🌟 RECOVERY! You reclaimed your stolen {recoveredCard.title}! (+50 {InsightIcon}, +1000 {CoinIcon})</span>);
                setCoins(c => c + 1000);
                setPlayerInsight(prev => prev + 50);
              }
              setTimeout(() => {
                setStolenArtifacts(prev => prev.filter(s => s.stageId !== newState.campaignStage));
              }, 0);
            }
          }
          if (newState.isCampaign && unlockedSkills.includes('warlord_3')) {
            if (Math.random() > 0.5) {
              newState.log.push(`The Warlord III: You stole a rare artifact from the boss!`);
              const randomCard = artifactsData[Math.floor(Math.random() * artifactsData.length)];
              setInventory(prev => [...prev, { ...randomCard, id: Date.now().toString() + Math.random().toString(36).substr(2, 9), isNew: true }]);
            }
          }

          setBattleResult({
            status: 'win',
            stars: earnedStars,
            coins: reward,
            message: `⭐ ${earnedStars} Stars Earned!`,
            isCampaign: newState.isCampaign,
            campaignStageId: newState.campaignStage
          });
          gainExp(newState.isCampaign ? 100 : 50);
          newState.turn = 'gameover';
          setBattleState(newState);
          return;
        }
      } else if (card.role === 'armor') {
        let mitigation = parseInt(card.stats['Damage Mitigation']?.toString().replace('%', '') || '20');
        if (unlockedSkills.includes('scholar_3') && ['Natura', 'Metallum', 'Aura'].includes(element)) {
          mitigation = Math.min(100, Math.floor(mitigation * 1.15));
        }
        newState.log.push(`You brace for impact with ${card.title}.`);
        newState.activeDefense = mitigation;
      } else {
        newState.log.push(`You channel the energy of ${card.title}, but it has no direct combat effect!`);
      }
    }

    if (element === 'Aura' && card.role === 'weapon') {
      newState.enemyStunned = Math.random() < 0.35;
      if (newState.enemyStunned) {
        newState.log.push(`✨ SPIRITUAL OVERLOAD! The Boss is stunned and will skip their next turn!`);
        triggerShake();
      }
    }

    newState.turn = 'enemy';
    newState.playerAttackDebuff = false;
    setBattleState(newState);

    setTimeout(() => {
      setBattleState(prev => {
        if (prev.turn === 'gameover') return prev;
        return processEnemyTurn({ ...prev, log: [...prev.log] });
      });
    }, 1500);
  };

  const handleSurrender = () => {
    playClick();
    setShowFleeModal(false);
    setWinStreak(0);
    setBattleResult({
      status: 'lose',
      stars: 0,
      coins: 0,
      message: 'You fled in cowardice! Win Streak Reset!',
      isCampaign: battleState.isCampaign,
      campaignStageId: battleState.campaignStage
    });
    setBattleState(prev => {
      return {
        ...prev,
        playerHp: 0,
        turn: 'gameover',
        log: [...prev.log, `You fled in cowardice!`]
      };
    });
  };

  const handleClaimDaily = async () => {
    playClick();
    if (claimingDaily) return;
    setClaimingDaily(true);
    const today = new Date().toLocaleDateString('en-CA');

    if (lastLoginDate === today) {
      showToast("You have already claimed your reward for today!");
      setClaimingDaily(false);
      return;
    }

    setLastLoginDate(today);

    let nextStreak = loginStreak;
    if (nextStreak > 15) nextStreak = 1;

    if (nextStreak === 7 || nextStreak === 15) {
      try {
        const rarity = nextStreak === 15 ? 'Legendary' : 'Epic';
        const card = await fetchRandomArtifact(null, rarity);

        setInventory(prev => {
          const existingIndex = prev.findIndex(c => c.id === card.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              copies: (updated[existingIndex].copies || 0) + 1
            };
            return updated;
          } else {
            return [...prev, card];
          }
        });

        setDailyRewardCard(card);
        setClaimingDaily(false);
      } catch (e) {
        showToast("Error fetching daily card. Try again.");
        setClaimingDaily(false);
        return;
      }
    } else {
      let reward = DAILY_COIN_REWARDS[nextStreak];
      if (unlockedSkills.includes('tycoon_2')) reward *= 2;
      const relic = getActiveRelic();
      if (relic && relic.element === 'Natura') {
        reward *= 2;
      }
      setCoins(c => c + reward);
      setTimeout(() => setShowDailyModal(false), 1500);
    }

    const nextForStorage = nextStreak >= 15 ? 1 : nextStreak + 1;
    setLoginStreak(nextForStorage);

    if (nextStreak !== 7 && nextStreak !== 15) {
      setClaimingDaily(false);
    }
  };

  const [upcomingRarity, setUpcomingRarity] = useState(null);
  const [encyclopediaPage, setEncyclopediaPage] = useState(0);
  const [encyclopediaFilter, setEncyclopediaFilter] = useState('All');
  const [encyclopediaRarity, setEncyclopediaRarity] = useState('All');
  const [encyclopediaElement, setEncyclopediaElement] = useState('All');
  const [encyclopediaRole, setEncyclopediaRole] = useState('All');
  const [encyclopediaSearch, setEncyclopediaSearch] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);

  const handlePull = async () => {
    playClick();
    let currentCost = PACK_COST;
    if (unlockedSkills.includes('tycoon_1')) currentCost = Math.floor(currentCost * 0.9);

    if (coins < currentCost) {
      showToast(`Not enough coins to open a pack! Need ${currentCost}`);
      return;
    }
    setCoins(c => c - currentCost);
    setPulling(true);
    setPulledCard(null);
    setUpcomingRarity(null);

    try {
      let newPity = pityCounter + 1;
      let forcedRarity = cheatMode ? cheatRarity : null;
      if (!cheatMode && newPity >= getActivePityLimit()) {
        forcedRarity = 'Legendary';
      }

      const card = await fetchRandomArtifact(null, forcedRarity);
      if (cheatMode) card.isCheated = true;

      if (card.rarity === 'Legendary') {
        newPity = 0;
      }
      setPityCounter(newPity);
      gainExp(10);
      setUpcomingRarity(card.rarity);

      setDiscoveredArtifacts(prev => {
        if (!prev.includes(card.id)) {
          return [...prev, card.id];
        }
        return prev;
      });

      const existingIndex = inventory.findIndex(c => c.id === card.id);
      let isNewCard = existingIndex === -1;
      let finalCardToReveal = card;
      let gainedInsight = false;

      if (!isNewCard) {
        const existingCard = inventory[existingIndex];
        if (existingCard.level >= 30) {
          gainedInsight = true;
          finalCardToReveal = existingCard;
        } else {
          finalCardToReveal = { ...existingCard, copies: (existingCard.copies || 0) + 1 };
        }
      }

      setInventory(prev => {
        const idx = prev.findIndex(c => c.id === card.id);
        if (idx >= 0) {
          const updated = [...prev];
          if (updated[idx].level < 30) {
            updated[idx] = { ...updated[idx], copies: (updated[idx].copies || 0) + 1 };
          }
          return updated;
        }
        return [...prev, card];
      });
      
      if (gainedInsight) {
         showToast(`Duplicate max level ${finalCardToReveal.title} converted to 5 Insight!`, 'success');
         setPlayerInsight(p => {
           const newInsight = p + 5;
           localStorage.setItem(getKey('player_insight'), newInsight.toString());
           return newInsight;
         });
      }

      setTimeout(() => {
        setSummonPhase('dropping');

        setTimeout(() => {
          setSummonPhase('opening');
          triggerShake();
          if (finalCardToReveal.rarity === 'Legendary') playLegendary();
          else if (finalCardToReveal.rarity === 'Epic') playEpic();
          else playClick();

          setTimeout(() => {
            setSummonPhase('revealing');
            setPulledCard({ ...finalCardToReveal, isNew: isNewCard });
            setIsFlipped(false);
            setPulling(false);
            setTimeout(() => setIsFlipped(true), 100);
            setTimeout(() => setSummonPhase(null), 1000);
          }, 1200);
        }, 1000);
      }, 0);

    } catch (error) {
      console.error(error);
      showToast("Failed to pull card. Try again.");
      setPulling(false);
      setSummonPhase(null);
      setUpcomingRarity(null);
    }
  };

  const handleMultiPull = async () => {
    playClick();
    let currentCost = PACK_COST * 5;
    if (unlockedSkills.includes('tycoon_1')) currentCost = Math.floor(currentCost * 0.9);

    if (coins < currentCost) {
      showToast(`Not enough coins for a 5x pull! Need ${currentCost}`);
      return;
    }
    setCoins(c => c - currentCost);
    setPulling(true);
    setPulledCard(null);

    try {
      const pulls = [];
      let currentPity = pityCounter;
      for (let i = 0; i < 5; i++) {
        currentPity++;
        let forcedRarity = cheatMode ? cheatRarity : null;
        if (!cheatMode && currentPity >= getActivePityLimit()) {
          forcedRarity = 'Legendary';
          currentPity = 0;
        }
        pulls.push(fetchRandomArtifact(null, forcedRarity).then(c => {
          if (cheatMode) c.isCheated = true;
          return c;
        }));
      }
      const newCards = await Promise.all(pulls);

      let finalPity = pityCounter;
      for (let i = 0; i < 5; i++) {
        finalPity++;
        if (newCards[i].rarity === 'Legendary') finalPity = 0;
      }
      setPityCounter(finalPity);
      gainExp(50);

      setDiscoveredArtifacts(prev => {
        const newDiscovered = new Set(prev);
        newCards.forEach(c => newDiscovered.add(c.id));
        return Array.from(newDiscovered);
      });

      const newInventoryList = [...inventory];
      const finalCardsToReveal = [];

      newCards.forEach(card => {
        let isNewCard = true;
        const existingCardIndex = newInventoryList.findIndex(c => c.id === card.id);

        if (existingCardIndex !== -1) {
          isNewCard = false;
          const existingCard = newInventoryList[existingCardIndex];
          if (existingCard.level >= 30) {
            // Convert to Insight instead of adding copies
            showToast(`Duplicate max level ${existingCard.title} converted to 5 Insight!`, 'success');
            setPlayerInsight(prev => {
              const newInsight = prev + 5;
              localStorage.setItem(getKey('player_insight'), newInsight.toString());
              return newInsight;
            });
          } else {
            existingCard.copies = (existingCard.copies || 0) + 1;
          }
        } else {
          newInventoryList.push(card);
        }

        finalCardsToReveal.push({ ...card, isNew: isNewCard });
      });

      setInventory(newInventoryList);
      setPulledCard(finalCardsToReveal);
    } catch (error) {
      console.error(error);
      showToast("Failed to pull cards. Try again.");
    } finally {
      setPulling(false);
    }
  };

  const handleWelcomeChest = async () => {
    playClick();
    setView('excavation');
    setPulling(true);
    setPulledCard(null);
    try {
      const char = await fetchRandomArtifact('character');
      const wep = await fetchRandomArtifact('weapon');
      const arm = await fetchRandomArtifact('armor');
      const acc = await fetchRandomArtifact('accessory');

      const newCards = [{ ...char, isWelcome: true, isNew: true }, { ...wep, isWelcome: true, isNew: true }, { ...arm, isWelcome: true, isNew: true }, { ...acc, isWelcome: true, isNew: true }];
      setInventory(prev => [...prev, char, wep, arm, acc]);
      setPulledCard(newCards);
    } catch (err) {
      console.error(err);
      showToast("Failed to open Welcome Chest. Try again.");
    } finally {
      setPulling(false);
    }
  };

  const triggerUpgrade = (cardId) => {
    playClick();
    const card = inventory.find(c => c.id === cardId);
    if (!card) return;

    if (card.level >= 30) {
      showToast("This artifact is already at Maximum Level (30)!");
      return;
    }

    let requiredLevel = 1;
    if (card.rarity === 'Legendary') requiredLevel = 20;
    else if (card.rarity === 'Epic') requiredLevel = 10;
    else if (card.rarity === 'Rare') requiredLevel = 5;

    if (playerLevel < requiredLevel) {
      showToast(`You must be Player Level ${requiredLevel} to upgrade ${card.rarity} artifacts!`);
      return;
    }

    let upgradeCost = card.level * 50;
    if (unlockedSkills.includes('scholar_1')) {
      upgradeCost = Math.floor(upgradeCost * 0.5);
    }

    if (coins < upgradeCost) {
      showToast(`Not enough coins! Need ${upgradeCost} to upgrade.`);
      return;
    }

    if (card.copies < 1) {
      showToast("You need at least 1 duplicate copy to upgrade this card!");
      return;
    }

    setCoins(c => c - upgradeCost);
    setInventory(prev => {
      const idx = prev.findIndex(c => c.id === cardId);
      const updated = [...prev];
      const currentCard = updated[idx];

      const newCard = { ...currentCard, copies: currentCard.copies - 1, level: currentCard.level + 1 };

      const newStats = { ...newCard.stats };
      for (const key in newStats) {
        if (typeof newStats[key] === 'number') {
          newStats[key] = Math.floor(newStats[key] * 1.1);
        } else if (typeof newStats[key] === 'string' && newStats[key].includes('%')) {
          const num = parseInt(newStats[key].replace(/[^0-9-]/g, ''));
          newStats[key] = newStats[key].replace(num.toString(), Math.floor(Math.abs(num) * 1.1).toString());
        }
      }
      newCard.stats = newStats;
      updated[idx] = newCard;
      return updated;
    });
  };

  const triggerDismantle = (cardId) => {
    playClick();
    const card = inventory.find(c => c.id === cardId);
    if (!card || card.copies < 1) return;

    let insightGained = 0;
    if (card.rarity === 'Legendary') insightGained = 100;
    else if (card.rarity === 'Epic') insightGained = 50;
    else if (card.rarity === 'Rare') insightGained = 20;
    else insightGained = 5;

    if (unlockedSkills.includes('scholar_2')) {
      insightGained = Math.floor(insightGained * 1.5);
    }

    setPlayerInsight(p => p + insightGained);

    setToast({ message: `Dismantled 1 copy! +${insightGained} Insight`, type: 'success' });

    setInventory(prev => {
      const idx = prev.findIndex(c => c.id === cardId);
      const updated = [...prev];
      updated[idx] = { ...updated[idx], copies: updated[idx].copies - 1 };
      return updated;
    });
  };

  // --- SUPABASE LOGIC ---
  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('win_streak', { ascending: false })
        .limit(10);
      if (error) throw error;
      setLeaderboardData(data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load leaderboard");
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const submitScore = async () => {
    if (!session) return setAuthModalOpen(true);

    // Fallback if leaderboardName is still loading
    const alias = leaderboardName || session.user.email.split('@')[0];
    localStorage.setItem('gacha_player_name', alias);

    try {
      const { error } = await supabase.from('leaderboard')
        .upsert(
          { display_name: alias, win_streak: winStreak, user_id: session.user.id },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
      showToast("Score Submitted to Global Leaderboard!", "success");
      fetchLeaderboard();
    } catch (err) {
      console.error(err);
      showToast("Failed to submit score");
    }
  };

  const handleCloudSave = async () => {
    setSyncing(true);
    try {
      const keys = ['inventory', 'coins', 'deck', 'achievements', 'stars', 'stolen_artifacts', 'win_streak', 'pity_counter', 'player_level', 'player_exp', 'player_insight', 'unlocked_skills', 'discovered_artifacts', 'campaign_progress', 'streak', 'last_login'];
      const saveData = {};
      keys.forEach(k => saveData[k] = localStorage.getItem(getKey(k)));

      const { error } = await supabase
        .from('cloud_saves')
        .upsert({ sync_code: syncCode, save_data: saveData, updated_at: new Date() });
      if (error) throw error;
      showToast("Progress Saved to Cloud!");
    } catch (err) {
      console.error(err);
      showToast("Failed to save to cloud");
    } finally {
      setSyncing(false);
    }
  };

  const handleCloudLoad = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase
        .from('cloud_saves')
        .select('save_data')
        .eq('sync_code', syncCode)
        .single();
      if (error) throw error;
      if (data && data.save_data) {
        Object.entries(data.save_data).forEach(([k, v]) => {
          if (v) localStorage.setItem(getKey(k), v);
        });
        showToast("Cloud Save Loaded! Reloading...");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast("No save found for this code.");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load from cloud. Invalid code?");
    } finally {
      setSyncing(false);
    }
  };

  // --- SYNDICATE LOGIC ---
  const fetchSyndicateLobby = async (synId) => {
    setLoadingSyndicate(true);
    try {
      const { data: syn } = await supabase.from('syndicates').select('*').eq('id', synId).single();
      const { data: members } = await supabase.from('syndicate_members').select('*').eq('syndicate_id', synId).order('total_damage', { ascending: false });
      const { data: boss } = await supabase.from('syndicate_boss').select('*').eq('syndicate_id', synId).single();
      setSyndicateData(syn);
      setSyndicateMembers(members || []);
      setSyndicateBoss(boss);
      localStorage.setItem('gacha_syndicate_id', synId);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch Syndicate data");
    } finally {
      setLoadingSyndicate(false);
    }
  };

  const createSyndicate = async () => {
    if (!leaderboardName) return showToast("Set a Display Name in the Leaderboard first!");
    if (!syndicateNewName) return showToast("Enter a Syndicate Name");
    setLoadingSyndicate(true);
    try {
      const joinCode = "SYN" + Math.floor(Math.random() * 100000);
      const { data: syn, error: synErr } = await supabase.from('syndicates').insert({ name: syndicateNewName, join_code: joinCode }).select('id').single();
      if (synErr) throw synErr;

      await supabase.from('syndicate_boss').insert({ syndicate_id: syn.id, hp: 5000000, max_hp: 5000000 });
      await supabase.from('syndicate_members').insert({ syndicate_id: syn.id, player_name: leaderboardName, user_id: session.user.id });

      showToast("Syndicate Created!");
      fetchSyndicateLobby(syn.id);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoadingSyndicate(false);
    }
  };

  const joinSyndicate = async () => {
    if (!leaderboardName) return showToast("Set a Display Name in the Leaderboard first!");
    if (!syndicateInputCode) return showToast("Enter a Join Code");
    setLoadingSyndicate(true);
    try {
      const { data: syn, error: synErr } = await supabase.from('syndicates').select('id').eq('join_code', syndicateInputCode).single();
      if (synErr || !syn) throw new Error("Invalid Join Code");

      const { error: joinErr } = await supabase.from('syndicate_members').insert({ syndicate_id: syn.id, player_name: leaderboardName, user_id: session.user.id });
      // Ignore unique constraint error if already joined
      if (joinErr && !joinErr.message.includes('duplicate key')) throw joinErr;

      showToast("Joined Syndicate!");
      fetchSyndicateLobby(syn.id);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoadingSyndicate(false);
    }
  };

  const handleRaidBattleEnd = async (finalState) => {
    let damageDealt = 999999 - finalState.enemyHp;
    const multiplier = raidAttacksToday === 0 ? 1 : raidAttacksToday === 1 ? 0.5 : raidAttacksToday === 2 ? 0.25 : 0.05;
    damageDealt = Math.floor(damageDealt * multiplier);
    if (damageDealt < 0) damageDealt = 0;

    const newAttacks = raidAttacksToday + 1;
    setRaidAttacksToday(newAttacks);
    localStorage.setItem('gacha_raid_attacks', newAttacks);

    try {
      const { data: latestBoss } = await supabase.from('syndicate_boss').select('*').eq('syndicate_id', syndicateData.id).single();
      const newBossHp = Math.max(0, latestBoss.hp - damageDealt);
      await supabase.from('syndicate_boss').update({ hp: newBossHp }).eq('syndicate_id', syndicateData.id);

      const { data: latestMember } = await supabase.from('syndicate_members').select('*').eq('syndicate_id', syndicateData.id).eq('user_id', session.user.id).single();
      if (latestMember) {
        const newTotalDmg = (latestMember.total_damage || 0) + damageDealt;
        await supabase.from('syndicate_members').update({ total_damage: newTotalDmg }).eq('id', latestMember.id);
      }
      fetchSyndicateLobby(syndicateData.id);
    } catch (err) {
      console.error("Failed to update raid data", err);
    }

    setBattleResult({
      status: 'lose',
      stars: 0,
      coins: 0,
      message: `Raid Attempt Finished! You dealt ${damageDealt.toLocaleString()} damage to Overlord Ravana.`,
      isCampaign: false,
      campaignStageId: null
    });
  };

  const startRaidBattle = () => {
    playClick();
    if (!syndicateBoss || syndicateBoss.hp <= 0) return showToast("Boss is already defeated!");
    const playerCharIds = deck.character || [];
    if (playerCharIds.length === 0) return showToast("Equip a Character card first!");

    const playerChar = inventory.find(c => c.id === playerCharIds[0]);
    let hpBonus = (playerChar.stats['Cultural Impact'] || 0) + (playerChar.stats['Authenticity'] || 0);
    let calculatedHp = 1000 + (hpBonus * 5);
    if (unlockedSkills.includes('warlord_1')) calculatedHp = Math.floor(calculatedHp * 1.1);

    // Provide a super tough boss deck
    const bossDeckData = [
      { id: 'r1', title: 'Staff of Dasamuka', role: 'weapon', rarity: 'Legendary', imageUrl: '/staff_dasamuka.png', stats: { 'Lethality': 400, 'Cultural Impact': 80 } },
      { id: 'r2', title: 'Obsidian Aegis', role: 'armor', rarity: 'Epic', imageUrl: '/obsidian_aegis.png', stats: { 'Damage Mitigation': 50, 'Authenticity': 50 } },
      { id: 'r3', title: 'Cursed Sun Orb', role: 'weapon', rarity: 'Legendary', imageUrl: '/cursed_sun_orb.png', stats: { 'Lethality': 800, 'Cultural Impact': 120 } }
    ];

    setBattleState({
      active: true,
      playerHp: calculatedHp,
      playerMaxHp: calculatedHp,
      enemyHp: 999999, // Practically infinite for the battle duration
      enemyMaxHp: 999999,
      archetypeTitle: "Overlord Ravana",
      enemyCharacter: {
        title: "Overlord Ravana",
        imageUrl: "/Overlord-Ravana.png"
      },
      turn: 'player',
      log: [`🚨 Engaging Overlord Ravana! "Nyai Vex sent children to slay a god? I am Dasamuka! Bow before me!"`],
      activeDefense: 0,
      enemyDeck: bossDeckData,
      isCampaign: false,
      campaignStage: null,
      turnCount: 1,
      isRaid: true
    });

    setView('arena_combat');
  };

  const renderSyndicateIntro = () => {
    return (
      <div className="guide-overlay" style={{ background: 'rgba(0,0,0,0.85)', zIndex: 2000 }}>
        <div className="guide-character" style={{ left: 'auto', right: '5%', bottom: '5%', maxWidth: '500px', animation: 'fadeUp 0.5s forwards' }}>
          <img src="/Nyai-Vex.png" alt="Nyai Vex" style={{ filter: 'drop-shadow(0 0 20px #8b5cf6)' }} />
        </div>
        <div className="dialogue-box panel-impeccable" style={{ background: 'rgba(26, 17, 15, 0.95)', borderColor: '#8b5cf6', width: '90%', maxWidth: '500px', margin: '0 auto', boxSizing: 'border-box' }}>
          <div className="dialogue-name" style={{ background: '#8b5cf6', color: '#fff', textShadow: '2px 2px 0 #000' }}>Nyai Vex</div>
          <div className="dialogue-text" style={{ fontSize: '1.4rem', color: '#fca5a5', textShadow: '1px 1px 0 #000', marginBottom: '20px' }}>
            "Welcome to the real underground, darling. Overlord Ravana has monopolized my artifact trade with his god-complex. Go down there and bleed him dry. I’ll be watching from up here."
          </div>
          <div className="dialogue-options" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button className="btn-impeccable danger" onClick={() => {
              playClick();
              if (!session) {
                setAuthModalOpen(true);
                return;
              }
              setView('syndicate_lobby');
              const savedSynId = localStorage.getItem('gacha_syndicate_id');
              if (savedSynId) fetchSyndicateLobby(savedSynId);
            }} style={{ flex: 1, padding: '15px' }}>PROCEED</button>
            <button className="btn-impeccable secondary" onClick={() => { playClick(); setView('grand_hall'); }} style={{ padding: '15px', flex: 'unset' }}>RETREAT</button>
          </div>
        </div>
      </div>
    );
  };

  const renderSyndicateLobby = () => {
    return (
      <div className="view-container panel-impeccable" style={{ minHeight: '60vh', marginTop: '20px', maxWidth: '600px', margin: '20px auto', borderColor: 'var(--void)', background: 'rgba(26, 17, 15, 0.95)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button className="btn-impeccable secondary" onClick={() => { playClick(); setView('grand_hall'); }}>Back</button>
          <h2 style={{ color: 'var(--void)', margin: 0, textShadow: '2px 2px 0 #000' }}><img src="/icons/warning_icon.png?v=2" style={{ width: '1em', height: '1em', verticalAlign: 'text-bottom', imageRendering: 'pixelated', mixBlendMode: 'multiply' }} /> THE BLACK MARKET</h2>
        </header>

        {!syndicateData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', border: '2px solid #4ade80' }}>
              <h3 style={{ color: '#4ade80', margin: '0 0 10px 0', textShadow: '1px 1px 0 #000' }}>Join a Syndicate</h3>
              <input type="text" placeholder="Enter Join Code (e.g. SYN12345)" value={syndicateInputCode} onChange={e => setSyndicateInputCode(e.target.value)} className="rpg-input" style={{ borderColor: '#4ade80', marginBottom: '15px' }} />
              <button className="btn-impeccable primary" style={{ width: '100%' }} onClick={joinSyndicate} disabled={loadingSyndicate}>{loadingSyndicate ? 'Loading...' : 'JOIN'}</button>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', border: '2px solid #fbbf24' }}>
              <h3 style={{ color: '#fbbf24', margin: '0 0 10px 0', textShadow: '1px 1px 0 #000' }}>Found a Syndicate</h3>
              <input type="text" placeholder="Syndicate Name" value={syndicateNewName} onChange={e => setSyndicateNewName(e.target.value)} className="rpg-input" style={{ borderColor: '#fbbf24', marginBottom: '15px' }} />
              <button className="btn-impeccable accent" style={{ width: '100%' }} onClick={createSyndicate} disabled={loadingSyndicate}>{loadingSyndicate ? 'Loading...' : 'CREATE'}</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.6)', border: '2px solid #333' }}>
              <p style={{ margin: '0 0 5px 0', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Join Code: <strong style={{ color: '#fff', userSelect: 'all', fontSize: '1.3rem' }}>{syndicateData.join_code}</strong></p>
            </div>

            {syndicateBoss && (
              <div style={{ background: 'rgba(220, 38, 38, 0.1)', border: '4px solid #dc2626', padding: '25px', textAlign: 'center', marginBottom: '30px', boxShadow: 'inset 0 0 20px rgba(220, 38, 38, 0.2)' }}>
                <h3 style={{ color: '#ef4444', margin: '0 0 15px 0', fontSize: '1.8rem', textShadow: '2px 2px 0 #000' }}>OVERLORD RAVANA</h3>
                <div style={{ width: '100%', height: '30px', background: '#1a1a1a', border: '2px solid #000', position: 'relative', overflow: 'hidden', marginBottom: '15px' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${Math.max(0, (syndicateBoss.hp / syndicateBoss.max_hp) * 100)}%`, background: '#ef4444', transition: 'width 0.5s ease' }}></div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem', textShadow: '1px 1px 0 #000', fontWeight: 'bold' }}>
                    {syndicateBoss.hp.toLocaleString()} / {syndicateBoss.max_hp.toLocaleString()} HP
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '20px', fontWeight: 'bold' }}>
                  <span>Attacks Today: <strong style={{ color: '#fff' }}>{raidAttacksToday}</strong></span>
                  <span>Damage Multiplier: <strong style={{ color: '#fbbf24' }}>{(raidAttacksToday === 0 ? 1 : raidAttacksToday === 1 ? 0.5 : raidAttacksToday === 2 ? 0.25 : 0.05) * 100}%</strong></span>
                </div>

                <button className="btn-impeccable danger" onClick={startRaidBattle} style={{ width: '100%', padding: '20px', fontSize: '1.5rem' }} disabled={syndicateBoss.hp <= 0}>
                  {syndicateBoss.hp <= 0 ? 'BOSS DEFEATED' : 'ENGAGE RAID'}
                </button>
              </div>
            )}

            <h3 style={{ borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '15px', color: '#fbbf24' }}>Syndicate Members</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '10px' }}>
              {syndicateMembers.map((m, idx) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '2px solid #333' }}>
                  <span style={{ fontSize: '1.1rem' }}><strong>{idx + 1}.</strong> {m.player_name}</span>
                  <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.1rem' }}>{parseInt(m.total_damage).toLocaleString()} Dmg</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderCredits = () => (
    <div className="view-container panel-impeccable" style={{ minHeight: '60vh', marginTop: '20px', maxWidth: '600px', margin: '20px auto', background: 'rgba(0,0,0,0.8)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button className="btn-impeccable secondary" onClick={() => { playClick(); setView('grand_hall'); }}>Back</button>
        <h2 style={{ color: '#fbbf24', margin: 0 }}>CREDITS</h2>
      </header>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 20px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', width: '130px', height: '130px', overflow: 'hidden', zIndex: 1 }}>
             <img src="/credit/foto.jpg" alt="Creator Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <img src="/credit/frame_puzzle.png" alt="Ancient Puzzle Frame" style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none', objectFit: 'contain' }} />
        </div>
        <h3 style={{ fontSize: '1.6rem', marginBottom: '10px', color: '#fff' }}>Muhammad Faqih Husain</h3>
        <div style={{ fontSize: '1rem', marginBottom: '30px', color: '#d4d4d8', wordBreak: 'break-word', lineHeight: '1.6' }}>
           Contact:<br />
           5027231023@student.its.ac.id<br />
           fqhhusain@gmail.com
        </div>
        <div className="panel-impeccable" style={{ background: 'var(--surface-color)', padding: '15px', border: '2px solid var(--primary)', marginBottom: '20px', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)' }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.1rem', textShadow: '1px 1px 0 #000' }}>Tugas Mata Kuliah Pengantar Pengembangan Game ITS</p>
          <p style={{ margin: '5px 0 0 0', color: '#fbbf24', fontSize: '1rem', textShadow: '1px 1px 0 #000' }}>Dosen: Imam Kuswardayan, S.Kom, M.T</p>
        </div>

        <a href="https://saweria.co/dailycisea" target="_blank" rel="noopener noreferrer" className="btn-impeccable primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', width: 'auto', padding: '15px 30px' }}>
          <img src="/icons/coin.png" alt="Saweria" style={{ width: '1.2em', height: '1.2em', imageRendering: 'pixelated' }} />
          Support Me on Saweria
        </a>
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="view-container panel-impeccable" style={{ minHeight: '60vh', marginTop: '20px', maxWidth: '600px', margin: '20px auto', background: 'rgba(0,0,0,0.8)' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button className="btn-impeccable secondary" onClick={() => { playClick(); setView('grand_hall'); }} style={{ whiteSpace: 'nowrap' }}>Back</button>
        <h2 style={{ color: '#fbbf24', margin: 0, fontSize: 'clamp(1.2rem, 5vw, 1.8rem)' }}><img src="/icons/trophy_icon.png?v=2" style={{ width: '1em', height: '1em', verticalAlign: 'text-bottom', imageRendering: 'pixelated' }} /> GLOBAL ARENA CHAMPIONS</h2>
      </header>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: 'rgba(255,255,255,0.05)', padding: '15px', border: '1px solid #333' }}>
        <div style={{ flex: 1, padding: '10px', background: '#000', color: '#fff', border: '1px solid var(--primary)', fontFamily: 'VT323', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>
          {leaderboardName || (session ? session.user.email.split('@')[0] : 'Log in to set Alias')}
        </div>
        <button className="btn-impeccable primary" onClick={submitScore}>Submit Score: {winStreak}</button>
      </div>

      {loadingLeaderboard ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading Champions...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {leaderboardData.map((row, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: idx === 0 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(0,0,0,0.5)', border: `1px solid ${idx === 0 ? '#fbbf24' : '#333'}`, fontSize: '1.2rem' }}>
              <div>
                <strong style={{ color: idx === 0 ? '#fbbf24' : idx === 1 ? '#e4e4e7' : idx === 2 ? '#b45309' : '#fff', marginRight: '15px' }}>#{idx + 1}</strong>
                {row.display_name}
              </div>
              <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{row.win_streak} Streak</div>
            </div>
          ))}
          {leaderboardData.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No champions yet. Be the first!</div>}
        </div>
      )}
    </div>
  );

  const renderGrandHall = () => (
    <div className="view-container home-battle-view">
      <main className="lobby-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '65vh', maxWidth: '450px', margin: '0 auto', textAlign: 'center', width: '100%' }}>
        {inventory.length === 0 && (
          <div style={{ marginBottom: '30px', animation: 'fadeUp 0.5s forwards', width: '100%' }}>
            <button className="btn-impeccable accent" onClick={handleWelcomeChest} style={{ width: '100%', padding: '24px 20px', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}>{GiftIcon}</div>
              <span>Open Welcome Chest (FREE)</span>
            </button>
          </div>
        )}

        {summoningBoss ? (
          <div className="pull-animation glass" style={{ width: '100%' }}>
            <div className="spinner"></div>
            <h2>Summoning Met Boss Artifacts...</h2>
          </div>
        ) : (
          <div style={{ animation: 'fadeUp 0.8s forwards', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="panel-impeccable" style={{ textAlign: 'left', borderLeftColor: '#059669' }}>
              <h3 style={{ color: '#059669', marginBottom: '10px', textShadow: '1px 1px 0 #000' }}>Quick Stats</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                <span>Win Streak: <strong style={{ color: '#fff' }}>{winStreak} {StreakIcon}</strong></span>
                <span>Artifacts: <strong style={{ color: '#fff' }}>{inventory.length} / {artifactsData.length}</strong></span>
              </div>
            </div>

            {getActiveRelic() && (
              <div className="panel-impeccable" style={{ textAlign: 'center', borderTopColor: `var(--rarity-${getActiveRelic().rarity.toLowerCase()})`, marginBottom: '16px', animation: 'fadeUp 0.5s forwards' }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Relic on Display</h3>
                <img src={getActiveRelic().imageUrl} alt={getActiveRelic().title} style={{ width: '100px', height: '100px', objectFit: 'contain', background: '#000', border: '2px solid #1a1a1a', marginBottom: '10px', animation: 'floatBob 4s ease-in-out infinite' }} />
                <h4 style={{ margin: '0 0 5px 0', color: `var(--rarity-${getActiveRelic().rarity.toLowerCase()})`, textShadow: '1px 1px 0 #000' }}>{getActiveRelic().title}</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {getActiveRelic().element === 'Aura' && <span><img src="/icons/magic_icon.png?v=2" style={{ width: '1em', height: '1em', verticalAlign: 'text-bottom', imageRendering: 'pixelated' }} /> Pity Blessing: -10 Pity Limit</span>}
                  {getActiveRelic().element === 'Metallum' && <span><img src="/icons/blade_icon.png?v=2" style={{ width: '1em', height: '1em', verticalAlign: 'text-bottom', imageRendering: 'pixelated' }} /> Bounty Hunter: +50% Arena Coins</span>}
                  {getActiveRelic().element === 'Natura' && <span><img src="/icons/heal_icon.png?v=2" style={{ width: '1em', height: '1em', verticalAlign: 'text-bottom', imageRendering: 'pixelated' }} /> Abundant Harvest: 2x Daily Coins</span>}
                  {!['Aura', 'Metallum', 'Natura'].includes(getActiveRelic().element) && `Passive: ${getActiveRelic().stats['Coin Yield'] || 'Unknown'}`}
                </p>
              </div>
            )}

            <div className="panel-impeccable promo-banner" onClick={() => { playClick(); setView('excavation'); }} style={{ padding: '0', cursor: 'pointer', position: 'relative', overflow: 'hidden', minHeight: '180px', display: 'flex', alignItems: 'flex-end', border: '4px solid var(--rarity-legendary)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent), url("https://images.metmuseum.org/CRDImages/as/original/DP234032.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'sepia(0.3) hue-rotate(-10deg)', opacity: 0.6 }}></div>
              <div style={{ position: 'relative', padding: '20px', zIndex: 1, textAlign: 'left', width: '100%' }}>
                <span style={{ background: 'var(--rarity-legendary)', color: '#000', padding: '4px 8px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', display: 'inline-block', boxShadow: '2px 2px 0 rgba(0,0,0,0.5)' }}>RATE UP!</span>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', textShadow: '2px 2px 0 #000' }}>Standing Four-Armed Shiva</h3>
                <p style={{ color: '#d4d4d8', fontSize: '0.9rem', marginTop: '5px' }}>Summon the legendary destroyer now!</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: '10px' }}>
              <button className="btn-impeccable primary" onClick={() => { playClick(); setView('campaign_map'); }} style={{ flex: 1, padding: '15px 5px', fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '5px', fontSize: '1.5rem' }}>{MapIcon}</div>
                STORY
              </button>

            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: '5px' }}>
              <button className="btn-impeccable danger" onClick={() => { playClick(); if (!session) setAuthModalOpen(true); else setView('syndicate_intro'); }} style={{ flex: 1, borderColor: '#dc2626', color: '#ef4444', padding: '15px 5px', fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '5px', fontSize: '1.5rem' }}><img src="/icons/warning_icon.png?v=2" style={{ width: '1em', height: '1em', imageRendering: 'pixelated', mixBlendMode: 'multiply' }} /></div>
                SYNDICATE
              </button>
              <button className="btn-impeccable accent" onClick={() => { playClick(); setView('leaderboard'); fetchLeaderboard(); }} style={{ flex: 1, padding: '15px 5px', fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '5px', fontSize: '1.5rem' }}><img src="/icons/trophy_icon.png?v=2" style={{ width: '1em', height: '1em', imageRendering: 'pixelated' }} /></div>
                RANKING
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button onClick={() => { playClick(); setView('credits'); }} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', textDecoration: 'underline', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'VT323, monospace' }}>
                Credits (ITS Assignment)
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );

  const renderExcavation = () => {
    return (
      <div className="view-container shop-view">
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>

          <button onClick={() => setCheatMode(!cheatMode)} style={{ position: 'absolute', right: 0, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem', opacity: cheatMode ? 1 : 0.5 }} title="Toggle Sandbox Control Panel">{SandboxIcon}</button>
        </div>



        {cheatMode && (
          <div className="panel-impeccable" style={{ marginBottom: '24px', borderColor: 'var(--primary)', background: 'var(--panel-bg)' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '15px', textShadow: '2px 2px 0 #000' }}>{SandboxIcon} Sandbox Control Panel</h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
              <button className="btn-impeccable accent" style={{ flex: '1 1 45%' }} onClick={() => setCoins(c => c + 100000)}>+100k Coins</button>
              <button className="btn-impeccable secondary" style={{ flex: '1 1 45%' }} onClick={() => setPlayerInsight(p => p + 50000)}>+50k Insight</button>
              <button className="btn-impeccable secondary" style={{ flex: '1 1 45%' }} onClick={() => {
                setPlayerLevel(100);
                const allSkills = ['tycoon_1', 'tycoon_2', 'tycoon_3', 'insight_1', 'insight_2', 'insight_3'];
                setUnlockedSkills(allSkills);
                showToast("Max Level & Skills Unlocked!", "success");
              }}>Max Lvl & Skills</button>
              <button className="btn-impeccable danger" style={{ flex: '1 1 45%' }} onClick={() => {
                setDiscoveredArtifacts(artifactsData.map(a => a.id));
                showToast("Pokedex Fully Unlocked!", "success");
              }}>Unlock Encyclopedia</button>
              <button className="btn-impeccable danger" style={{ flex: '1 1 45%' }} onClick={() => {
                setLoginStreak(15);
                setLastLoginDate(null);
                showToast("Time Travel: Streak set to Day 15!", "success");
              }}>Time Travel (Day 15)</button>
              <button className="btn-impeccable danger" style={{ flex: '1 1 45%' }} onClick={() => {
                setCampaignProgress(4);
                showToast("Campaign Warp to Final Boss!", "success");
              }}>Warp to Final Boss</button>
            </div>

            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '10px', borderTop: '1px dashed #10b981', paddingTop: '15px' }}>Force Next Pull Rarity</h4>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Common', 'Rare', 'Epic', 'Legendary'].map(r => (
                <button
                  key={r}
                  onClick={() => setCheatRarity(r)}
                  style={{
                    background: cheatRarity === r ? `var(--rarity-${r.toLowerCase()})` : 'rgba(0,0,0,0.5)',
                    color: cheatRarity === r ? '#000' : `var(--rarity-${r.toLowerCase()})`,
                    border: `1px solid var(--rarity-${r.toLowerCase()})`,
                    padding: '8px 16px',
                    borderRadius: '0',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                    boxShadow: cheatRarity === r ? `0 0 15px var(--rarity-${r.toLowerCase()})` : 'none'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="gacha-container">
          {!pulledCard && !pulling && (
            <div className="pack-container panel-impeccable" style={{ borderColor: '#d97706' }}>
              <h2 style={{ color: '#fbbf24', textShadow: '2px 2px 0 #000' }}>Excavation Artifact Pack</h2>
              <div className="pack-display" style={{ padding: '20px', background: 'rgba(0,0,0,0.5)', border: '2px solid #3e2723', marginTop: '15px' }}>
                <div className="pack-visual" onClick={handlePull}>
                  <div className="pack-seal">TEAR TO OPEN</div>
                </div>
                <p style={{ fontFamily: 'VT323', fontSize: '1.2rem' }}>Cost: {PACK_COST} Coins / Pack</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                  <button className="btn-impeccable secondary" onClick={handlePull}>Pull 1x</button>
                  <button className="btn-impeccable accent" onClick={handleMultiPull}>Pull 5x (500 Coins)</button>
                </div>
                <div className="pity-container" style={{ marginTop: '25px', padding: '15px', background: 'rgba(0,0,0,0.8)', border: '2px solid #1a1a1a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>Pity Counter</span>
                    <span>{pityCounter} / {PITY_LIMIT}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '0', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, (pityCounter / PITY_LIMIT) * 100)}%`,
                      background: pityCounter >= PITY_LIMIT - 10 ? 'var(--rarity-legendary)' : 'var(--primary)',
                      transition: 'width 0.3s ease, background 0.3s ease',
                      boxShadow: pityCounter >= PITY_LIMIT - 10 ? '0 0 10px var(--rarity-legendary)' : 'none'
                    }}></div>
                  </div>
                  <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '10px', color: pityCounter >= PITY_LIMIT - 10 ? 'var(--rarity-legendary)' : 'var(--text-secondary)' }}>
                    {pityCounter >= PITY_LIMIT ? "Guaranteed Legendary next pull!" : `Guaranteed Legendary in ${PITY_LIMIT - pityCounter} pulls`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {summonPhase && !pulledCard && (
            <div className={`pull-animation retro-summon phase-${summonPhase} ${upcomingRarity ? `rarity-${upcomingRarity.toLowerCase()}` : ''}`}>
              {summonPhase === 'dropping' && <div className="retro-crate">?</div>}
              {summonPhase === 'opening' && <div className="retro-flash"></div>}
              <h2>{summonPhase === 'dropping' ? 'INCOMING RELIC...' : 'CRACKING OPEN!'}</h2>
            </div>
          )}

          {pulledCard && (
            Array.isArray(pulledCard) ? (
              <div className="multi-pull-grid" style={{ textAlign: 'center', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--primary)', animation: 'fadeUp 0.5s forwards' }}>Artifacts Recovered!</h2>
                <div className="cards-grid">
                  {pulledCard.map((card, idx) => (
                    <div
                      key={idx}
                      className={`mini-card rarity-${card.rarity.toLowerCase()}`}
                      style={{ animation: `fadeUp 0.5s ${idx * 0.15}s forwards`, opacity: 0, textAlign: 'left' }}
                    >
                      <div className="mini-card-img-wrapper" style={{ height: '180px' }}>
                        <img src={card.imageUrl} alt={card.title} loading="lazy" />
                      </div>
                      <div className="mini-card-details">
                        <h4 style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>{card.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{card.role.toUpperCase()}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '0', fontSize: '0.75rem', fontWeight: 'bold' }}>{card.rarity}</span>
                          {card.isNew && !card.isWelcome && <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 'bold' }}>NEW</span>}
                          {!card.isNew && !card.isWelcome && <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>DUPE</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '40px', animation: `fadeUp 0.5s ${pulledCard.length * 0.15 + 0.5}s forwards`, opacity: 0 }}>
                  <button className="btn-impeccable primary" onClick={() => { playClick(); setPulledCard(null); setView('vault'); }} style={{ margin: '0 auto' }}>Claim & View Vault</button>
                </div>
              </div>
            ) : (
              <div className="card-flip-container">
                <div className={`card-flipper ${isFlipped ? 'is-flipped' : ''}`}>
                  <div className="card-back">
                    <div className="card-back-logo"><img src="/icons/vault.png" alt="Card Back" style={{ width: '64px', height: '64px', filter: 'brightness(0) invert(1) opacity(0.5)' }} /></div>
                  </div>
                  <div className="card-front">
                    <div className={`pulled-card-reveal panel-impeccable rarity-${pulledCard.rarity.toLowerCase()}`} style={{ borderColor: `var(--rarity-${pulledCard.rarity.toLowerCase()})` }}>
                      {!pulledCard.isNew && <div className="duplicate-banner">DUPLICATE! Added to Copies.</div>}
                      <div className="card-header">
                        <span className="card-role">{pulledCard.role.toUpperCase()}</span>
                        <span className="card-rarity">{ELEMENT_ICONS[pulledCard.element || 'Metallum']} {pulledCard.rarity} - LVL {pulledCard.level}</span>
                      </div>

                      <img src={pulledCard.imageUrl} alt={pulledCard.title} className="card-image" />

                      <div className="card-info">
                        <h3>{pulledCard.title}</h3>
                        <p className="card-year">{pulledCard.year} • {pulledCard.maker}</p>

                        <div className="card-stats">
                          {Object.entries(pulledCard.stats).map(([key, val]) => (
                            <div className="stat" key={key}><span>{key}</span> <span>{val}</span></div>
                          ))}
                        </div>
                        {!pulledCard.isNew && <p className="copies-count">Total Copies: {pulledCard.copies}</p>}
                      </div>

                      <button className="btn-impeccable primary mt-4" onClick={() => { playClick(); setPulledCard(null); setView('vault'); }} style={{ width: '100%' }}>Keep</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  const renderVault = () => {
    const totalStats = calculateTotalStats();
    const equippedIds = Object.values(deck).flat();

    const visibleInventory = inventory.filter(c => showCheatSandbox ? c.isCheated : !c.isCheated);

    const grouped = visibleInventory.reduce((acc, card) => {
      acc[card.role] = acc[card.role] || [];
      acc[card.role].push(card);
      return acc;
    }, {});

    return (
      <div className="view-container collection-view">
        <header className="panel-impeccable header" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: '#fbbf24', margin: 0, textShadow: '2px 2px 0 #000', fontSize: 'clamp(1.2rem, 5vw, 1.8rem)', whiteSpace: 'nowrap' }}>The Vault</h2>
            <span style={{ fontFamily: 'VT323', fontSize: 'clamp(0.9rem, 3.5vw, 1.2rem)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>📦 {visibleInventory.length}/{artifactsData.length}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'VT323', fontSize: '1.1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>⚡ Power: <strong style={{ color: '#fff' }}>{Object.values(totalStats).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0)}</strong></span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button className="btn-impeccable accent" onClick={handleRandomizeDeck} style={{ padding: '5px 10px', fontSize: '0.85rem', marginBottom: 0, whiteSpace: 'nowrap' }}>🎲 Random</button>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'rgba(0,0,0,0.8)', padding: '5px 8px', border: '2px solid #3e2723', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={showCheatSandbox} onChange={(e) => setShowCheatSandbox(e.target.checked)} />
                <span style={{ fontFamily: 'VT323', fontSize: '1.1rem' }}>Dev</span>
              </label>
            </div>
          </div>
        </header>

        <div style={{ marginBottom: '20px' }}>
          <button className="btn-impeccable accent" onClick={() => { playClick(); setEncyclopediaPage(0); setView('encyclopedia'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span>{BookIcon}</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Museum Encyclopedia</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{discoveredArtifacts.length} / {artifactsData.length} Discovered</div>
            </div>
          </button>
        </div>

        {visibleInventory.length === 0 ? (
          <div className="empty-state panel-impeccable" style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'VT323', fontSize: '1.5rem' }}>Your vault is empty. Return to the Excavation site!</p>
          </div>
        ) : (
          Object.entries(grouped).map(([role, cards]) => {
            const displayRole = role === 'lobby' ? 'relic' : role;
            return (
              <div key={role} className="collection-group panel-impeccable" style={{ marginBottom: '32px', borderColor: 'var(--primary)' }}>
                <h3 className="role-title" style={{ margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '4px solid #1a1a1a', color: 'var(--primary)' }}>{displayRole.toUpperCase()} {DECK_LIMITS[role] ? `(Max ${DECK_LIMITS[role]})` : ''}</h3>
                <div className="cards-grid">
                  {cards.map(card => {
                    const isEquipped = equippedIds.includes(card.id);
                    const isStolen = stolenArtifacts.some(s => s.cardId === card.id);
                    return (
                      <div key={card.id} className={`mini-card rarity-${card.rarity.toLowerCase()}`} onClick={() => setSelectedVaultCard(card)}>
                        <div className="mini-card-img-wrapper">
                          <img src={card.imageUrl} alt={card.title} loading="lazy" style={{ opacity: isStolen ? 0.3 : 1, filter: isStolen ? 'grayscale(100%)' : 'none' }} />
                          {isStolen && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(220,38,38,0.9)', color: '#fff', padding: '5px', fontWeight: 'bold', fontSize: '1rem', textAlign: 'center', width: '100%', border: '2px solid #000', zIndex: 5 }}><img src="/icons/warning_icon.png?v=2" style={{ width: '1em', height: '1em', verticalAlign: 'text-bottom', imageRendering: 'pixelated', mixBlendMode: 'multiply' }} /> STOLEN</div>}
                          <div className="mini-rarity-badge">{card.rarity[0]}</div>
                          <div style={{ position: 'absolute', top: '-10px', left: '-10px', fontSize: '1.2rem', background: 'rgba(0,0,0,0.8)', padding: '4px', border: '1px solid var(--surface-border)' }}>{ELEMENT_ICONS[card.element || 'Metallum']}</div>
                          {card.isCheated && (
                            <div style={{ position: 'absolute', top: '0', right: '0', background: '#ef4444', color: '#fff', padding: '2px 4px', fontWeight: 'bold', fontSize: '0.6rem' }}>DEV PULL</div>
                          )}
                          {isEquipped && (
                            <div style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--primary)', color: '#000', padding: '4px 8px', fontWeight: 'bold', fontSize: '0.7rem' }}>EQUIPPED</div>
                          )}
                        </div>
                        <div className="mini-card-details">
                          <h4>{card.title}</h4>
                          <div className="mini-stats">
                            <span style={{ color: 'var(--text-secondary)' }}>Lv {card.level}</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Dupe: {card.copies}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {/* Artifact Inspector Modal */}
        {selectedVaultCard && (() => {
          const isStolen = stolenArtifacts.some(s => s.cardId === selectedVaultCard.id);
          const stageStolen = stolenArtifacts.find(s => s.cardId === selectedVaultCard.id)?.stageId;
          return (
            <div className="modal-overlay" style={{ zIndex: 1000 }}>
              <div className="modal-content panel-impeccable" style={{ maxWidth: '400px', width: '100%', position: 'relative', borderColor: isStolen ? '#dc2626' : `var(--rarity-${selectedVaultCard.rarity.toLowerCase()})` }}>
                <button onClick={() => { playClick(); setSelectedVaultCard(null); }} style={{ position: 'absolute', top: '10px', right: '10px', background: '#dc2626', border: '4px solid #1a1a1a', color: '#fff', fontSize: '1rem', cursor: 'pointer', padding: '4px 8px', fontFamily: 'VT323' }}>X</button>

                <h3 style={{ color: `var(--rarity-${selectedVaultCard.rarity.toLowerCase()})`, marginBottom: '10px', fontSize: '1.2rem', textShadow: '1px 1px 0 #000' }}>{selectedVaultCard.title}</h3>
                <img src={selectedVaultCard.imageUrl} alt={selectedVaultCard.title} style={{ width: '100%', height: '180px', objectFit: 'contain', background: '#000', border: '4px solid #1a1a1a', marginBottom: '15px' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color: 'var(--text-secondary)', fontSize: '1rem', fontFamily: 'VT323' }}>
                  <span>Level: <strong style={{ color: '#fff', fontSize: '1.2rem' }}>{selectedVaultCard.level}</strong></span>
                  <span>Role: <strong style={{ color: '#fff', fontSize: '1.2rem' }}>{selectedVaultCard.role.toUpperCase()}</strong></span>
                </div>

                <div className="card-stats" style={{ marginBottom: '20px', fontFamily: 'VT323', fontSize: '1.2rem' }}>
                  {Object.entries(selectedVaultCard.stats).map(([key, val]) => (
                    <div className="stat" key={key} style={{ padding: '4px 0', borderBottom: '1px solid #3e2723' }}><span>{key}</span> <span>{val}</span></div>
                  ))}
                </div>

                <div style={{ marginBottom: '20px', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '2px dashed var(--rarity-legendary)', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '1.1rem', color: '#fbbf24', textShadow: '1px 1px 0 #000' }}>
                    Duplicates Available: <strong style={{ fontSize: '1.3rem' }}>{selectedVaultCard.copies}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                  {isStolen ? (
                    <div style={{ background: 'rgba(220,38,38,0.2)', padding: '15px', border: '2px solid #dc2626', textAlign: 'center', color: '#fca5a5' }}>
                      <h4 style={{ margin: '0 0 10px 0' }}><img src="/icons/warning_icon.png?v=2" style={{ width: '1em', height: '1em', verticalAlign: 'text-bottom', imageRendering: 'pixelated', mixBlendMode: 'multiply' }} /> STOLEN BY SYNDICATE</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>Defeat Boss in Campaign Stage {stageStolen} to retrieve this artifact!</p>
                    </div>
                  ) : (
                    <>
                      {DECK_LIMITS[selectedVaultCard.role] && (
                        equippedIds.includes(selectedVaultCard.id) ? (
                          <button className="btn-impeccable danger" onClick={() => { handleRemoveFromDeck(selectedVaultCard.role, selectedVaultCard.id); setSelectedVaultCard(null); }}>
                            {selectedVaultCard.role === 'lobby' || selectedVaultCard.role === 'relic' ? 'REMOVE FROM HALL' : 'UNEQUIP'}
                          </button>
                        ) : (
                          <button className="btn-impeccable primary" onClick={() => { handleEquipCard(selectedVaultCard); setSelectedVaultCard(null); }}>
                            {selectedVaultCard.role === 'lobby' || selectedVaultCard.role === 'relic' ? 'PLACE IN GRAND HALL' : 'EQUIP TO DECK'}
                          </button>
                        )
                      )}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className={`btn-impeccable accent ${selectedVaultCard.copies > 0 && coins >= (unlockedSkills.includes('scholar_1') ? Math.floor(selectedVaultCard.level * 50 * 0.5) : selectedVaultCard.level * 50) ? '' : 'disabled'}`}
                          style={{ flex: 1, opacity: (selectedVaultCard.copies > 0 && coins >= (unlockedSkills.includes('scholar_1') ? Math.floor(selectedVaultCard.level * 50 * 0.5) : selectedVaultCard.level * 50)) ? 1 : 0.5 }}
                          onClick={() => { triggerUpgrade(selectedVaultCard.id); setSelectedVaultCard(null); }}
                          title={selectedVaultCard.copies > 0 ? '' : 'Requires 1 duplicate'}>
                          {selectedVaultCard.copies > 0 ? <span>UPGRADE ({(unlockedSkills.includes('scholar_1') ? Math.floor(selectedVaultCard.level * 50 * 0.5) : selectedVaultCard.level * 50)})</span> : 'UPGRADE (Needs Dup)'}
                        </button>
                        <button className={`btn-impeccable danger ${selectedVaultCard.copies > 0 ? '' : 'disabled'}`}
                          style={{ flex: 1, opacity: selectedVaultCard.copies > 0 ? 1 : 0.5 }}
                          onClick={() => { triggerDismantle(selectedVaultCard.id); setSelectedVaultCard(null); }}
                          title={selectedVaultCard.copies > 0 ? '' : 'Requires 1 duplicate'}>
                          {selectedVaultCard.copies > 0 ? 'DISMANTLE DUP' : 'NO DUPLICATES'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const handlePurchaseSkill = (skillId, tierIndex) => {
    playClick();
    const tier = SKILL_TREE[tierIndex];
    const isTierLocked = tier.skills.some(s => unlockedSkills.includes(s.id));
    if (isTierLocked) {
      showToast("You can only choose ONE skill per Tier!");
      return;
    }

    if (playerInsight < tier.cost) {
      showToast(`Not enough Insight! Need ${tier.cost}`);
      return;
    }

    setPlayerInsight(p => p - tier.cost);

    setUnlockedSkills(prev => [...prev, skillId]);

    setToast({ message: `Unlocked Skill!`, type: 'success' });
  };

  const SKILL_TREE = [
    {
      tier: 1, cost: 100,
      skills: [
        { id: 'tycoon_1', title: 'The Tycoon I', desc: 'Diskon Pack Gacha 10%', icon: <img src="/icons/coin.png" alt="Tycoon" style={{ width: '32px', height: '32px', imageRendering: 'pixelated' }} /> },
        { id: 'warlord_1', title: 'The Warlord I', desc: 'HP seluruh deck meningkat 10%', icon: <img src="/icons/blade_icon.png?v=2" alt="Warlord" style={{ width: '32px', height: '32px', imageRendering: 'pixelated' }} /> },
        { id: 'scholar_1', title: 'The Scholar I', desc: 'Biaya Upgrade kartu diskon 50%', icon: <img src="/icons/book.png" alt="Scholar" style={{ width: '32px', height: '32px', imageRendering: 'pixelated' }} /> }
      ]
    },
    {
      tier: 2, cost: 300,
      skills: [
        { id: 'tycoon_2', title: 'The Tycoon II', desc: 'Hadiah Koin harian berlipat ganda', icon: <img src="/icons/coin.png" alt="Tycoon" style={{ width: '32px', height: '32px', imageRendering: 'pixelated' }} /> },
        { id: 'warlord_2', title: 'The Warlord II', desc: 'Peluang Critical Hit naik 10%', icon: <img src="/icons/blade_icon.png?v=2" alt="Warlord" style={{ width: '32px', height: '32px', imageRendering: 'pixelated' }} /> },
        { id: 'scholar_2', title: 'The Scholar II', desc: 'Dismantle menghasilkan +50% Insight', icon: <img src="/icons/book.png" alt="Scholar" style={{ width: '32px', height: '32px', imageRendering: 'pixelated' }} /> }
      ]
    },
    {
      tier: 3, cost: 1000,
      skills: [
        { id: 'tycoon_3', title: 'The Tycoon III', desc: 'Pity Limit turun menjadi 70', icon: <img src="/icons/coin.png" alt="Tycoon" style={{ width: '32px', height: '32px', imageRendering: 'pixelated' }} /> },
        { id: 'warlord_3', title: 'The Warlord III', desc: 'Curi artefak (50%) saat Bos mati', icon: <img src="/icons/blade_icon.png?v=2" alt="Warlord" style={{ width: '32px', height: '32px', imageRendering: 'pixelated' }} /> },
        { id: 'scholar_3', title: 'The Scholar III', desc: 'Stat Natura, Metallum, Aura +15%', icon: <img src="/icons/book.png" alt="Scholar" style={{ width: '32px', height: '32px', imageRendering: 'pixelated' }} /> }
      ]
    }
  ];

  const renderSkillTree = () => (
    <div className="view-container skill-tree-view" style={{ paddingBottom: '120px', maxWidth: '800px', margin: '0 auto' }}>
      <header className="panel-impeccable" style={{ marginBottom: '20px', textAlign: 'center', borderColor: 'var(--void)' }}>
        <h1 style={{ color: 'var(--void)', margin: '0 0 10px 0' }}>Curator Research Tree</h1>
        <p style={{ fontSize: '1.2rem', fontFamily: 'VT323' }}>Choose your specialization! You can only unlock ONE skill per tier.</p>
        <div style={{ fontSize: '1.5rem', color: '#fff', background: '#000', padding: '10px', display: 'inline-block', border: '2px solid var(--void)' }}>
          {InsightIcon} Insight: <strong style={{ color: 'var(--void)' }}>{playerInsight}</strong>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {SKILL_TREE.map((tierData, tIdx) => {
          const tierUnlocked = tierData.skills.some(s => unlockedSkills.includes(s.id));
          return (
            <div key={`tier-${tIdx}`} className="panel-impeccable" style={{ borderColor: tierUnlocked ? '#4ade80' : '#3f3f46' }}>
              <h3 style={{ textAlign: 'center', margin: '0 0 15px 0', borderBottom: '2px dashed #3f3f46', paddingBottom: '10px' }}>TIER {tierData.tier} (Cost: {tierData.cost} {InsightIcon})</h3>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {tierData.skills.map(skill => {
                  const isUnlocked = unlockedSkills.includes(skill.id);
                  const isLockedOut = tierUnlocked && !isUnlocked;
                  const canAfford = playerInsight >= tierData.cost;

                  return (
                    <div key={skill.id} style={{
                      flex: 1, minWidth: '200px', padding: '15px', background: isUnlocked ? 'rgba(74, 222, 128, 0.1)' : 'rgba(0,0,0,0.5)',
                      border: `2px solid ${isUnlocked ? '#4ade80' : isLockedOut ? '#ef4444' : '#3f3f46'}`,
                      textAlign: 'center', opacity: isLockedOut ? 0.5 : 1, position: 'relative'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{skill.icon}</div>
                      <h4 style={{ margin: '0 0 10px 0', color: isUnlocked ? '#4ade80' : '#fff' }}>{skill.title}</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>{skill.desc}</p>

                      {isUnlocked ? (
                        <div style={{ color: '#4ade80', fontWeight: 'bold' }}>UNLOCKED</div>
                      ) : isLockedOut ? (
                        <div style={{ color: '#ef4444', fontWeight: 'bold' }}>LOCKED</div>
                      ) : (
                        <button className={`btn-impeccable primary ${!canAfford ? 'disabled' : ''}`} onClick={() => handlePurchaseSkill(skill.id, tIdx)}>
                          UNLOCK
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const handleResetData = () => {
    playClick();
    setShowWipeConfirm(true);
  };

  const confirmWipeData = () => {
    const keys = [
      'inventory', 'coins', 'deck', 'achievements',
      'stars', 'stolen_artifacts', 'win_streak',
      'pity_counter', 'player_level', 'player_exp',
      'player_insight', 'unlocked_skills', 'discovered_artifacts',
      'campaign_progress', 'streak', 'last_login'
    ];
    keys.forEach(k => localStorage.removeItem(getKey(k)));
    window.location.reload();
  };

  const renderProfile = () => {
    return (
      <div className="view-container profile-view" style={{ paddingBottom: '80px', maxWidth: '600px', margin: '0 auto' }}>
        <header className="panel-impeccable header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn-impeccable secondary" onClick={() => { playClick(); setView('grand_hall'); }} style={{ marginBottom: 0, padding: '8px 12px' }}>Flee to Hall</button>
          <h2 style={{ margin: 0, textShadow: '2px 2px 0 #000' }}>Curator Profile</h2>
        </header>

        {session && (
          <div className="panel-impeccable" style={{ marginBottom: '20px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(212, 175, 55, 0.1)', borderColor: 'var(--primary)' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: 'var(--primary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px' }}>Connected Account</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{leaderboardName || session.user.email.split('@')[0]}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{session.user.email}</div>
            </div>
            <button className="btn-impeccable secondary" onClick={handleLogout} style={{ padding: '8px 15px', borderColor: 'var(--danger)', color: 'var(--danger)' }}>LOGOUT</button>
          </div>
        )}

        <div className="panel-impeccable" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: activeProfile === 'sandbox' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.5)', borderColor: activeProfile === 'sandbox' ? '#10b981' : '#d97706' }}>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 5px 0', color: activeProfile === 'sandbox' ? '#10b981' : 'var(--primary)' }}>
              {activeProfile === 'sandbox' ? <span>{SandboxIcon} Sandbox Profile</span> : <span>{StarIcon} Main Profile</span>}
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {activeProfile === 'sandbox' ? 'Testing environment. Safe space.' : 'Your actual game progress.'}
            </p>
          </div>
          <button
            className="btn-impeccable"
            style={{ borderColor: activeProfile === 'sandbox' ? '#10b981' : 'var(--primary)', color: activeProfile === 'sandbox' ? '#10b981' : 'var(--primary)', padding: '10px 15px' }}
            onClick={() => {
              localStorage.setItem('gacha_active_profile', activeProfile === 'main' ? 'sandbox' : 'main');
              window.location.reload();
            }}
          >
            Switch to {activeProfile === 'main' ? 'Sandbox' : 'Main'}
          </button>
        </div>

        <div className="panel-impeccable" style={{ padding: '20px', textAlign: 'center', marginBottom: '20px', borderColor: 'var(--rarity-legendary)' }}>
          <h1 style={{ fontSize: '3rem', margin: '0', color: 'var(--primary)' }}>{StarIcon} {totalStars}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Total Arena Stars Earned</p>
        </div>

        <div className="glass" style={{ padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Daily Check-in Progress
            <button className="btn-primary" style={{ padding: '5px 10px', fontSize: '0.8rem' }} onClick={() => { playClick(); setShowDailyModal(true); }}>Open Daily</button>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '2.5rem' }}>{CalendarIcon}</div>
            <div>
              <p style={{ margin: '0', fontSize: '1.2rem' }}>Current Streak: <strong style={{ color: 'var(--primary)' }}>{loginStreak} Days</strong></p>
              <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)' }}>
                Next Milestone: Day {loginStreak < 7 ? 7 : 15} (Free Artifact!)
              </p>
            </div>
          </div>
        </div>

        <h3 style={{ marginBottom: '15px', textAlign: 'left' }}>Collection Badges</h3>
        <div className="badge-grid">
          {[
            { name: 'The Grand Curator', desc: 'Own 50 total artifacts' },
            { name: 'Hoarder', desc: 'Accumulate 100 duplicate copies' },
            { name: 'Master of Elements', desc: 'Legendary of all 3 Elements' },
            { name: 'Arena Gladiator', desc: 'Earn 50 Total Stars' },
            { name: 'Syndicate Slayer', desc: 'Reach Campaign Stage 5' },
            { name: 'Mad Scientist', desc: 'Unlock 3 Research Skills' }
          ].map(badge => {
            const unlocked = achievements.badges.includes(badge.name);
            return (
              <div key={badge.name} className="glass" style={{ padding: '20px', opacity: unlocked ? 1 : 0.4, border: unlocked ? '1px solid var(--primary)' : '1px solid var(--surface-border)', filter: unlocked ? 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.2))' : 'none', transition: 'all 0.3s' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>{unlocked ? TrophyIcon : LockIcon}</h2>
                <h4 style={{ color: unlocked ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '5px' }}>{badge.name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{badge.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Supabase Cloud Sync Section */}
        <div className="panel-impeccable" style={{ marginTop: '30px', padding: '20px', borderColor: 'var(--primary)', background: 'rgba(212, 175, 55, 0.05)' }}>
          <h3 style={{ color: 'var(--primary)', marginBottom: '10px' }}><img src="/icons/magic_icon.png?v=2" style={{ width: '1em', height: '1em', verticalAlign: 'text-bottom', imageRendering: 'pixelated' }} /> Cloud Sync (Supabase)</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>Backup your progress to the cloud or load it on another device using a secret Sync Code.</p>

          <input
            type="text"
            placeholder="Enter your secret Sync Code"
            value={syncCode}
            onChange={(e) => setSyncCode(e.target.value)}
            style={{ width: '100%', padding: '10px', background: '#000', color: '#fff', border: '2px solid var(--primary)', fontFamily: 'VT323', fontSize: '1.2rem', marginBottom: '15px', boxSizing: 'border-box' }}
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-impeccable primary" onClick={handleCloudSave} disabled={syncing || !syncCode} style={{ flex: 1 }}>
              {syncing ? 'Syncing...' : 'UPLOAD SAVE'}
            </button>
            <button className="btn-impeccable secondary" onClick={handleCloudLoad} disabled={syncing || !syncCode} style={{ flex: 1 }}>
              {syncing ? 'Syncing...' : 'LOAD SAVE'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: '40px', padding: '20px', border: '2px dashed #dc2626', textAlign: 'center', background: 'rgba(220, 38, 38, 0.05)' }}>
          <h3 style={{ color: '#dc2626', marginBottom: '10px' }}>Danger Zone</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', fontSize: '0.9rem' }}>Wipe all local save data and start over from Level 1.</p>
          <button className="btn-impeccable danger" onClick={handleResetData} style={{ margin: '0 auto' }}>{NuclearIcon} WIPE SAVE DATA</button>
        </div>
      </div>
    );
  };

  const renderDailyModal = () => {
    if (!showDailyModal) return null;
    const today = new Date().toLocaleDateString('en-CA');
    const hasClaimedToday = lastLoginDate === today;

    return (
      <div className="modal-overlay">
        <div className="modal-content glass" style={{ textAlign: 'center', maxWidth: '400px', position: 'relative' }}>
          <button onClick={() => { playClick(); setShowDailyModal(false); setTimeout(() => setDailyRewardCard(null), 300); }} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
          <h2 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Daily Check-in</h2>
          <p style={{ marginBottom: '20px' }}>Login Streak: <strong>{loginStreak} Days</strong></p>

          <div style={{ fontSize: '3rem', margin: '20px 0' }}>
            {loginStreak === 7 || loginStreak === 15 ? GiftIcon : CoinIcon}
          </div>

          {dailyRewardCard ? (
            <div style={{ animation: 'fadeUp 0.5s forwards' }}>
              <h3 style={{ color: `var(--rarity-${dailyRewardCard.rarity.toLowerCase()})` }}>You found an Artifact!</h3>
              <div className={`mini-card rarity-${dailyRewardCard.rarity.toLowerCase()}`} style={{ margin: '10px auto' }}>
                <div className="mini-card-img-wrapper" style={{ height: '120px' }}>
                  <img src={dailyRewardCard.imageUrl} alt={dailyRewardCard.title} />
                </div>
                <div className="mini-card-details">
                  <h4>{dailyRewardCard.title}</h4>
                  <p style={{ color: 'var(--primary)' }}>{dailyRewardCard.rarity}</p>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
              Today's Reward: <br />
              {loginStreak === 7 ? <strong style={{ color: 'var(--rarity-epic)' }}>Epic Artifact</strong> :
                loginStreak === 15 ? <strong style={{ color: 'var(--rarity-legendary)' }}>Legendary Artifact</strong> :
                  <strong style={{ color: 'var(--primary)' }}>{DAILY_COIN_REWARDS[loginStreak > 15 ? 1 : loginStreak]} Coins</strong>}
            </p>
          )}

          <button
            className="btn-impeccable primary"
            style={{ width: '100%', padding: '12px' }}
            onClick={dailyRewardCard || hasClaimedToday ? () => { playClick(); setShowDailyModal(false); setTimeout(() => setDailyRewardCard(null), 300); } : handleClaimDaily}
            disabled={claimingDaily}
          >
            {claimingDaily ? 'Claiming...' : dailyRewardCard ? 'AWESOME!' : hasClaimedToday ? 'COME BACK TOMORROW' : 'Claim Reward'}
          </button>
        </div>
      </div>
    );
  };

  const renderLevelUpModal = () => {
    if (!levelUpRewards) return null;
    return (
      <div className="modal-overlay" style={{ zIndex: 4000, background: 'rgba(0,0,0,0.9)' }}>
        <div className="modal-content panel-impeccable" style={{ textAlign: 'center', borderColor: '#3b82f6', animation: 'fadeUp 0.5s forwards', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
          <h1 style={{ color: '#3b82f6', textShadow: '2px 2px 0 #000', margin: '0 0 15px 0' }}>LEVEL UP!</h1>
          <p style={{ fontSize: '1.5rem', fontFamily: 'VT323', marginBottom: '20px' }}>You have reached <strong>Level {levelUpRewards.newLevel}</strong>!</p>

          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', border: '2px solid var(--surface-border)', marginBottom: '20px' }}>
            <div style={{ color: '#fbbf24', fontSize: '1.5rem', marginBottom: '15px' }}>+{levelUpRewards.coins} Coins!</div>
            <div style={{ marginBottom: '10px', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Bonus Artifact Unlocked:</div>
            <div className="mini-card" style={{ margin: '0 auto', width: '200px' }}>
              {levelUpRewards.card.isNew && <div className="new-badge" style={{ position: 'absolute', top: '-10px', right: '-10px', zIndex: 10, background: '#ef4444', color: '#fff', padding: '2px 8px', fontSize: '0.8rem', border: '2px solid #000' }}>NEW</div>}
              <div className="card-header" style={{ background: `var(--rarity-${levelUpRewards.card.rarity.toLowerCase()})`, borderBottom: '2px solid #000', padding: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={levelUpRewards.card.title}>{levelUpRewards.card.title}</div>
              <div style={{ height: '120px', overflow: 'hidden', borderBottom: '2px solid #000' }}>
                <img src={levelUpRewards.card.imageUrl} alt={levelUpRewards.card.title} style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }} />
              </div>
              <div style={{ padding: '10px', fontSize: '0.9rem' }}>{levelUpRewards.card.role.toUpperCase()}</div>
            </div>
          </div>

          <button className="btn-impeccable primary" onClick={() => { playClick(); setLevelUpRewards(null); }}>AWESOME!</button>
        </div>
      </div>
    );
  };

  const renderAriaGuide = () => {
    if (!showGuide) return null;

    const toggleCategory = (cat) => {
      setGuideCategory(guideCategory === cat ? null : cat);
      playClick();
    };

    return (
      <div className="guide-overlay" onClick={() => { setShowGuide(false); setGuideCategory(null); }}>
        <div className="guide-character" onClick={(e) => e.stopPropagation()}>
          <img src="/aria.png" alt="Aria" />
        </div>
        <div className="dialogue-box panel-impeccable" onClick={(e) => e.stopPropagation()} style={{ background: 'rgba(26, 17, 15, 0.95)', borderColor: '#d97706' }}>
          <div className="dialogue-name" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Aria</span>
            <button onClick={() => { playClick(); setShowGuide(false); setGuideCategory(null); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '1.2rem', padding: '0 5px', cursor: 'pointer' }}>✖</button>
          </div>
          <div className="dialogue-text">{guideDialogue}</div>
          <div className="dialogue-options" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            
            <button className="accordion-btn" onClick={() => toggleCategory('basics')} style={{ background: guideCategory === 'basics' ? 'var(--primary)' : 'var(--surface-color)', color: guideCategory === 'basics' ? '#000' : 'var(--primary)', border: '2px solid var(--primary)', padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>
              The Basics {guideCategory === 'basics' ? '[-]' : '[+]'}
            </button>
            {guideCategory === 'basics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: '15px' }}>
                <button onClick={() => { playClick(); setGuideDialogue("The Museum is an infinite repository of history. Evil forces from The Void stole its artifacts, and it's your job to reclaim them by fighting their corrupted guardians!"); }}>What is The Museum?</button>
                <button onClick={() => { playClick(); setGuideDialogue("You can pull new cards in the Excavation area! Don't forget to equip your best cards in The Vault before entering the Campaign or Arena."); }}>How do I get stronger?</button>
              </div>
            )}

            <button className="accordion-btn" onClick={() => toggleCategory('combat')} style={{ background: guideCategory === 'combat' ? 'var(--primary)' : 'var(--surface-color)', color: guideCategory === 'combat' ? '#000' : 'var(--primary)', border: '2px solid var(--primary)', padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>
              Combat System {guideCategory === 'combat' ? '[-]' : '[+]'}
            </button>
            {guideCategory === 'combat' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: '15px' }}>
                <button onClick={() => { playClick(); setGuideDialogue("Combat is highly strategic! Metallum deals heavy critical bursts, Natura drains life, Thermal blinds enemies, Ethereal allows dodging, and Aura can stun them entirely!"); }}>How does Combat work?</button>
                <button onClick={() => { playClick(); setGuideDialogue("Card stats are unique! 'Lethality' is your Attack Damage, and 'Critical Edge' is your Crit Chance. For HP, it's calculated from your Character's 'Cultural Impact' and 'Authenticity' combined!"); }}>How do I read card stats?</button>
              </div>
            )}

            <button className="accordion-btn" onClick={() => toggleCategory('mechanics')} style={{ background: guideCategory === 'mechanics' ? 'var(--primary)' : 'var(--surface-color)', color: guideCategory === 'mechanics' ? '#000' : 'var(--primary)', border: '2px solid var(--primary)', padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>
              Advanced Mechanics {guideCategory === 'mechanics' ? '[-]' : '[+]'}
            </button>
            {guideCategory === 'mechanics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: '15px' }}>
                <button onClick={() => { playClick(); setGuideDialogue("Equip 3 or more artifacts of the same Element to unlock powerful Synergy Set Bonuses! Natura provides Regrowth healing, Metallum grants 300% Crit Executioner damage, and Aura reflects 25% enemy damage!"); }}>How do Set Bonuses work?</button>
                <button onClick={() => { playClick(); setGuideDialogue("Cards have a Max Level of 30! If you pull a duplicate of a card that is already at Max Level, you will receive 5 Insight points instead!"); }}>What happens to duplicates?</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWipeModal = () => {
    if (!showWipeConfirm) return null;
    return (
      <div className="modal-overlay" style={{ zIndex: 5000, background: 'rgba(0,0,0,0.9)' }}>
        <div className="modal-content panel-impeccable" style={{ textAlign: 'center', borderColor: '#ef4444', animation: 'fadeUp 0.3s forwards', width: '90%', maxWidth: '400px', background: 'var(--surface-color)' }}>
          <h2 style={{ color: '#ef4444', margin: '0 0 15px 0' }}>{NuclearIcon} SYSTEM WARNING</h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Are you sure you want to WIPE all your save data? This will reset your progress, delete all artifacts, and cannot be undone!
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button className="btn-impeccable" onClick={() => { playClick(); setShowWipeConfirm(false); }}>Cancel</button>
            <button className="btn-impeccable danger" onClick={confirmWipeData}>CONFIRM WIPE</button>
          </div>
        </div>
      </div>
    );
  };

  const renderPreBattleLore = () => {
    if (preBattleLore === null) return null;
    const stageId = preBattleLore;
    const loreData = CAMPAIGN_LORE[stageId];
    const isLocked = campaignProgress < stageId;

    return (
      <div className="guide-overlay" style={{ background: 'rgba(0,0,0,0.85)', zIndex: 2000 }}>
        <div className="guide-character" style={{ left: 'auto', right: '5%', bottom: '5%', maxWidth: '500px', animation: 'fadeUp 0.5s forwards' }}>
          <img src={loreData.image} alt={loreData.name} style={{ filter: 'drop-shadow(0 0 20px #991b1b)' }} />
        </div>
        <div className="dialogue-box panel-impeccable" style={{ background: 'rgba(26, 17, 15, 0.95)', borderColor: '#ef4444', width: '90%', maxWidth: '500px', margin: '0 auto', boxSizing: 'border-box' }}>
          <div className="dialogue-name" style={{ background: '#ef4444', color: '#fff', textShadow: '2px 2px 0 #000' }}>{loreData.name}</div>
          <div className="dialogue-text" style={{ fontSize: '1.4rem', color: '#fca5a5', textShadow: '1px 1px 0 #000', marginBottom: '20px' }}>
            {isLocked ? TAUNT_LORE[stageId] : loreData.text}
          </div>
          <div className="dialogue-options" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            {!isLocked && (
              <button className="btn-impeccable danger" onClick={() => { playClick(); setPreBattleLore(null); startCampaignBattle(stageId); }} style={{ flex: 1, padding: '15px' }}>BATTLE START!</button>
            )}
            <button className="btn-impeccable secondary" onClick={() => { playClick(); setPreBattleLore(null); }} style={{ padding: '15px', flex: isLocked ? 1 : 'unset' }}>RETREAT</button>
          </div>
        </div>
      </div>
    );
  };

  const renderCampaignMap = () => {
    const STAGES = [
      { id: 0, name: "Stage 1: The Clay Golem", top: '20%', left: '15%' },
      { id: 1, name: "Stage 2: The Bronze Knight", top: '40%', left: '35%' },
      { id: 2, name: "Stage 3: Pharaoh's Shadow", top: '30%', left: '60%' },
      { id: 3, name: "Stage 4: The Jade Dragon", top: '65%', left: '75%' },
      { id: 4, name: "Stage 5: Primeval Curator", top: '80%', left: '45%' },
    ];

    return (
      <div className="view-container campaign-map-view panel-impeccable" style={{ minHeight: '75vh', display: 'flex', flexDirection: 'column', position: 'relative', marginTop: '10px', background: 'rgba(0,0,0,0.6)', overflowY: 'auto', paddingBottom: '120px' }}>
        <header className="header" style={{ width: '100%', padding: '8px 12px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn-impeccable secondary" onClick={() => { playClick(); setView('grand_hall'); }} style={{ padding: '5px 10px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>← Back</button>
            <h2 style={{ textShadow: '0 2px 4px #000', margin: 0, color: '#fbbf24', fontSize: 'clamp(1.2rem, 5vw, 1.8rem)', textAlign: 'right' }}>Campaign Map</h2>
          </div>
        </header>

        <div className="map-nodes-container" style={{ position: 'relative', flex: 1, width: '100%', minHeight: '60vh' }}>
          {STAGES.map((stage) => {
            const isUnlocked = campaignProgress >= stage.id;
            const isCompleted = campaignProgress > stage.id;
            const hasStolenArtifact = stolenArtifacts.some(s => s.stageId === stage.id);

            return (
              <div
                key={stage.id}
                className={`map-node ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted && !hasStolenArtifact ? 'completed' : ''} ${hasStolenArtifact ? 'stolen-alert' : ''}`}
                style={{ top: stage.top, left: stage.left }}
                onClick={() => {
                  playClick();
                  if (isCompleted && !hasStolenArtifact) {
                    showToast("You have already defeated this stage!");
                  } else {
                    setPreBattleLore(stage.id);
                  }
                }}
              >
                <div className="node-icon" style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <img src={`/nodes/node_${stage.id}.png`} alt={stage.name} style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                  <span style={{ display: 'none' }}>{isCompleted ? '⭐' : isUnlocked ? '⚔️' : '🔒'}</span>

                  {isCompleted && !hasStolenArtifact && <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '1.2rem' }}>{StarIcon}</div>}
                  {hasStolenArtifact && <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', animation: 'pulse 1s infinite', zIndex: 10, filter: 'drop-shadow(0 0 10px #dc2626)' }}><img src="/icons/warning_icon.png?v=2" style={{ width: '2rem', height: '2rem', imageRendering: 'pixelated', mixBlendMode: 'multiply' }} /></div>}
                  {!isUnlocked && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{LockIcon}</div>}
                </div>
                <div className="node-name panel-impeccable" style={{ padding: '4px 8px', fontSize: '0.9rem', fontFamily: 'VT323', borderColor: hasStolenArtifact ? '#dc2626' : (isUnlocked ? 'var(--primary)' : '#1a1a1a') }}>{stage.name}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderArenaCombat = () => {
    const playerCharId = deck.character[0];
    const playerChar = inventory.find(c => c.id === playerCharId);

    const handCards = [...(deck.weapon || []), ...(deck.armor || [])]
      .map(id => inventory.find(c => c.id === id))
      .filter(Boolean);

    const bgImage = battleState.isRaid
      ? "url('/background/bg_raid.png')"
      : battleState.isCampaign
        ? `url(/background/bg_${battleState.campaignStage}.png)`
        : "url('/background/bg_arena.png')";


    return (
      <div className="view-container battle-view" style={{ paddingBottom: '80px' }}>
        <header className="panel-impeccable header" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button className="btn-impeccable secondary" onClick={() => { playClick(); setShowFleeModal(true); }} style={{ marginBottom: 0, padding: '6px 10px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Flee</button>
              <button className={`btn-impeccable ${isAutoBattle ? 'danger' : 'secondary'}`} onClick={() => { playClick(); setIsAutoBattle(!isAutoBattle); }} style={{ marginBottom: 0, padding: '6px 10px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>AUTO: {isAutoBattle ? 'ON' : 'OFF'}</button>
            {cheatMode && (
              <button
                className="btn-impeccable danger"
                style={{ marginBottom: 0, padding: '8px 12px', fontSize: '1rem', borderColor: '#ef4444', animation: 'pulse 2s infinite' }}
                onClick={() => setBattleState(prev => ({ ...prev, playerHp: 99999, playerMaxHp: 99999, activePlayerCard: { ...prev.activePlayerCard, attack: 99999 } }))}
                title="God Mode: Max HP & ATK"
              >
                ⚡ GOD MODE
              </button>
            )}
            </div>
            <h2 style={{ margin: 0, textShadow: '2px 2px 0 #000', fontSize: 'clamp(1rem, 5vw, 1.6rem)', textAlign: 'right' }}>Arena Combat</h2>
          </div>
        </header>

        {showFleeModal && (
          <div className="modal-overlay">
            <div className="modal-content panel-impeccable" style={{ textAlign: 'center', maxWidth: '400px', padding: '30px', animation: 'fadeUp 0.3s forwards', borderColor: '#ef4444' }}>
              <h2 style={{ color: '#ef4444', marginBottom: '15px', textShadow: '2px 2px 0 #000' }}>Cowardice?</h2>
              <p style={{ marginBottom: '25px', color: 'var(--text-secondary)', fontFamily: 'VT323', fontSize: '1.2rem' }}>Are you sure you want to flee? This will reset your Win Streak and count as a crushing defeat!</p>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button className="btn-impeccable secondary" onClick={() => { playClick(); setShowFleeModal(false); }}>Cancel</button>
                <button className="btn-impeccable danger" onClick={handleSurrender}>Yes, Flee!</button>
              </div>
            </div>
          </div>
        )}

        {battleResult && (
          <div className="guide-overlay" style={{ background: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', padding: '20px', flexWrap: 'wrap' }}>

            {battleResult.isCampaign && CAMPAIGN_LORE[battleResult.campaignStageId] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px', animation: 'fadeUp 0.5s forwards' }}>
                <img src={CAMPAIGN_LORE[battleResult.campaignStageId].image} alt={CAMPAIGN_LORE[battleResult.campaignStageId].name} style={{ filter: 'drop-shadow(0 0 20px #991b1b)', maxHeight: '400px', objectFit: 'contain' }} />
                <div className="dialogue-box panel-impeccable" style={{ background: 'rgba(26, 17, 15, 0.95)', borderColor: '#ef4444', width: '100%', marginTop: '-30px', zIndex: 2 }}>
                  <div className="dialogue-name" style={{ background: '#ef4444', color: '#fff', textShadow: '2px 2px 0 #000' }}>{CAMPAIGN_LORE[battleResult.campaignStageId].name}</div>
                  <div className="dialogue-text" style={{ fontSize: '1.2rem', color: '#fca5a5', textShadow: '1px 1px 0 #000' }}>{battleResult.status === 'win' ? CAMPAIGN_LORE[battleResult.campaignStageId].winText : CAMPAIGN_LORE[battleResult.campaignStageId].loseText}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '100%', maxWidth: '500px' }}>
              <div style={{ width: '100%', maxWidth: '450px', margin: '0 auto -80px auto', position: 'relative', zIndex: 10, textAlign: 'center', animation: 'fadeUp 0.5s forwards, floatBob 3s ease-in-out infinite', pointerEvents: 'none' }}>
                <img src={battleResult.status === 'win' ? '/ui/victory_crest.png' : '/ui/defeat_crest.png'} alt={battleResult.status === 'win' ? 'Victory' : 'Defeat'} style={{ width: '100%', height: 'auto', imageRendering: 'pixelated', filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.9))' }} />
              </div>

            <div className="panel-impeccable" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', borderColor: battleResult.status === 'win' ? '#fbbf24' : '#ef4444', animation: 'fadeUp 0.5s forwards', boxSizing: 'border-box', margin: '0 auto', paddingTop: '90px', position: 'relative', zIndex: 5 }}>
              <p style={{ fontSize: '1.2rem', fontFamily: 'VT323', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                {battleResult.message.split('⭐').map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < arr.length - 1 && <img src="/icons/star_icon.png?v=2" alt="Star" style={{ width: '1em', height: '1em', imageRendering: 'pixelated' }} />}
                  </React.Fragment>
                ))}
              </p>

              {battleResult.status === 'win' && (
                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', marginBottom: '30px', border: '2px solid #1a1a1a' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{Array.from({ length: battleResult.stars }).map((_, i) => <span key={i}>{StarIcon}</span>)}</div>
                  <div style={{ fontSize: '1.5rem', color: '#fbbf24' }}>+{battleResult.coins} Coins</div>
                </div>
              )}

              <button className={`btn-impeccable ${battleResult.status === 'win' ? 'primary' : 'danger'}`}
                onClick={() => { playClick(); setBattleResult(null); setView(battleResult.isCampaign ? 'campaign_map' : 'grand_hall'); }}
                style={{ width: '100%', padding: '15px', fontSize: '1.2rem' }}>
                CONTINUE
              </button>
            </div>
            </div>
          </div>
        )}

        <div className="battle-arena" style={{ backgroundImage: bgImage }}>
          {criticalHitFlash && <div className="critical-hit-flash">FATALITY! CRITICAL HIT!</div>}
          <div className="combatant player-side" style={{ position: 'relative' }}>
            {activeSlash === 'player' && (
              <div className="attack-slash-container">
                <div className="attack-slash"></div>
              </div>
            )}
            <div className="hp-bar-container">
              <div className="hp-text">You: {battleState.playerHp} / {battleState.playerMaxHp}</div>
              <div className="hp-bar-bg">
                <div className="hp-bar-fill" style={{ width: `${Math.max(0, (battleState.playerHp / battleState.playerMaxHp) * 100)}%` }}></div>
              </div>
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              {battleState.activePlayerCard ? (
                <div className="active-card-overlay" style={{ animation: 'fadeUp 0.3s forwards', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={battleState.activePlayerCard.imageUrl} alt={battleState.activePlayerCard.title} className="combatant-img" style={{ border: '4px solid var(--primary)', borderRadius: '0', boxShadow: '0 0 30px var(--primary)' }} />
                  <div style={{ position: 'absolute', bottom: '-15px', background: 'var(--primary)', color: '#000', padding: '4px 12px', borderRadius: '0', fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{battleState.activePlayerCard.title}</div>
                </div>
              ) : (
                playerChar && <img src={playerChar.imageUrl} alt="Player" className="combatant-img" />
              )}
            </div>
          </div>

          <div className="vs-badge">VS</div>

          <div className="combatant enemy-side" style={{ position: 'relative' }}>
            {activeSlash === 'enemy' && (
              <div className="attack-slash-container">
                <div className="attack-slash"></div>
              </div>
            )}
            <div className="hp-bar-container">
              <div className="hp-text">{battleState.enemyCharacter ? battleState.enemyCharacter.title : 'Boss'}: {battleState.enemyHp} / {battleState.enemyMaxHp}</div>
              <div className="hp-bar-bg">
                <div className="hp-bar-fill enemy-fill" style={{ width: `${(battleState.enemyHp / battleState.enemyMaxHp) * 100}%` }}></div>
              </div>
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              {battleState.activeEnemyCard ? (
                <div className="active-card-overlay" style={{ animation: 'fadeUp 0.3s forwards', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={battleState.activeEnemyCard.imageUrl} alt={battleState.activeEnemyCard.title} className="combatant-img" style={{ border: '4px solid #ef4444', borderRadius: '0', boxShadow: '0 0 30px rgba(239, 68, 68, 0.6)' }} />
                  <div style={{ position: 'absolute', bottom: '-15px', background: '#ef4444', color: '#fff', padding: '4px 12px', borderRadius: '0', fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{battleState.activeEnemyCard.title}</div>
                </div>
              ) : (
                battleState.enemyCharacter && <img src={battleState.enemyCharacter.imageUrl} alt="Enemy" className="combatant-img" />
              )}
            </div>
          </div>
        </div>
        {(() => {
          const renderLogEntry = (msg, idx) => {
            if (typeof msg !== 'string') return msg;

            let iconToRender = null;
            let iconBgColor = 'rgba(0,0,0,0.5)';
            let borderColor = 'var(--surface-border)';
            let textMsg = msg;

            if (msg.includes('💥')) { iconToRender = <img src="/icons/damage_icon.png?v=2" alt="Hit" style={{ width: '28px', height: '28px', imageRendering: 'pixelated' }} />; textMsg = msg.replace('💥', ''); borderColor = '#ef4444'; iconBgColor = 'rgba(239, 68, 68, 0.2)'; }
            else if (msg.includes('✨')) { iconToRender = <img src="/icons/magic_icon.png?v=2" alt="Magic" style={{ width: '28px', height: '28px', imageRendering: 'pixelated' }} />; textMsg = msg.replace('✨', ''); borderColor = '#a855f7'; iconBgColor = 'rgba(168, 85, 247, 0.2)'; }
            else if (msg.includes('⚔️')) { iconToRender = <img src="/icons/blade_icon.png?v=2" alt="Crit" style={{ width: '28px', height: '28px', imageRendering: 'pixelated' }} />; textMsg = msg.replace('⚔️', ''); borderColor = '#fbbf24'; iconBgColor = 'rgba(251, 191, 36, 0.2)'; }
            else if (msg.includes('🔥')) { iconToRender = <img src="/icons/flame_icon.png?v=2" alt="Burn" style={{ width: '28px', height: '28px', imageRendering: 'pixelated' }} />; textMsg = msg.replace('🔥', ''); borderColor = '#f97316'; iconBgColor = 'rgba(249, 115, 22, 0.2)'; }
            else if (msg.includes('🗿')) { iconToRender = <img src="/icons/stun_icon.png?v=2" alt="Stun" style={{ width: '28px', height: '28px', imageRendering: 'pixelated' }} />; textMsg = msg.replace('🗿', ''); borderColor = '#9ca3af'; iconBgColor = 'rgba(156, 163, 175, 0.2)'; }
            else if (msg.includes('🌿')) { iconToRender = <img src="/icons/heal_icon.png?v=2" alt="Heal" style={{ width: '28px', height: '28px', imageRendering: 'pixelated' }} />; textMsg = msg.replace('🌿', ''); borderColor = '#10b981'; iconBgColor = 'rgba(16, 185, 129, 0.2)'; }
            else if (msg.includes('🌟')) { iconToRender = <img src="/icons/star_icon.png?v=2" alt="Recover" style={{ width: '28px', height: '28px', imageRendering: 'pixelated' }} />; textMsg = msg.replace('🌟', ''); borderColor = '#fcd34d'; iconBgColor = 'rgba(252, 211, 77, 0.2)'; }
            else if (msg.includes('🚨')) { iconToRender = <img src="/icons/warning_icon.png?v=2" alt="Theft" style={{ width: '28px', height: '28px', imageRendering: 'pixelated', mixBlendMode: 'multiply' }} />; textMsg = msg.replace('🚨', ''); borderColor = '#dc2626'; iconBgColor = 'rgba(220, 38, 38, 0.2)'; }

            // Colorize numbers
            const parts = textMsg.split(/(\d+)/).map((textChunk, j) => {
              if (!isNaN(textChunk) && textChunk.trim() !== '') {
                return <span key={j} style={{ color: '#fbbf24', fontWeight: 'bold' }}>{textChunk}</span>;
              }
              return textChunk;
            });

            return (
              <div key={idx} className="log-entry" style={{ animation: 'fadeUp 0.3s forwards', marginBottom: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                {iconToRender ? (
                  <div className="glass" style={{
                    width: '40px', height: '40px', flexShrink: 0,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    background: iconBgColor, border: `1px solid ${borderColor}`,
                    borderRadius: '6px', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
                  }}>
                    {iconToRender}
                  </div>
                ) : (
                  <div style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', flexShrink: 0, marginLeft: '17px' }} />
                )}
                <div style={{ flex: 1, lineHeight: '1.4' }}>
                  {parts}
                </div>
              </div>
            );
          };

          return (
            <div className="battle-log panel-impeccable" style={{ fontFamily: 'VT323', fontSize: '1.2rem', padding: '15px' }}>
              {battleState.log.slice(-4).map((msg, idx) => renderLogEntry(msg, idx))}
            </div>
          );
        })()}

        <div className="battle-hand panel-impeccable" style={{ marginTop: '20px', borderColor: 'var(--primary)' }}>
          <h3 style={{ color: 'var(--primary)', margin: '0 0 10px 0', textShadow: '1px 1px 0 #000' }}>Your Hand (Pick Action)</h3>
          <div className="cards-horizontal-scroll" style={{ padding: '10px 0' }}>
            {handCards.map(card => (
              <div
                key={card.id}
                className={`mini-card rarity-${card.rarity.toLowerCase()} ${battleState.turn !== 'player' ? 'disabled' : ''}`}
                onClick={() => { playClick(); handleBattleAction(card); }}
                style={{ cursor: battleState.turn === 'player' ? 'pointer' : 'not-allowed', opacity: battleState.turn === 'player' ? 1 : 0.5 }}
              >
                <div className="mini-card-img-wrapper" style={{ height: '80px' }}>
                  <img src={card.imageUrl} alt={card.title} loading="lazy" />
                </div>
                <div className="mini-card-details" style={{ padding: '8px' }}>
                  <h4 style={{ fontSize: '0.8rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.title}</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {card.role === 'weapon' ? `ATK: ${card.stats.Lethality}` : `DEF: ${card.stats['Damage Mitigation']}%`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderEncyclopedia = () => {
    let filteredData = artifactsData;
    if (encyclopediaFilter !== 'All') {
      filteredData = filteredData.filter(c => c.department === encyclopediaFilter);
    }
    if (encyclopediaRarity !== 'All') {
      filteredData = filteredData.filter(c => c.rarity === encyclopediaRarity);
    }
    if (encyclopediaElement !== 'All') {
      filteredData = filteredData.filter(c => c.element === encyclopediaElement);
    }
    if (encyclopediaRole !== 'All') {
      filteredData = filteredData.filter(c => c.role.toLowerCase() === encyclopediaRole.toLowerCase());
    }
    if (encyclopediaSearch.trim() !== '') {
      filteredData = filteredData.filter(c => c.title.toLowerCase().includes(encyclopediaSearch.toLowerCase()));
    }

    const itemsPerPage = 20;
    const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
    const startIndex = encyclopediaPage * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const departments = ['All', ...new Set(artifactsData.map(c => c.department))];

    return (
      <div className="view-container shop-view">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ color: 'var(--primary)', margin: 0 }}>Museum Encyclopedia</h2>
          <button className="btn-impeccable secondary" onClick={() => { playClick(); setView('excavation'); }} style={{ padding: '5px 10px', fontSize: '0.9rem', marginBottom: 0 }}>Back</button>
        </div>

        <div className="panel-impeccable" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1, height: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--surface-border)', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: 'var(--primary)', width: `${(discoveredArtifacts.length / artifactsData.length) * 100}%` }}></div>
            </div>
            <div style={{ fontFamily: 'VT323', fontSize: '1.2rem', whiteSpace: 'nowrap' }}>
              {discoveredArtifacts.length} / {artifactsData.length}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            <input
              type="text"
              placeholder="Search artifact..."
              value={encyclopediaSearch}
              onChange={(e) => { setEncyclopediaSearch(e.target.value); setEncyclopediaPage(0); }}
              className="rpg-input"
              style={{ gridColumn: '1 / -1' }}
            />

            <div className="rpg-custom-select-container">
              <div className="rpg-custom-select-header" onClick={() => setOpenDropdown(openDropdown === 'rarity' ? null : 'rarity')}>
                <span style={{ color: encyclopediaRarity === 'All' ? 'var(--primary)' : `var(--rarity-${encyclopediaRarity.toLowerCase()})` }}>{encyclopediaRarity === 'All' ? 'Rarity' : encyclopediaRarity}</span>
                <span style={{ fontSize: '0.8rem' }}>{openDropdown === 'rarity' ? '▲' : '▼'}</span>
              </div>
              {openDropdown === 'rarity' && (
                <div className="rpg-custom-select-list">
                  {['All', 'Common', 'Rare', 'Epic', 'Legendary'].map(r => (
                    <div key={r} className={`rpg-custom-select-item ${encyclopediaRarity === r ? 'selected' : ''}`}
                      onClick={() => { playClick(); setEncyclopediaRarity(r); setEncyclopediaPage(0); setOpenDropdown(null); }}
                      style={{ color: r === 'All' ? '#fff' : `var(--rarity-${r.toLowerCase()})` }}>
                      {r}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rpg-custom-select-container">
              <div className="rpg-custom-select-header" onClick={() => setOpenDropdown(openDropdown === 'element' ? null : 'element')}>
                <span>{encyclopediaElement === 'All' ? 'Element' : encyclopediaElement}</span>
                <span style={{ fontSize: '0.8rem' }}>{openDropdown === 'element' ? '▲' : '▼'}</span>
              </div>
              {openDropdown === 'element' && (
                <div className="rpg-custom-select-list">
                  {['All', 'Natura', 'Aura', 'Ignis', 'Aqua', 'Metallum'].map(el => (
                    <div key={el} className={`rpg-custom-select-item ${encyclopediaElement === el ? 'selected' : ''}`}
                      onClick={() => { playClick(); setEncyclopediaElement(el); setEncyclopediaPage(0); setOpenDropdown(null); }}>
                      {el}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rpg-custom-select-container">
              <div className="rpg-custom-select-header" onClick={() => setOpenDropdown(openDropdown === 'role' ? null : 'role')}>
                <span>{encyclopediaRole === 'All' ? 'Role' : encyclopediaRole}</span>
                <span style={{ fontSize: '0.8rem' }}>{openDropdown === 'role' ? '▲' : '▼'}</span>
              </div>
              {openDropdown === 'role' && (
                <div className="rpg-custom-select-list">
                  {['All', 'Weapon', 'Armor', 'Relic'].map(role => (
                    <div key={role} className={`rpg-custom-select-item ${encyclopediaRole === role ? 'selected' : ''}`}
                      onClick={() => { playClick(); setEncyclopediaRole(role); setEncyclopediaPage(0); setOpenDropdown(null); }}>
                      {role}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rpg-custom-select-container">
              <div className="rpg-custom-select-header" onClick={() => setOpenDropdown(openDropdown === 'dept' ? null : 'dept')}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{encyclopediaFilter === 'All' ? 'Origin' : encyclopediaFilter}</span>
                <span style={{ fontSize: '0.8rem' }}>{openDropdown === 'dept' ? '▲' : '▼'}</span>
              </div>
              {openDropdown === 'dept' && (
                <div className="rpg-custom-select-list">
                  {departments.map(d => (
                    <div key={d} className={`rpg-custom-select-item ${encyclopediaFilter === d ? 'selected' : ''}`}
                      onClick={() => { playClick(); setEncyclopediaFilter(d); setEncyclopediaPage(0); setOpenDropdown(null); }}>
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {paginatedData.length === 0 ? (
          <div className="panel-impeccable" style={{ textAlign: 'center', padding: '40px' }}>
            <h3 style={{ color: 'var(--text-muted)' }}>No artifacts found matching your search.</h3>
          </div>
        ) : (
          <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {paginatedData.map(card => {
              const isDiscovered = discoveredArtifacts.includes(card.id);
              return (
                <div key={card.id} className={`mini-card ${isDiscovered ? `rarity-${card.rarity.toLowerCase()}` : ''}`} style={{ borderColor: isDiscovered ? undefined : '#333' }}>
                  <div className="mini-card-img-wrapper" style={{ height: '140px', background: '#000', position: 'relative' }}>
                    <img
                      src={card.imageUrl}
                      alt={isDiscovered ? card.title : 'Unknown'}
                      loading="lazy"
                      style={{
                        filter: isDiscovered ? 'sepia(0.2) contrast(1.1) saturate(1.2)' : 'grayscale(1) brightness(0.4) blur(4px)',
                        transition: 'all 0.3s ease',
                        opacity: isDiscovered ? 1 : 0.6
                      }}
                    />
                    {!isDiscovered && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'rgba(255,255,255,0.4)', textShadow: '2px 2px 4px #000', pointerEvents: 'none' }}>?</div>
                    )}
                  </div>
                  <div className="mini-card-details" style={{ padding: '8px' }}>
                    <h4 style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isDiscovered ? '#fff' : '#666', margin: 0 }}>{isDiscovered ? card.title : 'Unknown Relic'}</h4>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
            <button className="btn-impeccable secondary" disabled={encyclopediaPage === 0} onClick={() => { playClick(); setEncyclopediaPage(p => Math.max(0, p - 1)); }}>&lt; Prev</button>
            <span style={{ fontFamily: 'VT323', fontSize: '1.2rem' }}>Page {encyclopediaPage + 1} of {totalPages}</span>
            <button className="btn-impeccable secondary" disabled={encyclopediaPage >= totalPages - 1} onClick={() => { playClick(); setEncyclopediaPage(p => Math.min(totalPages - 1, p + 1)); }}>Next &gt;</button>
          </div>
        )}
      </div>
    );
  };

  const renderAuthModal = () => {
    if (!authModalOpen) return null;
    return (
      <div className="auth-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-modal-content panel-impeccable" style={{ background: '#1a110f', padding: '30px', width: '90%', maxWidth: '400px', borderColor: '#8b5cf6', textAlign: 'center' }}>
          <h2 style={{ color: '#8b5cf6', margin: '0 0 20px 0', textShadow: '2px 2px 0 #000' }}>
            {authIsLogin ? 'LOGIN REQUIRED' : 'REGISTER ALIAS'}
          </h2>
          <p style={{ color: '#a78bfa', marginBottom: '20px', fontSize: '0.9rem' }}>
            Join the network to access Leaderboards and The Black Market.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
            {!authIsLogin && (
              <input
                type="text"
                placeholder="Player Alias (e.g. dailycisea)"
                value={leaderboardName}
                onChange={e => setLeaderboardName(e.target.value)}
                className="rpg-input"
                style={{ borderColor: '#8b5cf6', textAlign: 'center' }}
              />
            )}
            <input
              type="email"
              placeholder="Email Address"
              value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              className="rpg-input"
              style={{ borderColor: '#8b5cf6', textAlign: 'center' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              className="rpg-input"
              style={{ borderColor: '#8b5cf6', textAlign: 'center' }}
            />
          </div>

          <button className="btn-impeccable primary" style={{ width: '100%', marginBottom: '15px' }} onClick={handleAuth} disabled={authLoading}>
            {authLoading ? 'CONNECTING...' : (authIsLogin ? 'LOGIN' : 'REGISTER')}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
            <button className="btn-impeccable secondary" onClick={() => setAuthModalOpen(false)} style={{ padding: '10px 15px' }}>CANCEL</button>
            <button className="btn-impeccable" onClick={() => setAuthIsLogin(!authIsLogin)} style={{ padding: '10px 15px', background: 'transparent', color: '#a78bfa', borderColor: 'transparent' }}>
              {authIsLogin ? 'Create Account' : 'Already registered?'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTabBar = () => {
    if (view === 'arena_combat') return null;
    return (
      <div className="bottom-tab-bar">
        <div className={`tab-item ${view === 'grand_hall' ? 'active' : ''}`} onClick={() => { playClick(); setView('grand_hall'); }}>
          <img src="/icons/grand_hall.png" alt="Grand Hall" className="tab-icon" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <span className="tab-text">Grand Hall</span>
        </div>
        <div className={`tab-item ${view === 'excavation' ? 'active' : ''}`} onClick={() => { playClick(); setView('excavation'); }}>
          <img src="/icons/excavation.png" alt="Excavation" className="tab-icon" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <span className="tab-text">Excavation</span>
        </div>
        <div className={`tab-item ${view === 'vault' ? 'active' : ''}`} onClick={() => { playClick(); setView('vault'); }}>
          <img src="/icons/vault.png" alt="Vault" className="tab-icon" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <span className="tab-text">The Vault</span>
        </div>
        <div className={`tab-item ${view === 'skill_tree' ? 'active' : ''}`} onClick={() => { playClick(); setView('skill_tree'); }}>
          <div style={{ fontSize: '32px' }}>{InsightIcon}</div>
          <span className="tab-text">Research</span>
        </div>
        <div className={`tab-item arena-action-btn ${view === 'arena_combat' ? 'active' : ''}`} onClick={() => {
          playClick();
          if (!battleState.active || battleState.turn === 'gameover') {
            startBattle();
          } else {
            setView('arena_combat');
          }
        }}>
          <img src="/icons/arena.png" alt="Arena" className="tab-icon" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <span className="arena-btn-text">ENTER ARENA</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`app-container ${shakeScreen ? 'shake-active' : ''}`}>
      {renderDailyModal()}
      {renderLevelUpModal()}
      {renderWipeModal()}
      {renderAriaGuide()}
      {toast && (
        <div className={`toast-notification glass toast-${toast.type}`}>
          <span className="toast-icon">⚠️</span>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}

      {view !== 'arena_combat' && view !== 'campaign_map' && (
        <>
          <button className="guide-floating-btn" onClick={() => { playClick(); setShowGuide(true); }}>
            <img src="/aria.png" alt="Guide" />
          </button>
          <header className="global-hud" style={{ position: 'sticky', top: 0, zIndex: 100, padding: '10px 15px', border: 'none', borderRadius: 0, background: 'none', boxShadow: 'none' }}>
            <div className="stone-panel" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '30px', height: '30px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000' }}>L{playerLevel}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Curator</div>
                <div style={{ width: '60px', height: '6px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--surface-border)', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: '#3b82f6', width: `${Math.min(100, (playerExp / (playerLevel * 100)) * 100)}%` }}></div>
                </div>
              </div>
            </div>

            <div className="top-nav-center stone-panel">
              <div className="stat-pill">
                <span className="stat-icon" style={{ color: '#fbbf24' }}>{CoinIcon}</span>
                <span className="stat-value">{coins.toLocaleString()}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-icon" style={{ color: '#a78bfa' }}>{InsightIcon}</span>
                <span className="stat-value">{playerInsight.toLocaleString()}</span>
              </div>
            </div>

            <div className="stone-panel" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button onClick={() => setIsAudioMuted(toggleMute())} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }} title={isAudioMuted ? "Unmute Audio" : "Mute Audio"}>
                {isAudioMuted ? <img src="/icons/sound_off_icon.png?v=3" alt="Muted" style={{ width: '1em', height: '1em', verticalAlign: 'text-bottom' }} /> : <img src="/icons/sound_on_icon.png?v=3" alt="Audio On" style={{ width: '1em', height: '1em', verticalAlign: 'text-bottom' }} />}
              </button>
              <button onClick={() => { playClick(); setView('profile'); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', filter: 'drop-shadow(0 0 5px var(--primary))', padding: 0 }} title="Curator Profile">{ProfileIcon}</button>
            </div>
          </header>
        </>
      )}

      <main className="main-content">
        {renderAriaGuide()}
        {renderPreBattleLore()}
        {view === 'campaign_map' && renderCampaignMap()}
        {view === 'grand_hall' && renderGrandHall()}
        {view === 'excavation' && renderExcavation()}
        {view === 'encyclopedia' && renderEncyclopedia()}
        {view === 'syndicate_intro' && renderSyndicateIntro()}
        {view === 'syndicate_lobby' && renderSyndicateLobby()}
        {view === 'leaderboard' && renderLeaderboard()}
        {view === 'credits' && renderCredits()}
        {view === 'vault' && renderVault()}
        {view === 'skill_tree' && renderSkillTree()}
        {view === 'arena_combat' && renderArenaCombat()}
        {view === 'profile' && renderProfile()}
      </main>

      {renderAuthModal()}
      {renderTabBar()}
    </div>
  );
}

export default App;
