import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ScoreHeader } from './components/ScoreHeader';
import { LevelProgressBar } from './components/LevelProgressBar';
import { AccountLevelUpModal } from './components/AccountLevelUpModal';
import { OfflineModal } from './components/OfflineModal';
import { DailyCheckInModal } from './components/DailyCheckInModal';
import { SkinsModal } from './components/SkinsModal';
import { ScratchCardModal } from './components/ScratchCardModal';
import { TapCoin } from './components/TapCoin';
import { EnergyBar } from './components/EnergyBar';
import { UpgradesTab, calculateAccountLevel } from './components/UpgradesTab';
import { PetsTab, PET_DEFINITIONS, getPetEvolutionInfo } from './components/PetsTab';
import { TasksTab } from './components/TasksTab';
import { FriendsTab } from './components/FriendsTab';
import { NavBar } from './components/NavBar';
import { Palette, Gift, Trophy } from 'lucide-react';
import { initTelegramApp, triggerHaptic, getTelegramUserInfo, getReferralCode } from './utils/telegram';
import { soundEngine } from './utils/audio';
import { getLevelInfo, calculateRank } from './utils/levels';
import { calculateOfflineIncome, getStreakStatus } from './utils/retention';
import { getScratchCooldown, getScratchConfig } from './utils/scratch';
import { COIN_SKINS } from './utils/skins';
import { supabase } from './supabase';
import { TelegramAccessDenied } from './components/TelegramAccessDenied';
import { DevPanel, handleResetPlayerState } from './components/DevPanel';

export const MAX_BASE_TAP_POWER = 1000;

