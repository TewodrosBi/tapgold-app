import React from 'react';
import { Clock, Sparkles, Zap, Award } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

export const OfflineModal = ({ offlineEarnings, onClaim }) => {
  if (!offlineEarnings || offlineEarnings.earned <= 0) return null;

  const formattedEarned = new Intl.NumberFormat('en-US').format(offlineEarnings.earned);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-xs rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-[#0d0d12] border border-amber-500/40 p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.3)] animate-scale-up">
        
        {/* Welcome Back Icon */}
        <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 shadow-[0_0_25px_rgba(245,158,11,0.5)]">
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-4xl">
            💤
          </div>
        </div>

        <div className="text-xs font-black uppercase tracking-widest text-amber-400 mb-1">WELCOME BACK!</div>
        <h2 className="text-xl font-black text-white mb-2">Offline Earnings</h2>
        
        <p className="text-xs text-slate-300 mb-4 px-2">
          Your miners continued working while you were away ({offlineEarnings.effectiveHours} hrs {offlineEarnings.capped ? '(Capped at 3h)' : ''})!
        </p>

        {/* Total Earned Display */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/20 to-amber-600/10 border border-amber-500/30 mb-6 flex flex-col items-center justify-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300/80 mb-1">
            YOU EARNED
          </span>
          <div className="flex items-center gap-2 text-3xl font-black text-amber-300 drop-shadow-[0_2px_10px_rgba(245,158,11,0.7)]">
            <span>🪙</span>
            <span>+{formattedEarned}</span>
          </div>
        </div>

        {/* Claim Button */}
        <button
          onClick={() => {
            triggerHaptic('success');
            onClaim();
          }}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span>CLAIM & COLLECT</span>
        </button>
      </div>
    </div>
  );
};
