import React from 'react';
import { Coins, Zap, Heart, CheckSquare, Users } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

export const NavBar = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'earn', label: 'Earn', icon: Coins },
    { id: 'upgrades', label: 'Upgrades', icon: Zap },
    { id: 'pets', label: 'Pets', icon: Heart },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'friends', label: 'Friends', icon: Users },
  ];

  return (
    <div className="w-full px-4 pb-4 pt-2 select-none">
      {/* Glassmorphic Navigation Bar Container */}
      <div className="grid grid-cols-5 gap-1 p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('selection');
                onChangeTab(tab.id);
              }}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'glass-panel-amber text-amber-300 font-bold shadow-lg shadow-amber-500/20 scale-[1.02]'
                  : 'text-slate-400 hover:text-amber-200/80 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-amber-400 scale-110 drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]' : ''}`} />
              <span className="text-[10px] tracking-tight truncate max-w-full">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
