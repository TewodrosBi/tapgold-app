import React, { memo } from 'react';
import { Zap } from 'lucide-react';

export const EnergyBar = memo(({ currentEnergy, maxEnergy, isLowEnergy }) => {
  const percentage = Math.max(0, Math.min(100, (currentEnergy / maxEnergy) * 100));

  return (
    <div className="w-full px-5 mb-4 select-none">
      <div className="flex items-center justify-between text-xs font-bold mb-1.5 px-1">
        <div className="flex items-center gap-1.5 text-amber-300">
          <Zap className={`w-4 h-4 ${percentage < 20 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
          <span className="uppercase tracking-wider text-[11px]">Energy</span>
        </div>

        <div className="font-mono text-xs font-bold text-amber-200">
          <span>{currentEnergy}</span>
          <span className="text-amber-400/60 font-normal"> / {maxEnergy}</span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div
        className={`relative w-full h-4 bg-black/60 rounded-full p-0.5 border border-white/10 overflow-hidden shadow-inner ${
          isLowEnergy ? 'animate-energy-shake border-red-500/60' : ''
        }`}
      >
        {/* Glowing Gradient Fill */}
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 transition-all duration-150 ease-out shadow-[0_0_12px_rgba(245,158,11,0.7)]"
          style={{ width: `${percentage}%` }}
        />

        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
      </div>
    </div>
  );
});

EnergyBar.displayName = 'EnergyBar';
