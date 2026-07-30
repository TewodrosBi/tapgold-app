import React from 'react';
import { supabase } from '../supabase';
import { triggerHaptic } from '../utils/telegram';

export const handleResetPlayerState = async ({
  userId,
  userProfile,
  setCoins,
  setTotalCoins,
  setScore,
  setLifetimeScore,
  setPetCards,
  setPetUpgradeCards,
  setDiamonds,
  setPets,
  setOwnedPets,
  setUserUpgrades,
  setPetLevels,
  setDailyCardsBoughtCount,
  setFrenzyActive,
  setFrenzyPoints,
  setIsComboClaimed,
  setStreakData,
  setActiveSkinId,
  setIsOfflineBotActive,
} = {}) => {
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
    const activeUserId = userId || userProfile?.telegramId || user?.id || localStorage.getItem('supabase_user_id') || '12345678';

    if (supabase && activeUserId) {
      const { error: profilesErr } = await supabase
        .from('profiles')
        .update(freshDefaults)
        .eq('id', activeUserId);

      if (profilesErr) {
        console.error("Supabase Reset Error (profiles):", profilesErr.message);
      }

      try {
        await supabase
          .from('players')
          .update(freshDefaults)
          .eq('telegram_id', activeUserId);
      } catch (e) {}

      try {
        await supabase
          .from('player_pets')
          .delete()
          .eq('telegram_id', activeUserId);
      } catch (e) {}
    }

    // 4. Reset Local React State
    if (typeof setCoins === 'function') setCoins(0);
    if (typeof setTotalCoins === 'function') setTotalCoins(0);
    if (typeof setScore === 'function') setScore(0);
    if (typeof setLifetimeScore === 'function') setLifetimeScore(0);
    if (typeof setPetCards === 'function') setPetCards(0);
    if (typeof setPetUpgradeCards === 'function') setPetUpgradeCards(0);
    if (typeof setDiamonds === 'function') setDiamonds(0);
    if (typeof setPets === 'function') setPets({});
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
};

export const DevPanel = ({
  isOpen,
  onClose,
  onAddCoins,
  onAddCards,
  onResetScratchLimit,
  onResetPetCardsToZero,
  onResetPlayerState,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-[#181824] border border-amber-500/30 rounded-2xl p-5 text-white shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛠️</span>
            <div>
              <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider">Dev Admin Panel</h3>
              <p className="text-[10px] text-slate-400">Shift + D shortcut enabled</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 text-white font-bold flex items-center justify-center hover:bg-white/20 transition-all text-xs"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => onAddCoins(1000000)}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-between active:scale-98 transition-all"
          >
            <span>💰 +1,000,000 Coins</span>
            <span className="text-[10px] opacity-75">+1M Wallet & Total</span>
          </button>

          <button
            onClick={() => onAddCoins(5000000)}
            className="w-full py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-between active:scale-98 transition-all"
          >
            <span>💎 +5,000,000 Coins (Instant Platinum)</span>
            <span className="text-[10px] opacity-75">Rank 4 Trigger</span>
          </button>

          <button
            onClick={() => onAddCoins(50000000)}
            className="w-full py-2.5 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-bold text-xs flex items-center justify-between active:scale-98 transition-all"
          >
            <span>👑 +50,000,000 Coins (Instant Diamond)</span>
            <span className="text-[10px] opacity-75">Rank 5 Trigger</span>
          </button>

          <button
            onClick={onAddCards}
            className="w-full py-2.5 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center justify-between active:scale-98 transition-all"
          >
            <span>🎴 +100 Pet Cards</span>
            <span className="text-[10px] opacity-75">Add 100 Cards</span>
          </button>

          <button
            onClick={onResetPetCardsToZero}
            className="w-full py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-between active:scale-98 transition-all"
          >
            <span>🎴 Set Cards to 0 & Force Save</span>
            <span className="text-[10px] opacity-75">Force Clear DB & Local</span>
          </button>

          <button
            onClick={onResetScratchLimit}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-between active:scale-98 transition-all"
          >
            <span>🔄 Reset Scratch Limit</span>
            <span className="text-[10px] opacity-75">Clear Timer & Count</span>
          </button>

          <button
            onClick={onResetPlayerState}
            className="w-full py-2.5 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-bold text-xs flex items-center justify-between active:scale-98 transition-all mt-4"
          >
            <span>⚠️ Reset Player State</span>
            <span className="text-[10px] opacity-75">Clear Local & Supabase</span>
          </button>
        </div>

        <div className="pt-2 text-[10px] text-slate-500 text-center border-t border-white/5">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-slate-300">Shift + D</kbd> to toggle panel anytime
        </div>
      </div>
    </div>
  );
};
