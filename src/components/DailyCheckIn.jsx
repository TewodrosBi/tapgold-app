import React from 'react';
import { Calendar, CheckCircle2, Lock, Gift, Sparkles } from 'lucide-react';
import { STREAK_REWARDS, getStreakStatus } from '../utils/retention';
import { triggerHaptic } from '../utils/telegram';

export const DailyCheckIn = ({ streakData, onClaimCheckIn }) => {
  const { currentStreak, lastCheckIn } = streakData;
  const status = getStreakStatus(lastCheckIn, currentStreak);

  const handleClaim = () => {
    if (!status.canCheckIn) return;
    triggerHaptic('success');
    const rewardInfo = STREAK_REWARDS.find((r) => r.day === status.streak) || STREAK_REWARDS[0];
    onClaimCheckIn(status.streak, rewardInfo.reward);
  };

  return (
    <div className="w-full px-4 py-3 select-none">
      <div className="glass-panel rounded-2xl p-5 shadow-2xl text-center border border-white/10">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black text-amber-200">Daily Reward Calendar</h3>
              <p className="text-[11px] text-slate-400">Log in daily to claim up to 1,000,000 coins!</p>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-xs">
            🔥 Day {currentStreak || 1}
          </div>
        </div>

        {/* 7-Day Grid Calendar */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {STREAK_REWARDS.map((item) => {
            const isCompleted = item.day < status.streak || (!status.canCheckIn && item.day === currentStreak);
            const isCurrent = status.canCheckIn && item.day === status.streak;
            const isLocked = item.day > status.streak;

            return (
              <div
                key={item.day}
                className={`relative p-2.5 rounded-xl border flex flex-col items-center justify-between transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : isCurrent
                    ? 'glass-panel-amber border-amber-400 text-amber-200 scale-105 shadow-lg shadow-amber-500/20 animate-pulse'
                    : 'bg-white/5 border-white/10 text-slate-400'
                } ${item.day === 7 ? 'col-span-2' : ''}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider mb-1">
                  Day {item.day}
                </span>

                <div className="my-1 text-base">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                  ) : isCurrent ? (
                    <Gift className="w-5 h-5 text-amber-400 animate-bounce mx-auto" />
                  ) : (
                    <span className="text-sm">🪙</span>
                  )}
                </div>

                <span className="text-xs font-black tracking-tight">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Claim Button */}
        <button
          onClick={handleClaim}
          disabled={!status.canCheckIn}
          className={`w-full py-3 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${
            status.canCheckIn
              ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-95'
              : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{status.canCheckIn ? `CLAIM DAY ${status.streak} REWARD` : 'CHECKED IN TODAY'}</span>
        </button>
      </div>
    </div>
  );
};
