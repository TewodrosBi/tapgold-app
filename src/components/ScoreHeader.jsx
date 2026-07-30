import React from 'react';
import { Volume2, VolumeX, Calendar, Star, Zap, RotateCcw, Gem, User } from 'lucide-react';

export const ScoreHeader = ({
  score,
  diamonds = 50,
  petUpgradeCards = 5,
  currentTier,
  tapPower,
  creatorLevel = 1,
  userProfile,
  isPopping,
  soundEnabled,
  onToggleSound,
  canClaimDaily,
  onOpenDailyModal,
  onResetDevData,
}) => {
  const displayUsername = userProfile?.username
    ? (userProfile.username.startsWith('@') ? userProfile.username : `@${userProfile.username}`)
    : `@${userProfile?.firstName || 'GuestPlayer'}`;

  return (
    <div className="w-full px-4 pt-3 pb-2 z-20 flex flex-col items-center select-none space-y-3">
      {/* Top Glassmorphic Badge Bar */}
      <div className="w-full flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        
        {/* Telegram Username (@username) & Account Level Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/40 backdrop-blur-md text-xs font-bold shadow-md">
            <User className="w-3 h-3 text-sky-400" />
            <span className="text-sky-300 font-mono tracking-tight">{displayUsername}</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-bold shadow-lg">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-amber-200">Lvl {creatorLevel}</span>
            <span className="text-white/20">|</span>
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-amber-300 font-black">+{tapPower}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onResetDevData && (
            <button
              onClick={onResetDevData}
              className="px-2 py-1 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 backdrop-blur-md text-red-300 font-black text-[10px] flex items-center gap-1 transition-all active:scale-95 shadow-md"
              title="Reset All Game State to Level 1 (0 Pts)"
            >
              <RotateCcw className="w-3 h-3 text-red-400" />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={onOpenDailyModal}
            className={`relative p-1.5 rounded-full border backdrop-blur-md transition-all active:scale-95 ${
              canClaimDaily
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Daily Check-in Streak"
          >
            <Calendar className="w-3.5 h-3.5" />
            {canClaimDaily && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
            )}
          </button>

          <button
            onClick={onToggleSound}
            className="p-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-slate-400 hover:text-white transition-all active:scale-95"
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* 5. Dual-Currency Display Bar (Coins & Diamonds Side-by-Side) */}
      <div className="w-full flex items-center justify-center gap-2">
        {/* Spendable Coins Card */}
        <div className="flex-1 p-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🪙</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Coins</span>
          </div>
          <span className="text-sm font-black text-amber-300 font-mono">
            {new Intl.NumberFormat('en-US').format(score)}
          </span>
        </div>

        {/* Premium Diamonds Card */}
        <div className="flex-1 p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-md shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Gem className="w-4 h-4 text-cyan-300 fill-cyan-300" />
            <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider">Diamonds</span>
          </div>
          <span className="text-sm font-black text-cyan-200 font-mono">
            {new Intl.NumberFormat('en-US').format(diamonds)}
          </span>
        </div>
      </div>

      {/* Main Score Typography */}
      <div className="flex flex-col items-center justify-center relative pt-1">
        <div
          className={`text-4xl sm:text-5xl font-black tracking-tight transition-transform duration-100 ${
            isPopping ? 'scale-110' : 'scale-100'
          }`}
        >
          <span className={`bg-clip-text text-transparent bg-gradient-to-b ${currentTier.scoreGradient} ${currentTier.scoreGlow}`}>
            {new Intl.NumberFormat('en-US').format(score)}
          </span>
        </div>
      </div>
    </div>
  );
};