export default function App() {
  // 1. Dual-Currency & Item State Architecture
  const [score, setScore] = useState(0);
  const [lifetimeScore, setLifetimeScore] = useState(0);
  const [diamonds, setDiamonds] = useState(50);
  const [petUpgradeCards, setPetUpgradeCards] = useState(5);
  const [ownedPets, setOwnedPets] = useState([]);
  const [unclaimedReferralRewards, setUnclaimedReferralRewards] = useState(0);
  const [energy, setEnergy] = useState(500);
  const [baseMaxEnergy, setBaseMaxEnergy] = useState(500);
  const [lastClaimedTimestamp, setLastClaimedTimestamp] = useState(Date.now());
  const [lastScratchTimestamp, setLastScratchTimestamp] = useState(null);
  const [dailyCardsBoughtCount, setDailyCardsBoughtCount] = useState(0);
  const [userUpgrades, setUserUpgrades] = useState({});
  const [petLevels, setPetLevels] = useState({});
  const [isComboClaimed, setIsComboClaimed] = useState(false);
  const [dailyComboState, setDailyComboState] = useState(() => {
    try {
      const saved = localStorage.getItem('tg_daily_combo_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return { lastClaimDate: null, claimedAmount: 0 };
  });
  const [streakData, setStreakData] = useState({ currentStreak: 1, lastCheckIn: null });
  const [offlineEarnings, setOfflineEarnings] = useState(null);
  const [isOfflineBotActive, setIsOfflineBotActive] = useState(() => localStorage.getItem('tg_offline_bot_active') === 'true');
  const [botExpiryTime, setBotExpiryTime] = useState(() => {
    const saved = localStorage.getItem('tg_bot_expiry_time');
    return saved ? Number(saved) : null;
  });

  // Upgraded Frenzy Mode State (30 Taps = 100% Fill)
  const MAX_FRENZY_POINTS = 30;
  const [frenzyPoints, setFrenzyPoints] = useState(0);
  const [frenzyActive, setFrenzyActive] = useState(false);
  const [isFrenzyCoolingDown, setIsFrenzyCoolingDown] = useState(false);
  const [frenzyCooldownUntil, setFrenzyCooldownUntil] = useState(null);
  const [frenzySecondsLeft, setFrenzySecondsLeft] = useState(10);
  const [frenzyComboCount, setFrenzyComboCount] = useState(0);
  const [tapsPerSec, setTapsPerSec] = useState(0);
  const tapTimesRef = useRef([]);
  const lastTapTimeRef = useRef(Date.now());

  // Modals & Non-Blocking Toasts State
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showSkinsModal, setShowSkinsModal] = useState(false);
  const [showScratchModal, setShowScratchModal] = useState(false);
  const [activeSkinId, setActiveSkinId] = useState('classic_gold');
  const [accountLevelUpData, setAccountLevelUpData] = useState(null);
  const [rankToast, setRankToast] = useState(null);

  const [isPopping, setIsPopping] = useState(false);
  const [isLowEnergy, setIsLowEnergy] = useState(false);
  const [particles, setParticles] = useState([]);
  const [activeTab, setActiveTab] = useState('earn');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [turboActive, setTurboActive] = useState(false);
  const [combo, setCombo] = useState(1);
  const [userProfile, setUserProfile] = useState(null);
  const [welcomeBonusBanner, setWelcomeBonusBanner] = useState(false);
  const [debugLog, setDebugLog] = useState('Initializing...');
  const [showDevPanel, setShowDevPanel] = useState(false);
  const prevLevelRef = useRef(null);

  // Studio Attribute Level Upgrades
  const tapPowerBonus = (userUpgrades['tap_power'] || 0) * 1;
  const energyCapBonus = (userUpgrades['energy_limit'] || 0) * 50;
  const rechargeSpeedLevel = userUpgrades['recharge_speed'] || 0;

  const maxEnergy = baseMaxEnergy + energyCapBonus;

  // Creator Account Level = 1 + totalUpgradesPurchased (Fresh reset user starts at Level 1)
  const creatorLevel = useMemo(() => {
    const tapLvl = (userUpgrades['tap_power'] || 0) + 1;
    const energyLvl = (userUpgrades['energy_limit'] || 0) + 1;
    const rechargeLvl = (userUpgrades['recharge_speed'] || 0) + 1;
    return calculateAccountLevel(tapLvl, energyLvl, rechargeLvl);
  }, [userUpgrades]);

  // Compute Total Pet Bonus Multiplier % for Owned Pets (with Evolution Stage Multipliers)
  const totalPetBonusPercent = useMemo(() => {
    return PET_DEFINITIONS.reduce((acc, pet) => {
      if (!ownedPets.includes(pet.id)) return acc;
      const level = petLevels[pet.id] || 1;
      const evo = getPetEvolutionInfo(level);
      return acc + level * pet.bonusPerLevel * (evo.isEvolved ? evo.multiplier : 1);
    }, 0);
  }, [ownedPets, petLevels]);

  // 1. Unified Tap Calculation Helper & Dynamic Frenzy Multiplier
  const frenzyMultiplier = useMemo(() => {
    if (!frenzyActive) return 1;
    if (tapsPerSec >= 9) return 5;
    if (tapsPerSec >= 5) return 3;
    return 2;
  }, [frenzyActive, tapsPerSec]);

  // Safe Cooldown Verification Guard & Frenzy Percentage
  const isCoolingDown = useMemo(() => {
    if (isFrenzyCoolingDown) return true;
    return frenzyCooldownUntil ? Date.now() < frenzyCooldownUntil : false;
  }, [isFrenzyCoolingDown, frenzyCooldownUntil]);

  const frenzyPercentage = useMemo(() => {
    if (isCoolingDown) return 0;
    if (frenzyActive) {
      return Math.min(100, Math.max(0, Math.floor((frenzySecondsLeft / 10) * 100)));
    }
    return Math.min(100, Math.floor((frenzyPoints / MAX_FRENZY_POINTS) * 100));
  }, [isCoolingDown, frenzyActive, frenzySecondsLeft, frenzyPoints]);

  const activeSkinObj = useMemo(() => {
    return COIN_SKINS.find((s) => s.id === activeSkinId) || COIN_SKINS[0];
  }, [activeSkinId]);

  const getEffectiveTapPower = useCallback(() => {
    const base = Math.min(Math.floor(1 * Math.pow(1.15, Math.max(0, creatorLevel - 1))) + tapPowerBonus, MAX_BASE_TAP_POWER);
    const skinMultiplier = (activeSkinId && activeSkinId !== 'classic_gold') ? (activeSkinObj?.multiplier || 1) : 1;
    const petMultiplier = (ownedPets && ownedPets.length > 0) ? (1 + (totalPetBonusPercent / 100)) : 1;
    const frenzyBoost = frenzyActive ? frenzyMultiplier : 1;
    const turboBoost = turboActive ? 2 : 1;

    return Math.floor(base * skinMultiplier * petMultiplier * frenzyBoost * turboBoost);
  }, [creatorLevel, tapPowerBonus, activeSkinId, activeSkinObj, ownedPets, totalPetBonusPercent, frenzyActive, frenzyMultiplier, turboActive]);

  // Define effectiveTapPower BEFORE any useEffect hooks, handlers, or JSX elements!
  const effectiveTapPower = useMemo(() => Math.max(1, getEffectiveTapPower()), [getEffectiveTapPower]);

  // Cyber Cat Rare Pet Perk: Background Auto-Tap Interval (+2 taps/sec * evolution multiplier)
  useEffect(() => {
    const isCyberCatOwned = ownedPets.includes('cyber_cat');
    if (!isCyberCatOwned) return;

    const catLevel = petLevels['cyber_cat'] || 1;
    const evo = getPetEvolutionInfo(catLevel);
    const tapsPerSecAuto = Math.floor(2 * (evo.isEvolved ? evo.multiplier : 1));

    const interval = setInterval(() => {
      const autoCoins = Math.max(1, Math.floor(effectiveTapPower * 0.25 * tapsPerSecAuto));
      setScore((s) => s + autoCoins);
      setLifetimeScore((ls) => ls + autoCoins);
    }, 1000);

    return () => clearInterval(interval);
  }, [ownedPets, petLevels, effectiveTapPower]);

  // Shift + D shortcut listener to toggle Developer Admin Panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setShowDevPanel((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Detection Check for Telegram-Only Access
  const isTelegramAccessAllowed = useMemo(() => {
    if (import.meta.env.DEV) return true; // Development bypass for local testing
    const initData = window.Telegram?.WebApp?.initData;
    return Boolean(initData && initData.trim().length > 0);
  }, []);

  // Initialize Telegram WebApp SDK, load retention state & sync user
  useEffect(() => {
    if (!isTelegramAccessAllowed) return;
    initTelegramApp();

    const userInfo = getTelegramUserInfo();
    const referredBy = getReferralCode();
    setUserProfile(userInfo);

    // Load local storage
    const savedLastClaim = localStorage.getItem('tg_last_claimed') || Date.now();
    const savedLastScratch = Number(localStorage.getItem('tg_last_scratch')) || null;
    const savedUpgrades = JSON.parse(localStorage.getItem('tg_upgrades') || '{}');
    const savedPets = JSON.parse(localStorage.getItem('tg_pet_levels') || '{}');
    const savedOwnedPets = JSON.parse(localStorage.getItem('tg_owned_pets') || '[]');
    const savedDiamonds = Number(localStorage.getItem('tg_diamonds')) || 50;
    const savedCards = Number(localStorage.getItem('tg_pet_upgrade_cards')) || 5;
    const savedStreak = JSON.parse(localStorage.getItem('tg_streak') || '{"currentStreak":1,"lastCheckIn":null}');
    const savedComboClaimed = localStorage.getItem('tg_combo_claimed') === 'true';
    const savedSkin = localStorage.getItem('tg_active_skin') || 'classic_gold';
    const savedBoughtCount = Number(localStorage.getItem('tg_scratch_bought_count')) || 0;

    // Check if 24-hour scratch cooldown passed to reset bought count
    const cooldownInfo = getScratchCooldown(savedLastScratch);
    if (!cooldownInfo.onCooldown) {
      setDailyCardsBoughtCount(0);
      localStorage.setItem('tg_scratch_bought_count', '0');
    } else {
      setDailyCardsBoughtCount(savedBoughtCount);
    }

    setUserUpgrades(savedUpgrades);
    setPetLevels(savedPets);
    setOwnedPets(savedOwnedPets);
    setDiamonds(savedDiamonds);
    setPetUpgradeCards(savedCards);
    setStreakData(savedStreak);
    setIsComboClaimed(savedComboClaimed);
    setActiveSkinId(savedSkin);
    setLastScratchTimestamp(savedLastScratch);

    // Calculate offline passive income
    const offlineResult = calculateOfflineIncome(1000, Number(savedLastClaim));
    if (offlineResult.earned > 0) {
      setOfflineEarnings(offlineResult);
    }
    setLastClaimedTimestamp(Date.now());
    localStorage.setItem('tg_last_claimed', Date.now().toString());

    // Auto-Popup Modal check
    const streakStatus = getStreakStatus(savedStreak.lastCheckIn, savedStreak.currentStreak);
    if (streakStatus.canCheckIn) {
      setTimeout(() => setShowDailyModal(true), 600);
    }

    // Safely extract Telegram user data with fallback for desktop Chrome
    const tg = window.Telegram?.WebApp;
    const tgExists = Boolean(tg);
    if (tg) {
      tg.ready();
      tg.expand();
    }
    const user = tg?.initDataUnsafe?.user;

    const telegramId = String(user?.id || 12345678);
    const username = user?.username || user?.first_name || 'demo_user';
    const firstName = user?.first_name || 'Demo';

    setDebugLog(`TG WebApp Exists: ${tgExists} | User ID: ${telegramId} | Username: ${username}`);

    // Supabase Load / Register Player on Initial Mount
    if (supabase) {
      supabase
        .from('players')
        .select('*')
        .eq('telegram_id', telegramId)
        .maybeSingle()
        .then(async ({ data: existingPlayer, error }) => {
          if (error) {
            setDebugLog(`SUPABASE ERROR: ${error.message}`);
            return;
          }

          if (!existingPlayer) {
            setDebugLog(`Registering New Player Profile: ID ${telegramId} (@${username})...`);
            const initialRankInfo = getLevelInfo(0);

            const initialProfileDefaults = {
              id: telegramId,
              telegram_id: telegramId,
              username: username,
              first_name: firstName,
              coins: 0,
              total_coins: 0,
              lifetime_score: 0,
              pet_cards: 0,
              diamonds: 0,
              rank_level: 1,
              rank_name: 'Bronze',
              account_level: 1,
              tap_level: 1,
              energy_level: 1,
              recharge_level: 1,
              tap_power_level: 1,
              energy_capacity_level: 1,
              recharge_speed_level: 1,
              pets: {},
              equipped_skin: 'classic_gold',
              scratches_today: 0,
              energy: 500,
              max_energy: 500,
              last_active: new Date().toISOString(),
            };

            // User does not exist in database, insert starting defaults!
            const { data: newPlayer, error: insertError } = await supabase
              .from('players')
              .insert([initialProfileDefaults])
              .select()
              .single();

            try {
              await supabase
                .from('profiles')
                .upsert([initialProfileDefaults], { onConflict: 'id' });
            } catch (e) {}

            if (insertError) {
              setDebugLog(`SUPABASE ERROR: ${insertError.message}`);
            } else if (newPlayer) {
              const tapPowerLvl = newPlayer.tap_level || newPlayer.tap_power_level || 1;
              const energyCapLvl = newPlayer.energy_level || newPlayer.energy_capacity_level || 1;
              const rechargeSpdLvl = newPlayer.recharge_level || newPlayer.recharge_speed_level || 1;
              const calculatedStudioLevel = 1 + (tapPowerLvl - 1) + (energyCapLvl - 1) + (rechargeSpdLvl - 1);
              setDebugLog(`Player Registered: ID ${telegramId} (@${username}) | Studio Lvl: ${calculatedStudioLevel}`);

              setScore(newPlayer.coins ?? 0);
              setLifetimeScore(newPlayer.total_coins ?? newPlayer.lifetime_score ?? 0);
              setPetUpgradeCards(newPlayer.pet_cards ?? 0);
              setDiamonds(newPlayer.diamonds ?? 0);
              setActiveSkinId(newPlayer.equipped_skin || 'classic_gold');
              setEnergy(newPlayer.energy ?? 500);
              setUserUpgrades((prev) => ({
                ...prev,
                tap_power: Math.max(0, tapPowerLvl - 1),
                energy_limit: Math.max(0, energyCapLvl - 1),
                recharge_speed: Math.max(0, rechargeSpdLvl - 1),
              }));
            }
          } else {
            // Null-safe Fallback Handling for existing user fields
            const tapPowerLvl = existingPlayer.tap_level || existingPlayer.tap_power_level || 1;
            const energyCapLvl = existingPlayer.energy_level || existingPlayer.energy_capacity_level || (existingPlayer.max_energy ? Math.max(1, Math.floor((existingPlayer.max_energy - 500) / 50) + 1) : 1);
            const rechargeSpdLvl = existingPlayer.recharge_level || existingPlayer.recharge_speed_level || 1;
            const calculatedStudioLevel = existingPlayer.account_level || (1 + (tapPowerLvl - 1) + (energyCapLvl - 1) + (rechargeSpdLvl - 1));

            const fetchedCoins = Number(existingPlayer.coins) || 0;
            const rawLifetime = Math.max(
              Number(existingPlayer.lifetime_score) || 0,
              Number(existingPlayer.total_coins) || 0,
              fetchedCoins
            );

            const dbRankLevel = existingPlayer.rank_level;
            const dbRankName = existingPlayer.rank_name;
            const fetchedRankInfo = calculateRank(rawLifetime, dbRankLevel, dbRankName);
            const activeRankLevel = fetchedRankInfo.level;
            const activeRankName = fetchedRankInfo.name;
            const loadedTotalCoins = Math.max(rawLifetime, fetchedRankInfo.minScore);

            setDebugLog(`Loaded Player: ID ${telegramId} (@${username}) | Rank: ${activeRankName} (Lvl ${activeRankLevel}) | Studio Lvl: ${calculatedStudioLevel} | Coins: ${fetchedCoins}`);

            setScore(fetchedCoins);
            setLifetimeScore(loadedTotalCoins);

            setActiveSkinId(existingPlayer.equipped_skin || 'classic_gold');
            localStorage.setItem('tg_active_skin', existingPlayer.equipped_skin || 'classic_gold');

            const loadedCards = Math.max(0, Number(existingPlayer.pet_cards) ?? 0);
            setPetUpgradeCards(loadedCards);
            localStorage.setItem('tg_pet_upgrade_cards', loadedCards.toString());

            if (existingPlayer.diamonds !== undefined && existingPlayer.diamonds !== null) {
              setDiamonds(Math.max(0, Number(existingPlayer.diamonds) || 0));
            }

            if (existingPlayer.is_bot_active !== undefined && existingPlayer.is_bot_active !== null) {
              setIsOfflineBotActive(Boolean(existingPlayer.is_bot_active));
              localStorage.setItem('tg_offline_bot_active', String(existingPlayer.is_bot_active));
            }

            if (existingPlayer.energy !== undefined && existingPlayer.energy !== null) {
              setEnergy(existingPlayer.energy);
            }
            setUserUpgrades((prev) => ({
              ...prev,
              tap_power: Math.max(0, tapPowerLvl - 1),
              energy_limit: Math.max(0, energyCapLvl - 1),
              recharge_speed: Math.max(0, rechargeSpdLvl - 1),
            }));
          }
        })
        .catch((err) => {
          setDebugLog(`SUPABASE ERROR: ${err?.message || String(err)}`);
        });

      // Fetch user pets from Supabase player_pets table on mount
      supabase
        .from('player_pets')
        .select('*')
        .eq('telegram_id', telegramId)
        .then(({ data: userPets, error: petErr }) => {
          if (!petErr && userPets && userPets.length > 0) {
            const fetchedOwnedPets = [];
            const fetchedPetLevels = {};
            userPets.forEach((petRow) => {
              if (petRow.pet_id) {
                const normalizedId = petRow.pet_id === 'shiba_inu' ? 'shiba_dog' : petRow.pet_id;
                fetchedOwnedPets.push(normalizedId);
                fetchedPetLevels[normalizedId] = petRow.pet_level || 1;
              }
            });
            setOwnedPets((prev) => Array.from(new Set([...prev, ...fetchedOwnedPets])));
            setPetLevels((prev) => ({ ...prev, ...fetchedPetLevels }));
          }
        })
        .catch((err) => console.error('player_pets fetch error:', err));
    } else {
      setDebugLog((prev) => `${prev} | Supabase Client: Missing env keys`);
    }

    // Sync with backend API
    fetch('/api/sync-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: userInfo.telegramId,
        username: userInfo.username,
        firstName: userInfo.firstName,
        referredBy: referredBy,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setScore(data.user.score || 0);
          setLifetimeScore(data.user.lifetimeScore || data.user.score || 0);
          if (data.user.diamonds !== undefined) setDiamonds(data.user.diamonds);
          if (data.user.petUpgradeCards !== undefined) setPetUpgradeCards(data.user.petUpgradeCards);
          setUnclaimedReferralRewards(data.user.unclaimedReferralRewards || 0);
          if (data.bonusAwarded) {
            setWelcomeBonusBanner(true);
            triggerHaptic('success');
            soundEngine.playBoostSound();
            setTimeout(() => setWelcomeBonusBanner(false), 6000);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Dedicated helper to upsert player pet data to Supabase player_pets table
  const syncPetToSupabase = useCallback(async (petId, level = 1, cards = 0) => {
    if (!isTelegramAccessAllowed || !supabase) return;

    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    const telegramId = String(user?.id || userProfile?.telegramId || 12345678);

    try {
      const { data, error } = await supabase
        .from('player_pets')
        .upsert({
          telegram_id: telegramId,
          pet_id: petId,
          pet_level: level,
          pet_cards: cards,
          is_equipped: true,
        }, { onConflict: 'telegram_id,pet_id' })
        .select();

      if (error) {
        console.error(`SUPABASE PET SAVE FAILED (${petId}):`, error.message);
      } else {
        console.log(`SUPABASE PET SAVE SUCCESSFUL: ${petId} (Lvl ${level})`, data);
      }
    } catch (err) {
      console.error(`SUPABASE PET SAVE EXCEPTION (${petId}):`, err);
    }
  }, [isTelegramAccessAllowed, userProfile]);

  // Dedicated helper to save player data directly to Supabase via UPDATE / UPSERT
  const syncToSupabase = useCallback(async (overrides = {}) => {
    if (!isTelegramAccessAllowed || !supabase) return;

    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    const telegramId = String(user?.id || userProfile?.telegramId || 12345678);
    const username = user?.username || user?.first_name || userProfile?.username || 'demo_user';
    const firstName = user?.first_name || userProfile?.firstName || 'Demo';

    const currentUpgrades = overrides.userUpgrades || userUpgrades;
    const currentScore = overrides.score !== undefined ? overrides.score : score;
    const currentEnergy = overrides.energy !== undefined ? overrides.energy : energy;
    const equippedSkin = overrides.equipped_skin || activeSkinId || 'classic_gold';

    const safeTotalCoins = Math.max(
      lifetimeScore,
      score,
      currentScore,
      overrides.lifetimeScore !== undefined ? overrides.lifetimeScore : 0
    );

    const tapPowerLevel = (currentUpgrades['tap_power'] || 0) + 1;
    const energyCapacityLevel = (currentUpgrades['energy_limit'] || 0) + 1;
    const rechargeSpeedLevel = (currentUpgrades['recharge_speed'] || 0) + 1;
    const calculatedStudioLevel = overrides.account_level || (1 + (currentUpgrades['tap_power'] || 0) + (currentUpgrades['energy_limit'] || 0) + (currentUpgrades['recharge_speed'] || 0));
    const calculatedMaxEnergy = baseMaxEnergy + ((currentUpgrades['energy_limit'] || 0) * 50);

    const rankInfo = calculateRank(safeTotalCoins, overrides.rank_level, overrides.rank_name);
    const rankLevel = overrides.rank_level || rankInfo.level;
    const rankName = overrides.rank_name || rankInfo.name;

    const currentPetCards = overrides.pet_cards !== undefined ? overrides.pet_cards : petUpgradeCards;

    const payload = {
      telegram_id: telegramId,
      username: username,
      first_name: firstName,
      coins: Math.floor(currentScore),
      total_coins: Math.floor(safeTotalCoins),
      lifetime_score: Math.floor(safeTotalCoins),
      account_level: calculatedStudioLevel,
      rank_level: rankLevel,
      rank_name: rankName,
      equipped_skin: equippedSkin,
      pet_cards: currentPetCards,
      is_bot_active: isOfflineBotActive,
      tap_level: tapPowerLevel,
      energy_level: energyCapacityLevel,
      recharge_level: rechargeSpeedLevel,
      energy: currentEnergy,
      max_energy: calculatedMaxEnergy,
      last_active: new Date().toISOString(),
    };

    try {
      let { data, error } = await supabase
        .from('players')
        .upsert(payload, { onConflict: 'telegram_id' })
        .select();

      // Missing column fallback handler for table schema resilience
      if (error && error.message && error.message.toLowerCase().includes('column')) {
        const fallbackPayload = { ...payload };
        delete fallbackPayload.total_coins;
        delete fallbackPayload.equipped_skin;
        delete fallbackPayload.pet_cards;
        delete fallbackPayload.is_bot_active;
        const retry = await supabase
          .from('players')
          .upsert(fallbackPayload, { onConflict: 'telegram_id' })
          .select();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error("SUPABASE SAVE FAILED:", error.message);
        setDebugLog(`SUPABASE SAVE FAILED: ${error.message}`);
      } else {
        console.log("SUPABASE SAVE SUCCESSFUL!", data);
        setDebugLog(`SUPABASE SAVE SUCCESSFUL! ID ${telegramId} (@${username}) | Rank: ${rankName} (Lvl ${rankLevel}) | Studio Lvl: ${calculatedStudioLevel} | Coins: ${Math.floor(currentScore)}`);
      }
    } catch (err) {
      console.error("SUPABASE SAVE FAILED:", err);
      setDebugLog(`SUPABASE SAVE FAILED: ${err?.message || String(err)}`);
    }
  }, [isTelegramAccessAllowed, userProfile, userUpgrades, score, lifetimeScore, energy, baseMaxEnergy]);

  // 1-Second Debounced Auto-Sync to Database (triggers after tapping / score changes)
  useEffect(() => {
    if (!isTelegramAccessAllowed || !supabase) return;

    const syncTimer = setTimeout(() => {
      syncToSupabase();
    }, 1000);

    return () => clearTimeout(syncTimer);
  }, [score, userUpgrades, energy, syncToSupabase, isTelegramAccessAllowed]);

  // Flush sync immediately when page loses focus or hides
  useEffect(() => {
    if (!isTelegramAccessAllowed || !supabase) return;

    const handleFlushSync = () => {
      if (document.visibilityState === 'hidden') {
        syncToSupabase();
      }
    };

    document.addEventListener('visibilitychange', handleFlushSync);
    return () => document.removeEventListener('visibilitychange', handleFlushSync);
  }, [syncToSupabase, isTelegramAccessAllowed]);

  // Frenzy Mode 10-Second Active Timer & 5-Second Cooldown Trigger
  useEffect(() => {
    if (!frenzyActive) return;

    setFrenzySecondsLeft(10);
    setFrenzyComboCount(0);

    const timer = setInterval(() => {
      setFrenzySecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setFrenzyActive(false);
          setFrenzyPoints(0);
          setFrenzySecondsLeft(0);
          setIsFrenzyCoolingDown(true);
          setTimeout(() => {
            setIsFrenzyCoolingDown(false);
          }, 5000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [frenzyActive]);

  // Check if today's daily streak reward is unclaimed
  const canClaimDaily = useMemo(() => {
    return getStreakStatus(streakData.lastCheckIn, streakData.currentStreak).canCheckIn;
  }, [streakData]);

  // Rank Calculation Logic strictly on lifetimeScore
  const levelInfo = useMemo(() => getLevelInfo(Math.floor(lifetimeScore)), [lifetimeScore]);

  // Non-Blocking Floating Notification Toast for Rank Promotion & DB Rank Sync
  useEffect(() => {
    const currentTier = levelInfo.currentTier;
    if (prevLevelRef.current && prevLevelRef.current.level !== currentTier.level) {
      if (currentTier.level > prevLevelRef.current.level) {
        triggerHaptic('success');
        soundEngine.playBoostSound();
        setRankToast(`🎉 Rank Up! You reached ${currentTier.name}!`);
        setTimeout(() => setRankToast(null), 3500);

        // Explicitly update rank_level and rank_name in Supabase on rank promotion
        syncToSupabase({
          rank_level: currentTier.level,
          rank_name: currentTier.name,
        });
      }
    }
    prevLevelRef.current = currentTier;
  }, [levelInfo.currentTier, syncToSupabase]);

  // Sync score, diamonds & petUpgradeCards to backend
  useEffect(() => {
    if (!userProfile?.telegramId) return;

    const timer = setTimeout(() => {
      fetch('/api/update-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: userProfile.telegramId,
          score: Math.floor(score),
          lifetimeScore: Math.floor(lifetimeScore),
          diamonds: diamonds,
          petUpgradeCards: petUpgradeCards,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.unclaimedReferralRewards !== undefined) {
            setUnclaimedReferralRewards(data.unclaimedReferralRewards);
          }
        })
        .catch(() => {});
    }, 2000);

    return () => clearTimeout(timer);
  }, [score, lifetimeScore, diamonds, petUpgradeCards, userProfile]);

  // Dynamic Energy Recharge Rate
  useEffect(() => {
    const rechargeIntervalMs = Math.max(200, 800 - rechargeSpeedLevel * 90);
    const timer = setInterval(() => {
      setEnergy((prev) => Math.min(maxEnergy, prev + 1));
    }, rechargeIntervalMs);

    return () => clearInterval(timer);
  }, [maxEnergy, rechargeSpeedLevel]);

  // Combo decay timer
  useEffect(() => {
    if (combo > 1) {
      const resetCombo = setTimeout(() => {
        setCombo(1);
      }, 1000);
      return () => clearInterval(resetCombo);
    }
  }, [combo]);

  // Claim offline earnings modal
  const handleClaimOffline = useCallback(() => {
    if (offlineEarnings && offlineEarnings.earned > 0) {
      setScore((s) => s + offlineEarnings.earned);
      setLifetimeScore((ls) => ls + offlineEarnings.earned);
      setOfflineEarnings(null);
      localStorage.setItem('tg_last_claimed', Date.now().toString());
    }
  }, [offlineEarnings]);

  // Claim daily check-in streak (+2 Pet Cards bonus reward)
  const handleClaimCheckIn = useCallback((streakDay, rewardAmount) => {
    setScore((s) => s + rewardAmount);
    setLifetimeScore((ls) => ls + rewardAmount);
    setPetUpgradeCards((c) => {
      const nextC = c + 2;
      localStorage.setItem('tg_pet_upgrade_cards', nextC.toString());
      syncToSupabase({ pet_cards: nextC });
      return nextC;
    });
    const newStreakData = {
      currentStreak: streakDay,
      lastCheckIn: Date.now(),
    };
    setStreakData(newStreakData);
    localStorage.setItem('tg_streak', JSON.stringify(newStreakData));
  }, [syncToSupabase]);

  // Claim Fortune Scratch Multi-Resource Reward
  const handleClaimScratchReward = useCallback((prize) => {
    if (!prize) return;
    if (prize.coinAmount > 0) {
      setScore((s) => s + prize.coinAmount);
      setLifetimeScore((ls) => ls + prize.coinAmount);
    }
    if (prize.diamondAmount > 0) {
      setDiamonds((d) => {
        const updated = d + prize.diamondAmount;
        localStorage.setItem('tg_diamonds', updated.toString());
        return updated;
      });
    }
    if (prize.cardAmount > 0) {
      setPetUpgradeCards((c) => {
        const updated = c + prize.cardAmount;
        localStorage.setItem('tg_pet_upgrade_cards', updated.toString());
        return updated;
      });
    }

    setDailyCardsBoughtCount((prevCount) => {
      const newCount = prevCount + 1;
      localStorage.setItem('tg_scratch_bought_count', newCount.toString());

      const safeTotal = Math.max(lifetimeScore, score);
      const currentRankLevel = calculateRank(safeTotal).level;
      const rankConfig = getScratchConfig(currentRankLevel);

      // ONLY trigger 24h timer when player reaches maxDailyScratches!
      if (newCount >= rankConfig.maxScratches) {
        const now = Date.now();
        setLastScratchTimestamp(now);
        localStorage.setItem('tg_last_scratch', now.toString());
      }
      return newCount;
    });
  }, [lifetimeScore, score]);

  // Buy On-Demand Extra Scratch Card (50,000 * (scratchesToday + 1))
  const handleBuyExtraScratch = useCallback((cost) => {
    if (score < cost) return;
    setScore((s) => s - cost);
    // Clear 24h timer lockout so player can scratch extra card immediately!
    setLastScratchTimestamp(null);
    localStorage.removeItem('tg_last_scratch');
    triggerHaptic('success');
  }, [score]);

  // Claim Passive 5% Referral Commission
  const handleClaimReferralRewards = useCallback((claimedAmount) => {
    setScore((s) => s + claimedAmount);
    setLifetimeScore((ls) => ls + claimedAmount);
    setUnclaimedReferralRewards(0);
  }, []);

  // Select Coin Skin
  const handleSelectSkin = useCallback((skinId) => {
    setActiveSkinId(skinId);
    localStorage.setItem('tg_active_skin', skinId);
    syncToSupabase({ equipped_skin: skinId });
  }, [syncToSupabase]);

  // Account Level Up & Attribute Upgrade (Strict Balance Deduction, Instant Feedback & Immediate Supabase Sync)
  const handleUpgradeAttribute = useCallback((cardId, cost) => {
    if (score < cost) return;

    const currentLvl = userUpgrades[cardId] || 0;
    const updatedUpgrades = {
      ...userUpgrades,
      [cardId]: currentLvl + 1,
    };
    const updatedScore = score - cost;
    const updatedEnergy = cardId === 'energy_limit' ? energy + 50 : energy;

    setUserUpgrades(updatedUpgrades);
    localStorage.setItem('tg_upgrades', JSON.stringify(updatedUpgrades));
    setScore(updatedScore);
    if (cardId === 'energy_limit') {
      setEnergy(updatedEnergy);
    }

    // Immediately trigger Supabase sync on upgrade purchase!
    syncToSupabase({
      score: updatedScore,
      userUpgrades: updatedUpgrades,
      energy: updatedEnergy,
    });
  }, [score, userUpgrades, energy, syncToSupabase]);

  // Unlock Pet Options (Coins vs Diamonds)
  const handleUnlockPetWithCoins = useCallback((petId, coinCost) => {
    if (score < coinCost) return;

    const updatedOwned = Array.from(new Set([...ownedPets, petId]));
    setOwnedPets(updatedOwned);
    localStorage.setItem('tg_owned_pets', JSON.stringify(updatedOwned));
    const updatedScore = score - coinCost;
    setScore(updatedScore);

    // Upsert unlocked pet to Supabase player_pets table
    syncPetToSupabase(petId, 1, petUpgradeCards);
  }, [score, ownedPets, petUpgradeCards, syncPetToSupabase]);

  const handleUnlockPetWithDiamonds = useCallback((petId, diamondCost) => {
    if (diamonds < diamondCost) return;

    const updatedOwned = Array.from(new Set([...ownedPets, petId]));
    setOwnedPets(updatedOwned);
    localStorage.setItem('tg_owned_pets', JSON.stringify(updatedOwned));
    const updatedDiamonds = diamonds - diamondCost;
    setDiamonds(updatedDiamonds);
    localStorage.setItem('tg_diamonds', updatedDiamonds.toString());

    // Upsert unlocked pet to Supabase player_pets table
    syncPetToSupabase(petId, 1, petUpgradeCards);
  }, [diamonds, ownedPets, petUpgradeCards, syncPetToSupabase]);

  // Pet Level Upgrade Handler (Deducts both Coins AND Pet Cards, syncs to Supabase)
  const handleUpgradePet = useCallback((petId, coinCost, cardCost) => {
    if (score < coinCost || petUpgradeCards < cardCost) return;

    const currentLevel = petLevels[petId] || 1;
    const newLevel = currentLevel + 1;
    const updatedLevels = { ...petLevels, [petId]: newLevel };
    setPetLevels(updatedLevels);
    localStorage.setItem('tg_pet_levels', JSON.stringify(updatedLevels));

    // Deduct both currencies safely
    const updatedCards = Math.max(0, petUpgradeCards - cardCost);
    setPetUpgradeCards(updatedCards);
    localStorage.setItem('tg_pet_upgrade_cards', updatedCards.toString());

    const updatedScore = Math.max(0, score - coinCost);
    setScore(updatedScore);

    // Upsert leveled up pet to Supabase player_pets table and sync players row payload
    syncPetToSupabase(petId, newLevel, updatedCards);
    syncToSupabase({ pet_cards: updatedCards, coins: updatedScore });
  }, [score, petUpgradeCards, petLevels, syncPetToSupabase, syncToSupabase]);

  // Developer Cheat / Quick Action Handler (Adds coins to score & lifetimeScore, auto-saves to Supabase)
  const handleDevAddCoins = useCallback((amount) => {
    triggerHaptic('success');
    setScore((prevScore) => {
      const newScore = prevScore + amount;
      setLifetimeScore((prevLifetime) => {
        const newLifetime = Math.max(prevLifetime + amount, newScore);
        syncToSupabase({ score: newScore, lifetimeScore: newLifetime });
        return newLifetime;
      });
      return newScore;
    });
  }, [syncToSupabase]);

  // Fail-Safe Force Reset Player State Handler
  const handleResetPlayerState = useCallback(async () => {
    try {
      triggerHaptic('warning');

      // 1. Clear Local Browser Storage
      localStorage.clear();
      sessionStorage.clear();

      // 2. Initial Default Payload
      const freshDefaults = {
        coins: 0,
        total_coins: 0,
        lifetime_score: 0,
        pet_cards: 0,
        diamonds: 0,
        rank_level: 1,
        rank_name: 'Bronze',
        account_level: 1,
        tap_level: 1,
        energy_level: 1,
        recharge_level: 1,
        tap_power_level: 1,
        energy_capacity_level: 1,
        recharge_speed_level: 1,
        pets: {},
        equipped_skin: 'classic_gold',
        scratches_today: 0,
        last_scratch_time: null,
        energy: 500,
        max_energy: 500,
        is_bot_active: false,
      };

      // 3. Fallback to active user or localStorage stored ID
      const tg = window.Telegram?.WebApp;
      const user = tg?.initDataUnsafe?.user;
      const activeUserId = String(userProfile?.telegramId || user?.id || localStorage.getItem('supabase_user_id') || '12345678');

      if (supabase && activeUserId) {
        const { error: playersError } = await supabase
          .from('players')
          .update(freshDefaults)
          .eq('telegram_id', activeUserId);

        if (playersError) {
          console.error("Supabase Reset Error (players):", playersError.message);
        }

        try {
          await supabase
            .from('profiles')
            .update(freshDefaults)
            .eq('id', activeUserId);
        } catch (e) {}

        try {
          await supabase
            .from('player_pets')
            .delete()
            .eq('telegram_id', activeUserId);
        } catch (e) {}
      }

      // 4. Reset Local React State
      if (typeof setScore === 'function') setScore(0);
      if (typeof setLifetimeScore === 'function') setLifetimeScore(0);
      if (typeof setPetUpgradeCards === 'function') setPetUpgradeCards(0);
      if (typeof setDiamonds === 'function') setDiamonds(0);
      if (typeof setOwnedPets === 'function') setOwnedPets([]);
      if (typeof setUserUpgrades === 'function') setUserUpgrades({});
      if (typeof setPetLevels === 'function') setPetLevels({});
      if (typeof setDailyCardsBoughtCount === 'function') setDailyCardsBoughtCount(0);
      if (typeof setFrenzyActive === 'function') setFrenzyActive(false);
      if (typeof setFrenzyPoints === 'function') setFrenzyPoints(0);
      if (typeof setIsComboClaimed === 'function') setIsComboClaimed(false);
      if (typeof setStreakData === 'function') setStreakData({ currentStreak: 1, lastCheckIn: null });
      if (typeof setActiveSkinId === 'function') setActiveSkinId('classic_gold');
      if (typeof setIsOfflineBotActive === 'function') setIsOfflineBotActive(false);

      console.log("Player state successfully reset!");

      fetch('/api/reset-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: activeUserId }),
      }).catch(() => {});

      // 5. Force Hard Page Reload
      window.location.href = window.location.origin;
    } catch (err) {
      console.error("Reset execution failed:", err);
      window.location.reload();
    }
  }, [userProfile]);

  const handleResetDevData = handleResetPlayerState;

  // Dev Reset Scratch Limit Handler (Clears 24h timer & resets scratches back to 0)
  const handleResetScratchLimit = useCallback(() => {
    triggerHaptic('success');
    setDailyCardsBoughtCount(0);
    setLastScratchTimestamp(null);
    localStorage.setItem('tg_scratch_bought_count', '0');
    localStorage.removeItem('tg_last_scratch');
    soundEngine.playBoostSound();
  }, []);

  // Dev Reset Pet Cards to 0 & Force Save to Supabase
  const handleResetPetCardsToZero = useCallback(async () => {
    triggerHaptic('warning');
    setPetUpgradeCards(0);
    localStorage.setItem('tg_pet_upgrade_cards', '0');
    soundEngine.playBoostSound();

    if (isTelegramAccessAllowed && supabase) {
      const tg = window.Telegram?.WebApp;
      const user = tg?.initDataUnsafe?.user;
      const telegramId = String(user?.id || userProfile?.telegramId || 12345678);

      try {
        await supabase
          .from('players')
          .update({ pet_cards: 0 })
          .eq('telegram_id', telegramId);
      } catch (e) {
        console.error('Failed to force reset pet cards in Supabase:', e);
      }
    }
  }, [isTelegramAccessAllowed, userProfile]);

  // Buy Pet Cards with Diamonds (10 Diamonds = 5 Cards, 50 Diamonds = 30 Cards)
  const handleBuyPetCards = useCallback((diamondCost, cardReward) => {
    if (diamonds < diamondCost) return;
    setDiamonds((d) => {
      const nextD = d - diamondCost;
      localStorage.setItem('tg_diamonds', nextD.toString());
      return nextD;
    });
    setPetUpgradeCards((c) => {
      const nextC = c + cardReward;
      localStorage.setItem('tg_pet_upgrade_cards', nextC.toString());
      syncToSupabase({ pet_cards: nextC });
      return nextC;
    });
    triggerHaptic('success');
  }, [diamonds, syncToSupabase]);

  // Claim Daily Mystery Combo Jackpot (Locks claimed amount for today & grants +2 Pet Cards)
  const handleClaimCombo = useCallback((jackpotAmount) => {
    setScore((s) => s + jackpotAmount);
    setLifetimeScore((ls) => ls + jackpotAmount);
    setPetUpgradeCards((c) => {
      const nextC = c + 2;
      localStorage.setItem('tg_pet_upgrade_cards', nextC.toString());
      syncToSupabase({ pet_cards: nextC });
      return nextC;
    });
    setIsComboClaimed(true);
    localStorage.setItem('tg_combo_claimed', 'true');
    const today = new Date().toISOString().split('T')[0];
    const newState = {
      lastClaimDate: today,
      claimedAmount: jackpotAmount,
    };
    setDailyComboState(newState);
    localStorage.setItem('tg_daily_combo_state', JSON.stringify(newState));
  }, [syncToSupabase]);

  // Instant Energy Refill (15 Diamonds)
  const handleRefillEnergy = useCallback(() => {
    if (diamonds < 15) return;
    setDiamonds((d) => {
      const nextD = d - 15;
      localStorage.setItem('tg_diamonds', nextD.toString());
      return nextD;
    });
    setEnergy(maxEnergy);
    triggerHaptic('success');
    soundEngine.playBoostSound();
  }, [diamonds, maxEnergy]);

  // Buy 12h Offline Auto-Tap Bot (100 Diamonds)
  const handleBuyOfflineBot = useCallback((cost = 100) => {
    if (diamonds < cost) return;
    setDiamonds((d) => {
      const nextD = d - cost;
      localStorage.setItem('tg_diamonds', nextD.toString());
      return nextD;
    });
    setIsOfflineBotActive(true);
    localStorage.setItem('tg_offline_bot_active', 'true');
    triggerHaptic('success');
    soundEngine.playBoostSound();
  }, [diamonds]);

  // Handle tap event (with Pet Perks: Shiba Inu 10x Crit Chance & Mythic Dragon Global Multiplier & 2x Frenzy)
  const handleTap = useCallback((x, y) => {
    setEnergy((prevEnergy) => {
      if (prevEnergy <= 0) {
        setIsLowEnergy(true);
        soundEngine.playEmptyEnergySound();
        triggerHaptic('error');
        setTimeout(() => setIsLowEnergy(false), 300);
        return 0;
      }

      const now = Date.now();
      lastTapTimeRef.current = now;

      tapTimesRef.current = [...tapTimesRef.current.filter((t) => now - t < 3000), now];
      const recentTapsInLastSecond = tapTimesRef.current.filter((t) => now - t <= 1000).length;
      setTapsPerSec(recentTapsInLastSecond);

      // Pet Perks Computation
      const isShibaOwned = ownedPets.includes('shiba_dog');
      const shibaLvl = isShibaOwned ? (petLevels['shiba_dog'] || 1) : 0;
      const shibaEvo = getPetEvolutionInfo(shibaLvl);
      const shibaExtraCritChance = isShibaOwned ? (0.05 * (shibaEvo.isEvolved ? shibaEvo.multiplier : 1)) : 0;
      const critChance = 0.08 + shibaExtraCritChance;

      const isDragonOwned = ownedPets.includes('mythic_dragon');
      const dragonLvl = isDragonOwned ? (petLevels['mythic_dragon'] || 1) : 0;
      const dragonEvo = getPetEvolutionInfo(dragonLvl);
      const dragonGlobalMult = isDragonOwned ? (1 + 0.15 * (dragonEvo.isEvolved ? dragonEvo.multiplier : 1)) : 1.0;
      const frenzyGain = isDragonOwned ? 2 : 1;

      if (frenzyActive) {
        setFrenzyComboCount((c) => c + 1);
      } else if (!isCoolingDown) {
        setFrenzyPoints((prev) => {
          const nextPoints = prev + frenzyGain;
          if (nextPoints >= MAX_FRENZY_POINTS) {
            setFrenzyActive(true);
            triggerHaptic('heavy');
            if (window.Telegram?.WebApp?.HapticFeedback) {
              try {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
              } catch (e) {}
            }
            soundEngine.playBoostSound();
            return MAX_FRENZY_POINTS;
          }
          return nextPoints;
        });
      }

      // Safe Tap Function: check if effectiveTapPower is valid
      const currentPower = effectiveTapPower || Math.floor(1 + (tapPowerBonus || 0)) || 1;

      // 1. Dynamic / Crit Tap Values with Shiba 10x Crit & Mythic Dragon Global Multiplier
      const roll = Math.random();
      let pointsToAdd = currentPower;
      let isCrit = false;

      if (roll < critChance) {
        isCrit = true;
        pointsToAdd = Math.max(2, currentPower * 10);
        triggerHaptic('heavy');
      } else if (roll < (critChance + 0.20)) {
        const bonus = Math.floor(Math.random() * 2) + 1;
        pointsToAdd = currentPower + bonus;
        triggerHaptic('light');
      } else {
        triggerHaptic('light');
      }

      pointsToAdd = Math.floor(pointsToAdd * dragonGlobalMult);

      setScore((s) => s + pointsToAdd);
      setLifetimeScore((ls) => ls + pointsToAdd);

      setIsPopping(true);
      setTimeout(() => setIsPopping(false), 150);

      setCombo((c) => Math.min(c + 1, 25));
      soundEngine.playTapSound(combo);

      const newParticle = {
        id: Date.now() + Math.random(),
        x,
        y,
        value: pointsToAdd,
        isCrit,
      };

      setParticles((prevParticles) => {
        const updated = [...prevParticles, newParticle];
        return updated.length > 15 ? updated.slice(updated.length - 15) : updated;
      });

      return prevEnergy - 1;
    });
  }, [effectiveTapPower, frenzyActive, frenzyCooldownUntil, combo]);

  const handleRemoveParticle = useCallback((particleId) => {
    setParticles((prev) => prev.filter((p) => p.id !== particleId));
  }, []);

  const handleToggleSound = useCallback(() => {
    const newState = soundEngine.toggleSound();
    setSoundEnabled(newState);
  }, []);

  if (!isTelegramAccessAllowed) {
    return <TelegramAccessDenied />;
  }

  return (
    <div className={`w-full min-h-screen ${levelInfo.currentTier.bgClass || 'bg-[#0d0d12]'} transition-colors duration-700 flex items-center justify-center font-sans antialiased select-none overflow-x-hidden`}>
      <div className={`w-full max-w-[430px] min-h-screen ${levelInfo.currentTier.bgClass || 'bg-[#0d0d12]'} transition-colors duration-700 text-white flex flex-col justify-between relative shadow-2xl overflow-hidden border-x border-white/5`}>
        
        {/* Error Debug Banner for Supabase Troubleshooting & Dev Toggle Button */}
        <div style={{ background: '#330000', color: '#ff4d4d', padding: '10px', fontSize: '12px', wordBreak: 'break-all', zIndex: 9999, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>DEBUG: {debugLog}</span>
          <button
            onClick={() => setShowDevPanel((prev) => !prev)}
            style={{ background: '#ff4d4d', color: '#000', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', whiteSpace: 'nowrap', marginLeft: '8px' }}
          >
            🛠️ Dev
          </button>
        </div>

        {/* Hidden Developer Admin Panel Modal Component */}
        <DevPanel
          isOpen={showDevPanel}
          onClose={() => setShowDevPanel(false)}
          onAddCoins={handleDevAddCoins}
          onAddCards={() => {
            triggerHaptic('success');
            setPetUpgradeCards((prev) => {
              const next = prev + 100;
              localStorage.setItem('tg_pet_upgrade_cards', next.toString());
              syncToSupabase({ pet_cards: next });
              return next;
            });
          }}
          onResetScratchLimit={handleResetScratchLimit}
          onResetPetCardsToZero={handleResetPetCardsToZero}
          onResetPlayerState={handleResetPlayerState}
        />

        {/* Dynamic Rank Radial Glow Backdrop */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b ${levelInfo.currentTier.radialGlowClass} rounded-full blur-3xl pointer-events-none transition-all duration-700`} />

        {/* Subtle Non-Blocking Rank Promotion Floating Toast Banner */}
        {rankToast && (
          <div className="absolute top-14 left-4 right-4 z-50 p-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs shadow-2xl flex items-center justify-between animate-bounce pointer-events-none border border-amber-300">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>{rankToast}</span>
            </div>
          </div>
        )}

        {/* Offline Passive Income Modal */}
        {offlineEarnings && <OfflineModal offlineEarnings={offlineEarnings} onClaim={handleClaimOffline} />}

        {/* Daily Check-in Streak Overlay Modal */}
        {showDailyModal && (
          <DailyCheckInModal
            streakData={streakData}
            onClaimCheckIn={handleClaimCheckIn}
            onClose={() => setShowDailyModal(false)}
          />
        )}

        {/* Custom Coin Skins Shop Modal */}
        {showSkinsModal && (
          <SkinsModal
            userLevelIndex={levelInfo.currentLevel}
            rankLevel={levelInfo.currentLevel}
            rankName={levelInfo.currentTier.name}
            totalCoins={lifetimeScore}
            activeSkinId={activeSkinId}
            onSelectSkin={handleSelectSkin}
            onClose={() => setShowSkinsModal(false)}
          />
        )}

        {/* Fortune Scratch Modal */}
        {showScratchModal && (
          <ScratchCardModal
            score={Math.floor(score)}
            rankLevel={levelInfo.currentLevel}
            rankName={levelInfo.currentTier.name}
            lastScratchTimestamp={lastScratchTimestamp}
            dailyCardsBoughtCount={dailyCardsBoughtCount}
            onClaimReward={handleClaimScratchReward}
            onBuyExtraScratch={handleBuyExtraScratch}
            onClose={() => setShowScratchModal(false)}
          />
        )}

        {/* Account Level Up Milestone Reward Modal */}
        {accountLevelUpData && (
          <AccountLevelUpModal
            newLevel={accountLevelUpData.newLevel}
            tapPower={accountLevelUpData.tapPower}
            onClose={() => setAccountLevelUpData(null)}
          />
        )}

        {/* Welcome Bonus Referral Banner */}
        {welcomeBonusBanner && (
          <div className="absolute top-14 left-4 right-4 z-50 p-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-2xl flex items-center justify-between animate-bounce">
            <span>🎉 Referral Bonus Claimed! +25,000 Coins & +25 Diamonds! 💎</span>
            <button onClick={() => setWelcomeBonusBanner(false)} className="text-slate-950 font-black px-1.5">✕</button>
          </div>
        )}

        {/* Header Component */}
        <ScoreHeader
          score={Math.floor(score)}
          diamonds={diamonds}
          petUpgradeCards={petUpgradeCards}
          currentTier={levelInfo.currentTier}
          tapPower={effectiveTapPower}
          creatorLevel={creatorLevel}
          userProfile={userProfile}
          isPopping={isPopping}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          canClaimDaily={canClaimDaily}
          onOpenDailyModal={() => setShowDailyModal(true)}
          onResetDevData={handleResetDevData}
        />

        {/* Dynamic Level Progress Bar */}
        <LevelProgressBar score={Math.floor(lifetimeScore)} onOpenRankDetails={() => setActiveTab('earn')} />

        {/* Action Shortcut Buttons */}
        {activeTab === 'earn' && (
          <div className="flex items-center justify-center gap-2 px-4 py-1 z-20">
            <button
              onClick={() => {
                triggerHaptic('selection');
                setShowSkinsModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 text-xs font-bold shadow-md active:scale-95 transition-all outline-none focus:outline-none focus:ring-0"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>🎨 Coin Skins</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('selection');
                setShowScratchModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-400/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold shadow-md active:scale-95 transition-all outline-none focus:outline-none focus:ring-0"
            >
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>🎁 Fortune Scratch</span>
            </button>
          </div>
        )}

        {/* Tab Views */}
        <div className={`flex-1 flex flex-col justify-between my-auto relative z-10 ${
          activeTab === 'earn' ? 'overflow-visible' : 'overflow-y-auto'
        }`}>
          {activeTab === 'earn' && (
            <>
              <TapCoin
                onTap={handleTap}
                disabled={energy <= 0}
                particles={particles}
                onRemoveParticle={handleRemoveParticle}
                tapPower={effectiveTapPower}
                activeSkinId={activeSkinId}
                frenzyActive={frenzyActive}
                frenzyProgress={frenzyPercentage}
                frenzyComboCount={frenzyComboCount}
                frenzyMultiplier={frenzyMultiplier}
                tapsPerSec={tapsPerSec}
                frenzyCooldownUntil={frenzyCooldownUntil}
                setFrenzyCooldownUntil={setFrenzyCooldownUntil}
                isFrenzyCoolingDown={isCoolingDown}
              />

              <EnergyBar
                currentEnergy={energy}
                maxEnergy={maxEnergy}
                isLowEnergy={isLowEnergy}
              />
            </>
          )}

          {activeTab === 'upgrades' && (
            <UpgradesTab
              score={Math.floor(score)}
              userUpgrades={userUpgrades}
              onUpgradeAttribute={handleUpgradeAttribute}
              dailyComboState={dailyComboState}
              isComboClaimed={isComboClaimed}
              setIsComboClaimed={setIsComboClaimed}
              onClaimCombo={handleClaimCombo}
              creatorLevel={creatorLevel}
              referralCount={userProfile?.referralCount || 0}
              streakDay={streakData.currentStreak}
            />
          )}

          {activeTab === 'pets' && (
            <PetsTab
              score={Math.floor(score)}
              diamonds={diamonds}
              petUpgradeCards={petUpgradeCards}
              creatorLevel={creatorLevel}
              ownedPets={ownedPets}
              petLevels={petLevels}
              onUnlockPetWithCoins={handleUnlockPetWithCoins}
              onUnlockPetWithDiamonds={handleUnlockPetWithDiamonds}
              onUpgradePet={handleUpgradePet}
              onBuyPetCards={handleBuyPetCards}
              onRefillEnergy={handleRefillEnergy}
              onBuyOfflineBot={handleBuyOfflineBot}
              isOfflineBotActive={isOfflineBotActive}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksTab
              streakData={streakData}
              onClaimCheckIn={handleClaimCheckIn}
              onClaimReward={(reward) => {
                setScore((s) => s + reward);
                setLifetimeScore((ls) => ls + reward);
              }}
            />
          )}

          {activeTab === 'friends' && (
            <FriendsTab
              userProfile={userProfile}
              unclaimedReferralRewards={unclaimedReferralRewards}
              onClaimReferralRewards={handleClaimReferralRewards}
            />
          )}
        </div>

        {/* Navigation Bar */}
        <NavBar activeTab={activeTab} onChangeTab={setActiveTab} />
      </div>
    </div>
  );
}
