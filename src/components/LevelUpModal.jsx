import React, { useEffect } from 'react';
import { Sparkles, Trophy, Zap, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../utils/telegram';
import { soundEngine } from '../utils/audio';

export const LevelUpModal = ({ newTier, onClose }) => {
  if (!newTier) return null;

  // Trigger celebration effects on mount
  useEffect(() => {
    triggerHaptic('success');
    soundEngine.playBoostSound();

    try {
      // Confetti Explosion
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 },
      });
    } catch (e) {}
  }, [newTier]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-[#0d0d12] border-2 border-amber-500/50 p-6 text-center shadow-[0_0_80px_rgba(245,158,11,0.5)] animate-scale-up">
        
        {/* Close Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Outer Glowing Ring & Rank Badge */}
        <div className="relative w-28 h-28 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-500/30 blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 p-1 shadow-[0_0_40px_rgba(245,158,11,0.7)] animate-bounce">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-5xl">
              {newTier.icon}
            </div>
          </div>
        </div>

        <div className="text-xs font-black uppercase tracking-widest text-amber-400 mb-1">
          RANK UP MILESTONE!
        </div>
        <h2 className="text-3xl font-black text-white mb-2">{newTier.name} Rank</h2>
        <p className="text-xs text-slate-300 mb-5 px-3 leading-relaxed">
          You reached the prestigious <span className="text-amber-300 font-extrabold">{newTier.name}</span> milestone tier!
        </p>

        {/* Per-Tap Multiplier Stats Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/40 mb-6 flex items-center justify-center gap-3 shadow-inner">
          <Zap className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
          <div className="text-left">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">NEW PER-TAP REWARD</div>
            <div className="text-lg font-black text-white">+{newTier.pointsPerTap} Points / Tap</div>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('success');
            onClose();
          }}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span>CLAIM MILESTONE & CONTINUE</span>
        </button>
      </div>
    </div>
  );
};
