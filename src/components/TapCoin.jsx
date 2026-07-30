import React, { useState, useRef, useCallback } from 'react';
import { COIN_SKINS } from '../utils/skins';

export const TapCoin = ({
  onTap,
  disabled,
  particles = [],
  onRemoveParticle,
  tapPower = 5,
  activeSkinId = 'classic_gold',
  frenzyActive = false,
  frenzyProgress = 0,
  frenzyComboCount = 0,
  frenzyMultiplier = 2,
  tapsPerSec = 0,
  frenzyCooldownUntil = null,
  setFrenzyCooldownUntil,
  isFrenzyCoolingDown = false,
}) => {
  const coinRef = useRef(null);
  const [isTapping, setIsTapping] = useState(false);
  const [localParticles, setLocalParticles] = useState([]);

  const [tiltStyle, setTiltStyle] = useState({
    transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)',
  });
  const [shockwaveKey, setShockwaveKey] = useState(0);

  const activeSkin = COIN_SKINS.find((s) => s.id === activeSkinId) || COIN_SKINS[0];

  // 1. Coin Bounce State & Interactive Tap Event Handler
  const handlePointerDown = useCallback((e) => {
    if (disabled || !coinRef.current) return;
    if (e.cancelable) e.preventDefault();

    setIsTapping(true);
    setTimeout(() => setIsTapping(false), 80);

    if (frenzyActive) {
      setShockwaveKey(Date.now());
    }

    const rect = coinRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : rect.left + rect.width / 2);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : rect.top + rect.height / 2);

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normX = (clientX - centerX) / (rect.width / 2);
    const normY = (clientY - centerY) / (rect.height / 2);

    const rotateY = Math.max(-16, Math.min(16, normX * 16));
    const rotateX = Math.max(-16, Math.min(16, -normY * 16));

    setTiltStyle({
      transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(0.93)`,
    });

    // 2. Dynamic Floating Particle Creation with 1-Second Cleanup
    const particleId = Date.now() + Math.random();
    const values = [2, 3, 5, 7];
    const randomizedVal = values[Math.floor(Math.random() * values.length)] * Math.max(1, Math.floor(tapPower / 5));
    const isCritHit = Math.random() < 0.1;
    const newP = { id: particleId, x: clientX, y: clientY, value: randomizedVal, isCrit: isCritHit };

    setLocalParticles((prev) => [...prev.slice(-15), newP]);
    setTimeout(() => {
      setLocalParticles((prev) => prev.filter((p) => p.id !== particleId));
    }, 1000);

    onTap(clientX, clientY);
  }, [disabled, frenzyActive, onTap, tapPower]);

  const handlePointerUp = useCallback(() => {
    setTiltStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)',
    });
  }, []);

  const displayParticles = particles && particles.length > 0 ? particles : localParticles;

  return (
    <div className="relative flex flex-col items-center justify-center my-auto py-6 select-none touch-none w-full overflow-visible border-none bg-transparent shadow-none outline-none">
      
      {/* Lightning Tap Combo Counter & Dynamic Multiplier Badge */}
      {frenzyActive && (
        <div className="absolute -top-14 z-30 flex flex-col items-center animate-bounce pointer-events-none">
          <div className={`px-4 py-1.5 rounded-full text-white font-black text-sm tracking-wider shadow-2xl border border-white/40 flex items-center gap-2 ${
            frenzyMultiplier >= 5
              ? 'bg-gradient-to-r from-red-600 via-fuchsia-600 to-amber-400 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.9)]'
              : frenzyMultiplier >= 3
              ? 'bg-gradient-to-r from-fuchsia-600 via-purple-500 to-amber-500 shadow-[0_0_20px_rgba(217,70,239,0.8)]'
              : 'bg-gradient-to-r from-purple-600 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.7)]'
          }`}>
            <span>🔥 {frenzyComboCount} COMBO!</span>
            <span className="bg-white/25 px-2.5 py-0.5 rounded-full text-xs font-black text-amber-200 uppercase tracking-widest border border-amber-300/40">
              {frenzyMultiplier >= 5 ? '⚡ MAX OVERDRIVE (5X)' : `🔥 ${frenzyMultiplier}X MULTIPLIER`}
            </span>
          </div>
        </div>
      )}

      {/* Frenzy Progress Meter & Cooldown UI State */}
      <div className="w-full max-w-xs px-6 mb-4">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider mb-1">
          <span className={
            isFrenzyCoolingDown
              ? 'text-rose-400 font-bold'
              : frenzyActive
              ? 'text-fuchsia-300 animate-pulse'
              : 'text-amber-400/80'
          }>
            {isFrenzyCoolingDown
              ? '🔒 COOLDOWN (RECHARGING...)'
              : frenzyActive
              ? `⚡ ${frenzyMultiplier}X RAMPING FRENZY!`
              : '⚡ FRENZY METER'}
          </span>
          <span className={`font-mono ${isFrenzyCoolingDown ? 'text-rose-400' : 'text-amber-300'}`}>
            {isFrenzyCoolingDown ? 'COOLDOWN' : `${Math.floor(frenzyProgress)}%`}
          </span>
        </div>

        <div className={`w-full h-3.5 rounded-full p-0.5 border overflow-hidden shadow-inner transition-all duration-300 ease-out ${
          isFrenzyCoolingDown
            ? 'bg-slate-950 border-rose-500/40 opacity-70'
            : frenzyActive
            ? 'bg-black/80 border-fuchsia-400/80 shadow-[0_0_20px_rgba(217,70,239,0.9)] animate-bar-pulse'
            : frenzyProgress > 50
            ? 'bg-black/70 border-amber-400/70 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-bar-pulse'
            : 'bg-black/60 border-white/10'
        }`}>
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${
              isFrenzyCoolingDown
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 animate-pulse'
                : frenzyActive
                ? 'bg-gradient-to-r from-fuchsia-500 via-purple-400 to-amber-400 animate-pulse shadow-[0_0_15px_rgba(217,70,239,0.9)]'
                : frenzyProgress > 50
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300'
                : 'bg-gradient-to-r from-amber-600 to-yellow-400'
            }`}
            style={{ width: `${isFrenzyCoolingDown ? 0 : frenzyProgress}%` }}
          />
        </div>
      </div>

      {/* Purely Circular Radial Glows */}
      <div className={`absolute w-[300px] h-[300px] rounded-full pointer-events-none -z-10 transition-all duration-500 ${
        frenzyActive ? 'frenzy-aura' : 'radial-aura-1'
      }`} />
      <div className="absolute w-[240px] h-[240px] rounded-full radial-aura-2 pointer-events-none -z-10" />

      {/* Soft Radial Shockwave Ring on Frenzy Tap */}
      {frenzyActive && shockwaveKey > 0 && (
        <div
          key={shockwaveKey}
          className="absolute w-72 h-72 rounded-full border-4 border-fuchsia-400/60 pointer-events-none animate-ping duration-300 z-10"
        />
      )}

      {/* Overdrive Particle Embers Surrounding Coin */}
      {frenzyActive && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-t from-amber-400 to-fuchsia-400 animate-ember-float"
              style={{
                left: `${15 + (i * 10)}%`,
                top: `${60 + (i % 3) * 10}%`,
                animationDelay: `${i * 0.18}s`,
                filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.8))',
              }}
            />
          ))}
        </div>
      )}

      {/* Dynamic Floating Particle System with 1-Second Auto Fade & Cleanup */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {displayParticles.map((p) => (
          <span
            key={p.id}
            onAnimationEnd={() => onRemoveParticle && onRemoveParticle(p.id)}
            className={`absolute font-black animate-float-fade tracking-tight pointer-events-none select-none ${
              p.isCrit
                ? 'text-fuchsia-300 text-4xl sm:text-5xl drop-shadow-[0_4px_16px_rgba(217,70,239,1)]'
                : frenzyActive
                ? 'text-amber-300 text-4xl sm:text-5xl drop-shadow-[0_4px_16px_rgba(245,158,11,1)]'
                : 'text-amber-300 text-3xl sm:text-4xl drop-shadow-[0_4px_12px_rgba(245,158,11,0.9)]'
            }`}
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
            }}
          >
            {p.isCrit
              ? `🔥 CRIT +${p.value}!`
              : frenzyActive
              ? `⚡ ${frenzyMultiplier}X +${p.value}`
              : `+${p.value}`}
          </span>
        ))}
      </div>

      {/* Main Tap Coin Container with Circular Progress Gauge Overlay */}
      <div className="relative flex items-center justify-center overflow-visible border-none bg-transparent outline-none">
        
        {/* Circular Gauge around Coin (SVG Ring) */}
        <svg className="absolute -inset-5 w-[calc(100%+40px)] h-[calc(100%+40px)] pointer-events-none z-20 overflow-visible" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke={isFrenzyCoolingDown ? '#f43f5e' : frenzyActive ? '#e084fc' : frenzyProgress > 50 ? '#f59e0b' : '#fbbf24'}
            strokeWidth="4"
            strokeDasharray="289"
            strokeDashoffset={289 - (289 * (isFrenzyCoolingDown ? 0 : frenzyProgress)) / 100}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out transform -rotate-90 origin-center drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
          />
        </svg>

        {/* Coin Button with Dynamic coin-bounce CSS Class */}
        <div
          ref={coinRef}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{
            ...tiltStyle,
            willChange: 'transform',
          }}
          className={`coin-outer-ring relative w-64 h-64 sm:w-72 sm:h-72 rounded-full p-2.5 flex items-center justify-center cursor-pointer transition-transform duration-75 outline-none focus:outline-none focus:ring-0 border-none select-none ${
            isTapping ? 'coin-bounce' : ''
          } ${frenzyActive ? 'scale-105 shadow-[0_0_50px_rgba(217,70,239,0.9)] animate-frenzy-bounce' : ''} ${
            disabled ? 'opacity-50 cursor-not-allowed filter grayscale-[0.4]' : ''
          }`}
        >
          {/* Inner Coin Disc */}
          <div
            style={{
              background: activeSkin.id === 'silver_shield'
                ? 'radial-gradient(circle at 35% 35%, #f8fafc 0%, #94a3b8 40%, #334155 75%, #0f172a 100%)'
                : activeSkin.id === 'neon_cyber' || frenzyActive
                ? 'radial-gradient(circle at 35% 35%, #fae8ff 0%, #c084fc 40%, #7e22ce 75%, #3b0764 100%)'
                : activeSkin.id === 'vip_gold_mic'
                ? 'radial-gradient(circle at 35% 35%, #fef9c3 0%, #eab308 45%, #a16207 80%, #713f12 100%)'
                : 'radial-gradient(circle at 35% 35%, #fde68a 0%, #f59e0b 40%, #d97706 75%, #78350f 100%)',
            }}
            className="relative w-full h-full rounded-full flex flex-col items-center justify-center p-4 overflow-hidden shadow-inner border-none outline-none"
          >
            {/* Diagonal Shine Flare */}
            <div className="coin-shine-flare" />

            {/* Coin Center Emblem */}
            <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none select-none">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 p-1 flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.4)]">
                <div className="w-full h-full rounded-full bg-gradient-to-b from-amber-500 to-amber-700 flex flex-col items-center justify-center border border-amber-200/50 text-5xl sm:text-6xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                  {frenzyActive ? '🔥' : activeSkin.symbolIcon}
                </div>
              </div>

              <span className="mt-2 text-xs font-black uppercase tracking-widest text-amber-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {frenzyActive ? (frenzyMultiplier >= 5 ? '⚡ MAX OVERDRIVE!' : `🔥 ${frenzyMultiplier}X MULTIPLIER!`) : activeSkin.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
