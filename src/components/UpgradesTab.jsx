import React, { useState } from 'react';
import { Sparkles, Lock, CheckCircle2, Gift, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../utils/telegram';
import { soundEngine } from '../utils/audio';
import { MAX_BASE_TAP_POWER } from '../App';

export const STUDIO_ATTRIBUTES = [
  {
    id: 'tap_power',
    name: 'Tap Power',
    desc: 'Increases coins earned per tap',
    baseCost: 25000,
    icon: '⚡',
    gateThreshold: 5,
    gateMinLevel: 5,
    gateWarning: 'Requires Creator Studio Level 5',
  },
  {
    id: 'energy_limit',
    name: 'Energy Capacity',
    desc: 'Increases maximum energy tank (+50 max)',
    baseCost: 15000,
    icon: '🔋',
    gateThreshold: 10,
    gateMinLevel: 10,
    gateWarning: 'Requires Creator Studio Level 10',
  },
  {
    id: 'recharge_speed',
    name: 'Recharge Speed',
    desc: 'Speed up energy recovery rate (-90ms/lvl)',
    baseCost: 10000,
    icon: '⚡',
    gateThreshold: 25,
    gateMinLevel: 25,
    gateWarning: 'Requires Creator Studio Level 25',
  },
];

export const calculateAccountLevel = (tapLvl = 1, energyLvl = 1, rechargeLvl = 1) => {
  const totalUpgradesPurchased = Math.max(0, tapLvl - 1) + Math.max(0, energyLvl - 1) + Math.max(0, rechargeLvl - 1);
  return 1 + totalUpgradesPurchased;
};

export const MAX_ATTRIBUTE_LEVEL = 25;

export const UpgradesTab = ({
  score = 0,
  userUpgrades = {},
  onUpgradeAttribute,
  dailyComboState = { lastClaimDate: null, claimedAmount: 0 },
  isComboClaimed = false,
  setIsComboClaimed,
  onClaimCombo,
  creatorLevel = 1,
}) => {
  const [shakingCardId, setShakingCardId] = useState(null);
  const [toast, setToast] = useState(null);

  // Safe Default State Guards & Optional Chaining Fallbacks
  const safeUserUpgrades = userUpgrades || {};
  const safeComboState = dailyComboState || { lastClaimDate: null, claimedAmount: 0 };

  // 1. Account Level Formula: 1 + totalUpgradesPurchased (Fresh user starts at Level 1)
  const tapPowerLevel = (safeUserUpgrades['tap_power'] || 0) + 1;
  const energyCapacityLevel = (safeUserUpgrades['energy_limit'] || 0) + 1;
  const rechargeSpeedLevel = (safeUserUpgrades['recharge_speed'] || 0) + 1;
  const calculatedAccountLevel = calculateAccountLevel(tapPowerLevel, energyCapacityLevel, rechargeSpeedLevel);

  // Combo State Verification
  const tapPowerUpgradedToday = (safeUserUpgrades['tap_power'] || 0) > 0;
  const energyUpgradedToday = (safeUserUpgrades['energy_limit'] || 0) > 0;
  const rechargeUpgradedToday = (safeUserUpgrades['recharge_speed'] || 0) > 0;
  const isComboComplete = tapPowerUpgradedToday && energyUpgradedToday && rechargeUpgradedToday;

  // Daily Jackpot Claim State Schema Verification with Optional Chaining & isComboClaimed
  const getTodayDateString = () => new Date().toISOString().split('T')[0];
  const isJackpotClaimedToday = isComboClaimed || safeComboState?.lastClaimDate === getTodayDateString();
  const claimedAmount = safeComboState?.claimedAmount || 0;

  // Dynamic Daily Jackpot Scaling
  const dailyJackpot = Math.max(50000, calculatedAccountLevel * 25000);

  const getAttributeLevel = (cardId) => {
    return (safeUserUpgrades[cardId] || 0) + 1;
  };

  // Rebalance Upgrade Cost Exponential Scaling: baseCost * Math.pow(1.8, level - 1)
  const calculateUpgradeCost = (card) => {
    const level = getAttributeLevel(card.id);
    return Math.floor(card.baseCost * Math.pow(1.8, level - 1));
  };

  const checkGateLock = (card) => {
    const currentLvl = getAttributeLevel(card.id);
    return currentLvl === card.gateThreshold && calculatedAccountLevel < card.gateMinLevel;
  };

  const handleUpgradeClick = (card) => {
    const isLocked = checkGateLock(card);
    if (isLocked) {
      triggerHaptic('error');
      soundEngine.playEmptyEnergySound();
      setToast(`🔒 ${card.gateWarning}`);
      setTimeout(() => setToast(null), 2500);
      setShakingCardId(card.id);
      setTimeout(() => setShakingCardId(null), 400);
      return;
    }

    const cost = calculateUpgradeCost(card);
    if (score < cost) {
      triggerHaptic('error');
      soundEngine.playEmptyEnergySound();
      setToast('⚠️ Insufficient Coins for upgrade!');
      setTimeout(() => setToast(null), 2500);
      setShakingCardId(card.id);
      setTimeout(() => setShakingCardId(null), 400);
      return;
    }

    triggerHaptic('success');
    soundEngine.playBoostSound();
    onUpgradeAttribute(card.id, cost);

    const level = getAttributeLevel(card.id);
    setToast(`⭐ ${card.name} Lvl ${level + 1} Unlocked!`);
    setTimeout(() => setToast(null), 2500);
  };

  const getStatLabels = (cardId, level) => {
    const lvlCount = safeUserUpgrades[cardId] || 0;
    if (cardId === 'tap_power') {
      const currentTap = Math.min(MAX_BASE_TAP_POWER, Math.floor(1 * Math.pow(1.15, Math.max(0, calculatedAccountLevel - 1))) + lvlCount);
      const nextTap = Math.min(MAX_BASE_TAP_POWER, Math.floor(1 * Math.pow(1.15, Math.max(0, calculatedAccountLevel))) + lvlCount + 1);
      return `Current: +${currentTap} / tap → Next: +${nextTap} / tap`;
    }
    if (cardId === 'energy_limit') {
      const currentCap = 500 + lvlCount * 50;
      const nextCap = 500 + (lvlCount + 1) * 50;
      return `Current: ${currentCap} Max Energy → Next: ${nextCap} Max Energy`;
    }
    if (cardId === 'recharge_speed') {
      const currentRate = Math.max(200, 800 - lvlCount * 90);
      const nextRate = Math.max(200, 800 - (lvlCount + 1) * 90);
      return `Recharge interval: ${currentRate}ms → Next: ${nextRate}ms`;
    }
    return '';
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

      {/* Synchronized Creator Level Header Card */}
      <div className="glass-panel rounded-2xl p-4 shadow-xl flex items-center justify-between border border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-amber-300 font-black text-lg">
              {calculatedAccountLevel}
            </div>
          </div>
          <div className="text-left">
            <div className="text-xs font-black uppercase tracking-wider text-amber-300">Creator Studio Level</div>
            <div className="text-sm font-bold text-slate-200">Level {calculatedAccountLevel} Account</div>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/30">
          ⭐ Lvl {calculatedAccountLevel}
        </div>
      </div>

      {/* Daily Mystery Combo Section */}
      <div className="glass-panel-amber rounded-2xl p-4 shadow-2xl relative overflow-hidden border border-amber-500/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400 animate-bounce" />
            <h3 className="text-sm font-extrabold text-amber-200">Daily Mystery Combo</h3>
          </div>
          <span className="text-[11px] font-black text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
            {isJackpotClaimedToday
              ? `+${claimedAmount.toLocaleString()} 🪙 Claimed`
              : `+${dailyJackpot.toLocaleString()} 🪙 Jackpot`}
          </span>
        </div>

        <p className="text-[11px] text-slate-300 mb-3">
          Upgrade all 3 studio attributes to unlock the +{dailyJackpot.toLocaleString()} 🪙 jackpot!
        </p>

        {/* 3 Secret Card Slots */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {STUDIO_ATTRIBUTES.map((card, index) => {
            const isUnlocked = (safeUserUpgrades[card.id] || 0) > 0;

            return (
              <div
                key={card.id}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                  isUnlocked
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md shadow-amber-500/20'
                    : 'bg-black/40 border-white/10 text-slate-400'
                }`}
              >
                <div className="text-xl mb-1">{isUnlocked ? '⚡' : '❓'}</div>
                <span className="text-[10px] font-bold truncate max-w-full">
                  {isUnlocked ? card.name : `Slot ${index + 1}`}
                </span>
                {isUnlocked && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mt-1" />}
              </div>
            );
          })}
        </div>

        {/* Combo Status / Claim Action Buttons */}
        {!isComboComplete && !isJackpotClaimedToday && (
          <div className="w-full py-2.5 px-3 rounded-xl bg-black/40 border border-white/10 text-slate-400 text-xs font-bold text-center">
            Upgrade all 3 studio attributes today to unlock jackpot!
          </div>
        )}

        {isComboComplete && !isJackpotClaimedToday && (
          <button
            onClick={() => {
              triggerHaptic('success');
              soundEngine.playBoostSound();
              try {
                confetti({
                  particleCount: 120,
                  spread: 100,
                  origin: { y: 0.5 },
                });
              } catch (e) {}
              onClaimCombo(dailyJackpot);
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-green-600 text-slate-950 font-black text-xs tracking-wider shadow-lg shadow-emerald-500/30 animate-bounce flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>🎉 CLAIM +{dailyJackpot.toLocaleString()} JACKPOT</span>
          </button>
        )}

        {isJackpotClaimedToday && (
          <div className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-extrabold text-xs text-center flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>✓ Daily Jackpot Claimed (+{claimedAmount.toLocaleString()} Coins)</span>
          </div>
        )}
      </div>

      {/* Account Studio Attributes Upgrades List */}
      <div className="glass-panel rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-amber-300 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" /> Studio Attributes
          </h3>
          <span className="text-[11px] text-slate-400">Coins Sink</span>
        </div>

        <div className="space-y-3">
          {STUDIO_ATTRIBUTES.map((card) => {
            const attrLevel = getAttributeLevel(card.id);
            const isMaxed = attrLevel >= MAX_ATTRIBUTE_LEVEL;
            const cost = isMaxed ? 0 : calculateUpgradeCost(card);
            const isLocked = !isMaxed && checkGateLock(card);
            const canAfford = !isMaxed && score >= cost && !isLocked;
            const isShaking = shakingCardId === card.id;

            return (
              <div
                key={card.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isShaking ? 'animate-energy-shake' : ''
                } ${
                  isMaxed
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : isLocked
                    ? 'bg-red-950/20 border-red-500/30'
                    : canAfford
                    ? 'bg-white/5 border-amber-500/30 hover:border-amber-400/60'
                    : 'bg-black/30 border-white/5 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-xl flex items-center justify-center">
                      {card.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-extrabold text-sm text-slate-100">{card.name}</div>
                      <div className="text-[11px] text-slate-400">{card.desc}</div>
                      <div className="text-[10px] text-amber-300/80 font-bold mt-0.5">
                        {getStatLabels(card.id, attrLevel - 1)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black text-amber-300 flex items-center gap-1">
                      <span>Lvl {attrLevel}</span>
                      {isMaxed && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                          MAX
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                  {isMaxed ? (
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>MAX LEVEL REACHED (LVL 25)</span>
                    </div>
                  ) : isLocked ? (
                    <div className="flex items-center gap-1 text-[11px] font-extrabold text-red-400">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{card.gateWarning}</span>
                    </div>
                  ) : (
                    <div className="text-xs font-mono font-bold text-amber-200 flex items-center gap-1">
                      <span>Cost:</span>
                      <span className="font-black text-amber-300">{cost.toLocaleString()} 🪙</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleUpgradeClick(card)}
                    disabled={isMaxed || !canAfford}
                    className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                      isMaxed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : canAfford
                        ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 hover:brightness-110 active:scale-95 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    <span>{isMaxed ? 'MAXED OUT' : 'Upgrade (+1 Lvl)'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
