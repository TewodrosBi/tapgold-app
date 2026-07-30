import React from 'react';
import { Rocket, Zap, ShieldAlert, Cpu } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';
import { soundEngine } from '../utils/audio';

export const BoostMenu = ({ score, onBuyBoost, tapPower, maxEnergy, turboActive, onActivateTurbo }) => {
  const boosts = [
    {
      id: 'multitap',
      name: 'Multitap Upgrade',
      desc: `Increase tap profit (+1 per tap)`,
      cost: tapPower * 100,
      icon: Zap,
      action: () => onBuyBoost('multitap', tapPower * 100),
    },
    {
      id: 'energy',
      name: 'Energy Limit (+250)',
      desc: 'Increase total energy capacity',
      cost: Math.floor(maxEnergy * 1.5),
      icon: ShieldAlert,
      action: () => onBuyBoost('energy', Math.floor(maxEnergy * 1.5)),
    },
    {
      id: 'turbo',
      name: 'Full Energy Refill',
      desc: 'Instantly restore energy to max',
      cost: 50,
      icon: Rocket,
      action: () => {
        if (score >= 50) {
          triggerHaptic('success');
          soundEngine.playBoostSound();
          onBuyBoost('refill', 50);
        }
      },
    },
  ];

  return (
    <div className="w-full max-w-md mx-auto p-4 select-none">
      <div className="bg-slate-900/80 backdrop-blur-md border border-amber-500/20 rounded-2xl p-4 shadow-xl">
        <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Rocket className="w-4 h-4 text-amber-400" />
          Boosts & Upgrades
        </h3>

        {/* Turbo Mode Banner */}
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-between">
          <div>
            <div className="font-bold text-sm text-amber-200">2X Turbo Mode</div>
            <div className="text-xs text-amber-300/70">Double tap earnings for 10 seconds</div>
          </div>
          <button
            onClick={onActivateTurbo}
            disabled={turboActive}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
              turboActive
                ? 'bg-amber-500 text-slate-950 animate-pulse'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 active:scale-95'
            }`}
          >
            {turboActive ? 'ACTIVE!' : 'BOOST!'}
          </button>
        </div>

        {/* Boost list */}
        <div className="space-y-2.5">
          {boosts.map((b) => {
            const Icon = b.icon;
            const canAfford = score >= b.cost;
            return (
              <div
                key={b.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-amber-500/10 hover:border-amber-500/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-amber-100">{b.name}</div>
                    <div className="text-xs text-slate-400">{b.desc}</div>
                  </div>
                </div>

                <button
                  onClick={b.action}
                  disabled={!canAfford}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    canAfford
                      ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 hover:brightness-110 active:scale-95 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {b.cost} pts
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
