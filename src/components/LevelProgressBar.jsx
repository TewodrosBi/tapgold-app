import React from 'react';
import { ChevronRight, Lock, Sparkles } from 'lucide-react';
import { getLevelInfo } from '../utils/levels';

export const LevelProgressBar = ({ score, onOpenRankDetails }) => {
  const { currentTier, nextTier, progress, remainingPoints } = getLevelInfo(score);

  return (
    <div className="w-full px-4 py-2 z-20 select-none">
      <div
        onClick={onOpenRankDetails}
        className="glass-panel p-3 rounded-2xl cursor-pointer hover:border-amber-500/30 transition-all active:scale-[0.99] shadow-lg flex flex-col gap-1.5"
      >
        {/* Top Header: Rank Name & Target Goal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl drop-shadow">{currentTier.badgeIcon}</span>
            <div className="flex flex-col text-left">
              <span className={`text-xs font-black tracking-wide ${currentTier.color}`}>
                {currentTier.name}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                Rank Level {currentTier.level} / 6
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300">
            {nextTier ? (
              <span className="text-[10px] text-slate-300 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400/80" />
                <span>Next: {nextTier.shortName}</span>
              </span>
            ) : (
              <span className="text-[10px] text-fuchsia-300 font-black flex items-center gap-1 animate-pulse">
                <Sparkles className="w-3 h-3 text-fuchsia-400" />
                <span>MAX RANK!</span>
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Animated Fill Bar */}
        <div className="w-full h-2.5 bg-black/60 rounded-full p-0.5 border border-white/10 overflow-hidden shadow-inner relative">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(245,158,11,0.7)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 4. Hard Progress UI Feedback: Exact Remaining Points Needed */}
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-0.5">
          <span>
            {new Intl.NumberFormat('en-US').format(score)} pts
          </span>

          {nextTier ? (
            <span className="text-amber-300/90 font-black">
              Need {new Intl.NumberFormat('en-US').format(remainingPoints)} more points to reach {nextTier.shortName}
            </span>
          ) : (
            <span className="text-fuchsia-300 font-black">🌟 MAX LEGENDARY RANK</span>
          )}
        </div>
      </div>
    </div>
  );
};
