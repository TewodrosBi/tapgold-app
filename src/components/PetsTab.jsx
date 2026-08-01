import React, { useState } from 'react';
import { Lock, Sparkles, Gem, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';
import { soundEngine } from '../utils/audio';

export const getPetEvolutionInfo = (level = 1) => {
  if (level >= 30) {
    return { isEvolved: true, stage: 3, multiplier: 2.0, label: 'EVOLVED STAGE 3 (2.0x Output)', borderClass: 'border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)]' };
  }
  if (level >= 20) {
    return { isEvolved: true, stage: 2, multiplier: 1.5, label: 'EVOLVED STAGE 2 (1.5x Output)', borderClass: 'border-2 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.4)]' };
  }
  if (level >= 10) {
    return { isEvolved: true, stage: 1, multiplier: 1.25, label: 'EVOLVED STAGE 1 (1.25x Output)', borderClass: 'border-2 border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]' };
  }
  return { isEvolved: false, stage: 0, multiplier: 1.0, label: '', borderClass: '' };
};

export const PET_DEFINITIONS = [
  {
    id: 'cyber_cat',
    name: 'Cyber Cat',
    rarity: 'Rare',
    unlockLevel: 25,
    icon: '🐱',
    unlockCoinCost: 5000000,
    unlockDiamondCost: 100,
    baseCost: 100000,
    desc: 'Auto-Tap (+2 taps/s) & +2% Coins/Tap per Lvl',
    bonusPerLevel: 2.0,
    typeLabel: 'Agile Companion (Rare)',
    perkTitle: '🤖 Cyber Auto-Tap & Coin Surge',
  },
  {
    id: 'shiba_dog',
    name: 'Shiba Inu',
    rarity: 'Epic',
    unlockLevel: 50,
    icon: '🐶',
    unlockCoinCost: 20000000,
    unlockDiamondCost: 250,
    baseCost: 300000,
    desc: '+5% Crit Tap Chance (10x tap value) & +5% Energy Regen',
    bonusPerLevel: 3.0,
    typeLabel: 'Loyal Guardian (Epic)',
    perkTitle: '⚡ Critical Fortune & Energy Pulse',
  },
  {
    id: 'mythic_dragon',
    name: 'Mythic Dragon',
    rarity: 'Legendary',
    unlockLevel: 75,
    icon: '🐲',
    unlockCoinCost: 100000000,
    unlockDiamondCost: 500,
    baseCost: 5000000,
    desc: '+15% Global Coin Earnings & 2x Frenzy Gain Rate',
    bonusPerLevel: 5.0,
    typeLabel: 'Endgame Mythic (Legendary)',
    perkTitle: '🔥 Mythic Overload & Double Frenzy',
  },
];

export const getPetRarityGlowStyle = (rarity = 'Rare') => {
  switch ((rarity || 'Rare').toLowerCase()) {
    case 'rare':
      return {
        boxShadow: '0 0 15px rgba(0, 210, 255, 0.4)',
        borderColor: 'rgba(0, 210, 255, 0.6)',
        badgeClass: 'bg-cyan-500/30 border border-cyan-400 text-cyan-300',
        textColor: 'text-cyan-300',
      };
    case 'epic':
      return {
        boxShadow: '0 0 15px rgba(186, 85, 211, 0.5)',
        borderColor: 'rgba(186, 85, 211, 0.7)',
        badgeClass: 'bg-purple-500/30 border border-purple-400 text-purple-300',
        textColor: 'text-purple-300',
      };
    case 'legendary':
    default:
      return {
        boxShadow: '0 0 15px rgba(255, 180, 0, 0.6)',
        borderColor: 'rgba(255, 180, 0, 0.8)',
        badgeClass: 'bg-amber-500/30 border border-amber-400 text-amber-300',
        textColor: 'text-amber-300',
      };
  }
};

export const getRarityStyle = (level) => {
  if (level >= 100) {
    return {
      tierName: 'MAXED OUT',
      cardBorderClass: 'bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 p-[2px] rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.6)] animate-pulse',
      innerBgClass: 'bg-slate-950/95',
      badgeClass: 'bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 font-black',
      textColor: 'text-amber-300',
    };
  } else if (level >= 75) {
    return {
      tierName: 'LEGENDARY',
      cardBorderClass: 'border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.6)] bg-purple-950/20',
      innerBgClass: 'bg-slate-950/90',
      badgeClass: 'bg-purple-500/30 border border-purple-400 text-purple-300',
      textColor: 'text-purple-300',
    };
  } else if (level >= 50) {
    return {
      tierName: 'EPIC',
      cardBorderClass: 'border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] bg-amber-950/20',
      innerBgClass: 'bg-slate-950/90',
      badgeClass: 'bg-amber-500/30 border border-amber-400 text-amber-300',
      textColor: 'text-amber-300',
    };
  } else if (level >= 25) {
    return {
      tierName: 'RARE',
      cardBorderClass: 'border-2 border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)] bg-cyan-950/20',
      innerBgClass: 'bg-slate-950/90',
      badgeClass: 'bg-cyan-500/30 border border-cyan-400 text-cyan-300',
      textColor: 'text-cyan-300',
    };
  } else {
    return {
      tierName: 'COMMON',
      cardBorderClass: 'border border-slate-500 bg-white/5',
      innerBgClass: 'bg-slate-950/80',
      badgeClass: 'bg-slate-500/30 border border-slate-400 text-slate-300',
      textColor: 'text-slate-300',
    };
  }
};

export const PetsTab = ({
  score = 0,
  diamonds = 0,
  petUpgradeCards = 0,
  petCards,
  creatorLevel = 1,
  ownedPets = [],
  petLevels = {},
  onUnlockPetWithCoins,
  onUnlockPetWithDiamonds,
  onUpgradePet,
  onBuyPetCards,
  onRefillEnergy,
  onBuyOfflineBot,
  isOfflineBotActive = false,
}) => {
  const [shakingCardId, setShakingCardId] = useState(null);
  const [toast, setToast] = useState(null);

  const availablePetCards = petCards !== undefined ? petCards : petUpgradeCards;

  const activeBot = typeof isOfflineBotActive !== 'undefined' ? isOfflineBotActive : false;

  // Sync Total Bonus Calculation: sums ONLY unlocked/owned pets in ownedPets
  const totalPetBonus = PET_DEFINITIONS.reduce((acc, pet) => {
    const isOwned = ownedPets.includes(pet.id);
    if (!isOwned) return acc;
    const level = petLevels[pet.id] || 1;
    return acc + level * pet.bonusPerLevel;
  }, 0);

  const handleUnlockCoins = (pet) => {
    if (score < pet.unlockCoinCost) {
      triggerHaptic('error');
      soundEngine.playEmptyEnergySound();
      setToast('⚠️ Insufficient Coins to adopt pet!');
      setTimeout(() => setToast(null), 2500);
      setShakingCardId(pet.id);
      setTimeout(() => setShakingCardId(null), 400);
      return;
    }

    triggerHaptic('success');
    soundEngine.playBoostSound();
    onUnlockPetWithCoins(pet.id, pet.unlockCoinCost);
    setToast(`🎉 Adopted ${pet.name}!`);
    setTimeout(() => setToast(null), 2500);
  };

  const handleUnlockDiamonds = (pet) => {
    if (diamonds < pet.unlockDiamondCost) {
      triggerHaptic('error');
      soundEngine.playEmptyEnergySound();
      setToast('⚠️ Insufficient Diamonds to adopt pet!');
      setTimeout(() => setToast(null), 2500);
      setShakingCardId(pet.id);
      setTimeout(() => setShakingCardId(null), 400);
      return;
    }

    triggerHaptic('success');
    soundEngine.playBoostSound();
    onUnlockPetWithDiamonds(pet.id, pet.unlockDiamondCost);
    setToast(`🎉 Adopted ${pet.name}!`);
    setTimeout(() => setToast(null), 2500);
  };

  const handleUpgradeClick = (pet) => {
    const currentLevel = petLevels[pet.id] || 1;
    if (currentLevel >= 100) {
      triggerHaptic('warning');
      setToast('⭐ Pet is already MAXED OUT at Level 100!');
      setTimeout(() => setToast(null), 2500);
      return;
    }

    const coinCost = Math.floor(pet.baseCost * Math.pow(1.12, currentLevel));
    const cardCost = Math.max(1, Math.floor(currentLevel * 0.5));

    if (availablePetCards < cardCost) {
      triggerHaptic('error');
      soundEngine.playEmptyEnergySound();
      setToast(`⚠️ Missing Upgrade Cards! (Need ${cardCost} 🎴, Have ${availablePetCards})`);
      setTimeout(() => setToast(null), 3000);
      setShakingCardId(pet.id);
      setTimeout(() => setShakingCardId(null), 400);
      return;
    }

    if (score < coinCost) {
      triggerHaptic('error');
      soundEngine.playEmptyEnergySound();
      setToast('⚠️ Insufficient Coins for pet upgrade!');
      setTimeout(() => setToast(null), 2500);
      setShakingCardId(pet.id);
      setTimeout(() => setShakingCardId(null), 400);
      return;
    }

    triggerHaptic('success');
    soundEngine.playBoostSound();
    onUpgradePet(pet.id, coinCost, cardCost);

    setToast(`🎉 Upgraded ${pet.name} to Level ${currentLevel + 1}!`);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="w-full px-4 py-3 select-none space-y-4 relative">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-14 left-4 right-4 z-50 p-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-2xl flex items-center justify-between animate-bounce">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="px-1 text-slate-950">✕</button>
        </div>
      )}

      {/* Pet Header Overview Card */}
      <div className="glass-panel-amber rounded-2xl p-4 shadow-xl space-y-3 border border-amber-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-2xl flex items-center justify-center">
              🐾
            </div>
            <div className="text-left">
              <div className="text-xs font-black uppercase tracking-wider text-amber-300">Companion Sanctuary</div>
              <div className="text-sm font-bold text-slate-200">
                Total Bonus: <span className="text-amber-300 font-black">+{totalPetBonus.toFixed(1)}% Tap Power</span>
              </div>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/30">
            {ownedPets.length} / {PET_DEFINITIONS.length} Owned
          </div>
        </div>

        {/* Companion Sanctuary Currency Header (3 Resource Balances Side-by-Side) */}
        <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-amber-500/20">
          <div className="px-2 py-1.5 rounded-xl bg-black/40 border border-amber-500/30 flex flex-col items-center justify-center">
            <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <span>🪙</span> Coins
            </span>
            <span className="text-xs font-mono font-black text-amber-200 truncate max-w-full">
              {new Intl.NumberFormat('en-US').format(score)}
            </span>
          </div>

          <div className="px-2 py-1.5 rounded-xl bg-black/40 border border-cyan-500/30 flex flex-col items-center justify-center">
            <span className="text-[10px] font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
              <Gem className="w-3 h-3 text-cyan-300 fill-cyan-300" /> Diamonds
            </span>
            <span className="text-xs font-mono font-black text-cyan-200 truncate max-w-full">
              {new Intl.NumberFormat('en-US').format(diamonds)}
            </span>
          </div>

          <div className="px-2 py-1.5 rounded-xl bg-black/40 border border-purple-500/30 flex flex-col items-center justify-center">
            <span className="text-[10px] font-extrabold text-purple-300 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-purple-400" /> Pet Cards
            </span>
            <span className="text-xs font-mono font-black text-purple-200 truncate max-w-full">
              {new Intl.NumberFormat('en-US').format(petUpgradeCards)}
            </span>
          </div>
        </div>

        {/* Diamond Shop Section: Refill, Auto-Bot & Cards */}
        <div className="pt-2.5 mt-2.5 border-t border-cyan-500/20 space-y-2">
          <div className="text-[10px] font-extrabold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
            <span>💎 Diamond Station & Booster Shop</span>
            <span className="text-slate-400 font-normal text-[9px]">Instant Activation</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {/* 1. Instant Energy Refill */}
            <button
              onClick={() => {
                if (diamonds >= 15 && onRefillEnergy) {
                  triggerHaptic('success');
                  onRefillEnergy();
                }
              }}
              disabled={diamonds < 15}
              className={`py-2.5 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-between border ${
                diamonds >= 15
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 hover:brightness-110 border-cyan-400/50 text-cyan-200 active:scale-95 cursor-pointer shadow-md'
                  : 'bg-slate-800/60 text-slate-500 border-white/5 cursor-not-allowed'
              }`}
            >
              <span>🔋 Instant Refill</span>
              <span className="text-[10px] font-mono text-cyan-300 font-black">15 💎</span>
            </button>

            {/* 2. Offline Auto-Tap Bot (12h) */}
            <button
              onClick={() => {
                if (diamonds >= 100 && onBuyOfflineBot) {
                  triggerHaptic('success');
                  onBuyOfflineBot();
                }
              }}
              disabled={diamonds < 100 || activeBot}
              className={`py-2.5 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-between border ${
                activeBot
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 cursor-default'
                  : diamonds >= 100
                  ? 'bg-gradient-to-r from-amber-500/30 to-rose-500/30 hover:brightness-110 border-amber-400/50 text-amber-200 active:scale-95 cursor-pointer shadow-md'
                  : 'bg-slate-800/60 text-slate-500 border-white/5 cursor-not-allowed'
              }`}
            >
              <span>🤖 Auto-Bot 12h</span>
              <span className="text-[10px] font-mono text-cyan-300 font-black">{activeBot ? 'ACTIVE' : '100 💎'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* 3. Buy 5 Cards */}
            <button
              onClick={() => {
                if (diamonds >= 25 && onBuyPetCards) {
                  triggerHaptic('success');
                  onBuyPetCards(25, 5);
                }
              }}
              disabled={diamonds < 25}
              className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-between border ${
                diamonds >= 25
                  ? 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/40 text-purple-200 active:scale-95 cursor-pointer'
                  : 'bg-slate-800/60 text-slate-500 border-white/5 cursor-not-allowed'
              }`}
            >
              <span>🎴 +5 Cards</span>
              <span className="text-[10px] font-mono text-cyan-300 font-black">25 💎</span>
            </button>

            {/* 4. Buy 30 Cards */}
            <button
              onClick={() => {
                if (diamonds >= 120 && onBuyPetCards) {
                  triggerHaptic('success');
                  onBuyPetCards(120, 30);
                }
              }}
              disabled={diamonds < 120}
              className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-between border ${
                diamonds >= 120
                  ? 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 hover:from-purple-500/40 hover:to-indigo-500/40 border-purple-400/50 text-purple-200 active:scale-95 shadow-md cursor-pointer'
                  : 'bg-slate-800/60 text-slate-500 border-white/5 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-1">
                <span>🎴 +30 Cards</span>
                <span className="text-[8px] bg-purple-500 text-slate-950 px-1 rounded font-black">BONUS</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 font-black">120 💎</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pet Cards List */}
      <div className="space-y-3">
        {PET_DEFINITIONS.map((pet) => {
          const isLevelUnlocked = creatorLevel >= pet.unlockLevel;
          const isOwned = ownedPets.includes(pet.id);
          const currentLevel = isOwned ? (petLevels[pet.id] || 1) : 0;
          const isMaxed = currentLevel >= 1000;
          const rarityStyle = getRarityStyle(currentLevel);
          const rarityGlow = getPetRarityGlowStyle(pet.rarity);
          const evoInfo = getPetEvolutionInfo(currentLevel);
          const coinCost = isOwned && !isMaxed ? Math.floor(pet.baseCost * Math.pow(1.12, currentLevel)) : 0;
          const cardCost = isOwned && !isMaxed ? Math.max(1, Math.floor(currentLevel * 0.5)) : 0;
          const hasEnoughCards = availablePetCards >= cardCost;
          const canAffordUpgrade = isOwned && !isMaxed && score >= coinCost && hasEnoughCards;
          const isShaking = shakingCardId === pet.id;

          const cardContent = (
            <div className={`w-full p-4 rounded-2xl ${rarityStyle.innerBgClass} ${evoInfo.borderClass} flex flex-col space-y-3 transition-all`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-3xl flex items-center justify-center shadow-inner relative">
                    {pet.icon}
                    {evoInfo.isEvolved && (
                      <span className="absolute -top-1 -right-1 text-xs">⭐</span>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-100">{pet.name}</span>
                      {isOwned && (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${rarityStyle.badgeClass}`}>
                          {rarityStyle.tierName}
                        </span>
                      )}
                      {isOwned && evoInfo.isEvolved && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-md animate-pulse">
                          ✨ {evoInfo.label}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">{pet.desc}</div>
                    <div className="text-[10px] font-extrabold text-amber-300/90 mt-0.5">{pet.perkTitle}</div>
                    {isOwned && (
                      <div className={`text-[11px] font-bold ${rarityStyle.textColor} mt-0.5`}>
                        Active Skill Output: +{(currentLevel * pet.bonusPerLevel * (evoInfo.isEvolved ? evoInfo.multiplier : 1)).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {isOwned ? (
                    <div className="text-xs font-black text-amber-300">
                      Lvl {currentLevel}
                    </div>
                  ) : !isLevelUnlocked ? (
                    <div className="p-1.5 rounded-full bg-slate-800 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                  ) : (
                    <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ELIGIBLE
                    </span>
                  )}
                </div>
              </div>

              {/* 2. 3-STAGE PET STATUS ARCHITECTURE */}

              {/* STATE 1: LEVEL LOCKED (accountLevel < requiredLevel) */}
              {!isLevelUnlocked && (
                <div className="w-full py-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-extrabold text-center flex items-center justify-center gap-1.5 cursor-not-allowed">
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span>🔒 Unlocks Eligibility at Account Level {pet.unlockLevel}</span>
                </div>
              )}

              {/* STATE 2: ELIGIBLE FOR ADOPTION (accountLevel >= requiredLevel AND !isOwned) */}
              {isLevelUnlocked && !isOwned && (
                <div className="space-y-2 pt-1 border-t border-white/5">
                  <div className="py-1 px-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-black text-center flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                    <span>✨ ELIGIBLE TO ADOPT!</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Button A: Adopt for Diamonds */}
                    <button
                      onClick={() => handleUnlockDiamonds(pet)}
                      disabled={diamonds < pet.unlockDiamondCost}
                      className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
                        diamonds >= pet.unlockDiamondCost
                          ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md hover:brightness-110 active:scale-95'
                          : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      <Gem className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                      <span>Adopt for {pet.unlockDiamondCost} 💎</span>
                    </button>

                    {/* Button B: Adopt for Coins */}
                    <button
                      onClick={() => handleUnlockCoins(pet)}
                      disabled={score < pet.unlockCoinCost}
                      className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
                        score >= pet.unlockCoinCost
                          ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 shadow-md hover:brightness-110 active:scale-95'
                          : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      <span>Adopt for {new Intl.NumberFormat('en-US').format(pet.unlockCoinCost)} 🪙</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 3: OWNED & UPGRADEABLE (isOwned === true) */}
              {isOwned && (
                <>
                  {isMaxed ? (
                    <div className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 text-slate-950 font-black text-xs text-center tracking-wider shadow-lg flex items-center justify-center gap-1.5">
                      <Sparkles className="w-4 h-4 fill-slate-950" />
                      <span>MAXED OUT (LEVEL 100)</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 pt-1">
                      {!hasEnoughCards && (
                        <div className="text-[10px] font-extrabold text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-red-400" />
                          <span>Missing Upgrade Cards (Need {cardCost} 🎴, Have {availablePetCards})</span>
                        </div>
                      )}

                      <button
                        onClick={() => handleUpgradeClick(pet)}
                        disabled={!canAffordUpgrade}
                        className={`w-full py-2.5 rounded-xl text-xs font-black tracking-wider flex items-center justify-between px-4 transition-all ${
                          canAffordUpgrade
                            ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 hover:brightness-110 active:scale-95 shadow-md shadow-amber-500/20'
                            : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                        }`}
                      >
                        <span>Upgrade to Lvl {currentLevel + 1}</span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>{new Intl.NumberFormat('en-US').format(coinCost)} 🪙</span>
                          <span>+</span>
                          <span>{cardCost} 🎴 Pet Cards</span>
                        </div>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );

          return (
            <div
              key={pet.id}
              style={{ boxShadow: rarityGlow.boxShadow, borderColor: rarityGlow.borderColor }}
              className={`transition-all rounded-2xl border-2 ${isShaking ? 'animate-energy-shake' : ''}`}
            >
              {cardContent}
            </div>
          );
        })}
      </div>
    </div>
  );
};
