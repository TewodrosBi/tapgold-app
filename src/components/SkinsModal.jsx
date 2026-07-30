import React from 'react';
import { X, CheckCircle2, Lock, Palette } from 'lucide-react';
import { COIN_SKINS } from '../utils/skins';
import { triggerHaptic } from '../utils/telegram';

export const SkinsModal = ({ userLevelIndex, rankLevel, rankName, totalCoins, activeSkinId, onSelectSkin, onClose }) => {
  const currentLevel = rankLevel || userLevelIndex || 1;
  const currentRankName = String(rankName || '').toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-[#0d0d12] border border-amber-500/30 p-5 shadow-[0_0_50px_rgba(245,158,11,0.3)] animate-scale-up">
        
        {/* Close Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Palette className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-black text-amber-200">Coin Skins Shop</h3>
            <p className="text-xs text-slate-400">Unlock custom tap coin designs by ranking up!</p>
          </div>
        </div>

        {/* Skins Grid */}
        <div className="space-y-2.5 my-4 max-h-80 overflow-y-auto pr-1">
          {COIN_SKINS.map((skin) => {
            const isUnlocked = Boolean(
              skin.requiredLevel <= 1 ||
              currentLevel >= skin.requiredLevel ||
              (currentRankName && skin.requiredRankName && currentRankName.includes(skin.requiredRankName.toLowerCase()))
            );
            const isActive = activeSkinId === skin.id;

            return (
              <div
                key={skin.id}
                onClick={() => {
                  if (isUnlocked && !isActive) {
                    triggerHaptic('selection');
                    onSelectSkin(skin.id);
                  }
                }}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isActive
                    ? 'glass-panel-amber border-amber-400 text-amber-200 shadow-md shadow-amber-500/20'
                    : isUnlocked
                    ? 'bg-white/5 border-white/10 hover:border-amber-500/30 cursor-pointer active:scale-[0.99]'
                    : 'bg-black/40 border-white/5 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-2xl flex items-center justify-center">
                    {skin.icon}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-black text-amber-100 flex items-center gap-1.5">
                      <span>{skin.name}</span>
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500 text-slate-950 font-extrabold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">{skin.desc}</div>
                    {!isUnlocked && (
                      <div className="text-[10px] text-amber-400/90 font-bold mt-0.5 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Requires {skin.requiredRankName} Rank</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {isActive ? (
                    <CheckCircle2 className="w-5 h-5 text-amber-400" />
                  ) : isUnlocked ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('selection');
                        onSelectSkin(skin.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 active:scale-95 transition-all"
                    >
                      Equip
                    </button>
                  ) : (
                    <Lock className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs border border-white/10"
        >
          DONE
        </button>
      </div>
    </div>
  );
};
