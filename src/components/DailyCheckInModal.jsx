import React from 'react';
import { X, Calendar } from 'lucide-react';
import { DailyCheckIn } from './DailyCheckIn';
import { triggerHaptic } from '../utils/telegram';

export const DailyCheckInModal = ({ streakData, onClaimCheckIn, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-[#0d0d12] border border-amber-500/30 p-5 shadow-[0_0_50px_rgba(245,158,11,0.3)] animate-scale-up">
        
        {/* Close Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Inner Daily Check-in */}
        <DailyCheckIn
          streakData={streakData}
          onClaimCheckIn={(day, reward) => {
            onClaimCheckIn(day, reward);
            setTimeout(onClose, 800); // Close modal after claim
          }}
        />
      </div>
    </div>
  );
};
