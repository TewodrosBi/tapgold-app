import React, { useEffect } from 'react';
import { Star, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../utils/telegram';
import { soundEngine } from '../utils/audio';

export const AccountLevelUpModal = ({ newLevel, tapPower, onClose }) => {
  useEffect(() => {
    triggerHaptic('success');
    soundEngine.playBoostSound();

    try {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 },
      });
    } catch (e) {}
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-[#0d0d12] border border-amber-400/40 p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.4)] animate-scale-up">
        
        {/* Level Badge Icon */}
        <div className="w-20 h-20 mx-auto mb-3 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 p-1 shadow-[0_0_30px_rgba(245,158,11,0.6)] animate-bounce">
          <div className="w-full h-full rounded-3xl bg-slate-950 flex flex-col items-center justify-center text-amber-300 font-black">
            <Star className="w-7 h-7 fill-amber-400 text-amber-400 mb-0.5" />
            <span className="text-xs tracking-wider">LVL {newLevel}</span>
          </div>
        </div>

        <h3 className="text-2xl font-black text-amber-200 mb-1 tracking-tight">
          STUDIO LEVEL UP!
        </h3>
        <p className="text-xs text-slate-300 mb-4">
          Congratulations! Your Creator Studio reached <span className="text-amber-300 font-bold">Level {newLevel}</span>!
        </p>

        {/* Upgraded Stat Summary Card */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>New Creator Level:</span>
            <span className="text-amber-300 font-black">⭐ Level {newLevel}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Upgraded Tap Power:</span>
            <span className="text-amber-300 font-black">⚡ +{new Intl.NumberFormat('en-US').format(tapPower)} / tap</span>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-300 text-slate-950 font-black text-xs tracking-wider shadow-lg shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span>AWESOME!</span>
        </button>
      </div>
    </div>
  );
};
