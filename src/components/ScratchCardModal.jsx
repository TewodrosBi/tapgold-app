import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Gift, CheckCircle2, Clock, Sparkles, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateScratchPrize, getScratchCooldown, getExtraScratchCost, getScratchConfig } from '../utils/scratch';
import { triggerHaptic } from '../utils/telegram';
import { soundEngine } from '../utils/audio';

export const ScratchCardModal = ({
  score = 0,
  rankLevel = 1,
  rankName = 'Bronze',
  lastScratchTimestamp,
  dailyCardsBoughtCount = 0,
  onClaimReward,
  onBuyExtraScratch,
  onClose,
}) => {
  const canvasRef = useRef(null);
  const [isScratchedOff, setIsScratchedOff] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [prize, setPrize] = useState(null);
  const [cooldownState, setCooldownState] = useState(() => getScratchCooldown(lastScratchTimestamp));
  const isDrawingRef = useRef(false);

  const rankConfig = getScratchConfig(rankLevel);
  const extraCardCost = getExtraScratchCost(dailyCardsBoughtCount);
  const isCapReached = dailyCardsBoughtCount >= rankConfig.maxScratches;

  const initNewCard = useCallback(() => {
    const generatedPrize = generateScratchPrize(rankLevel);
    setPrize(generatedPrize);
    setIsScratchedOff(false);
    setRewardClaimed(false);

    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('SCRATCH HERE! 🪙', canvas.width / 2, canvas.height / 2 + 5);
    }, 50);
  }, []);

  // Initialize random prize on mount
  useEffect(() => {
    initNewCard();
  }, [initNewCard]);

  // Countdown timer ticker if on cooldown
  useEffect(() => {
    if (!cooldownState.onCooldown) return;

    const timer = setInterval(() => {
      const state = getScratchCooldown(lastScratchTimestamp);
      setCooldownState(state);
    }, 1000);

    return () => clearInterval(timer);
  }, [lastScratchTimestamp, cooldownState.onCooldown]);

  const checkScratchPercentage = useCallback(() => {
    if (isScratchedOff || !prize) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let clearedCount = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) clearedCount++;
    }

    const percentage = (clearedCount / (pixels.length / 4)) * 100;

    if (percentage >= 50 && !isScratchedOff) {
      setIsScratchedOff(true);
      triggerHaptic('success');
      soundEngine.playBoostSound();

      try {
        confetti({
          particleCount: prize.isJackpot ? 120 : 60,
          spread: prize.isJackpot ? 100 : 70,
          origin: { y: 0.5 },
        });

        // Stop confetti animations after 2 seconds to prevent Telegram WebView memory crashes
        setTimeout(() => {
          try {
            if (typeof confetti.reset === 'function') {
              confetti.reset();
            }
          } catch (e) {}
        }, 2000);
      } catch (e) {}

      setTimeout(() => {
        onClaimReward(prize);
        setRewardClaimed(true);
      }, 500);
    }
  }, [isScratchedOff, prize, onClaimReward]);

  const scratch = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    checkScratchPercentage();
  };

  const handleMouseDown = (e) => {
    isDrawingRef.current = true;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    if (isDrawingRef.current) {
      scratch(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
  };

  const handleTouchStart = (e) => {
    isDrawingRef.current = true;
    const touch = e.touches[0];
    if (touch) scratch(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e) => {
    if (isDrawingRef.current) {
      const touch = e.touches[0];
      if (touch) scratch(touch.clientX, touch.clientY);
    }
  };

  const handleBuyOnDemand = () => {
    if (isCapReached || score < extraCardCost) {
      triggerHaptic('error');
      soundEngine.playEmptyEnergySound();
      return;
    }

    triggerHaptic('success');
    soundEngine.playBoostSound();
    onBuyExtraScratch(extraCardCost);
    setCooldownState({ onCooldown: false, remainingFormatted: '' });
    initNewCard();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-[#0d0d12] border border-amber-500/30 p-5 text-center shadow-[0_0_50px_rgba(245,158,11,0.3)] animate-scale-up">
        
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
        <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
          <Gift className="w-7 h-7" />
        </div>

        {/* Title & Rank Allowance Header */}
        <h3 className="text-xl font-black text-amber-200 mb-1">Fortune Scratch</h3>
        <div className="inline-block px-3 py-1 mb-3 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black">
          Daily Scratches: {Math.min(dailyCardsBoughtCount, rankConfig.maxScratches)} / {rankConfig.maxScratches} ({rankConfig.name} Tier)
        </div>

        {/* 24-Hour Cooldown or Scratch Surface View */}
        {dailyCardsBoughtCount >= rankConfig.maxScratches && cooldownState.onCooldown && !rewardClaimed ? (
          <div className="py-4 px-2">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-3 flex flex-col items-center">
              <Clock className="w-7 h-7 text-amber-400 mb-1 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Daily Scratch Limit Reached ({rankConfig.maxScratches}/{rankConfig.maxScratches})
              </span>
              <span className="text-2xl font-mono font-black text-amber-300">
                {cooldownState.remainingFormatted}
              </span>
            </div>

            {/* Extra Card Purchase Button */}
            <button
              onClick={handleBuyOnDemand}
              disabled={score < extraCardCost}
              className={`w-full py-3 rounded-xl text-xs font-black tracking-wider flex items-center justify-center gap-2 transition-all ${
                score >= extraCardCost
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 hover:brightness-110 active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>BUY EXTRA CARD ({new Intl.NumberFormat('en-US').format(extraCardCost)} 🪙)</span>
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-3">Swipe over the card below to reveal your fortune!</p>

            {/* Scratch Card Surface */}
            <div className={`relative w-64 h-36 mx-auto rounded-2xl overflow-hidden border-2 shadow-xl p-4 flex flex-col items-center justify-center transition-all ${
              prize?.isJackpot
                ? 'border-amber-400 bg-gradient-to-tr from-amber-500/40 via-yellow-400/30 to-amber-600/40 shadow-amber-500/30'
                : 'border-amber-500/40 bg-gradient-to-tr from-amber-500/30 to-yellow-400/20'
            }`}>
              
              {/* Prize Badge */}
              {prize && (
                <span className="absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full bg-black/60 border border-white/20 text-amber-300 uppercase">
                  {prize.badge}
                </span>
              )}

              {/* Hidden Revealed Layer */}
              {prize && (
                <div className="flex flex-col items-center justify-center z-0">
                  <span className="text-4xl mb-1 drop-shadow">{prize.icon}</span>
                  <span className="text-xs font-black uppercase text-amber-200 tracking-wider mb-0.5">{prize.title}</span>
                  <span className="text-sm font-black text-amber-300 drop-shadow">{prize.rewardText}</span>
                </div>
              )}

              {/* Interactive Canvas Coating */}
              <canvas
                ref={canvasRef}
                width={256}
                height={144}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
                className={`absolute inset-0 w-full h-full cursor-pointer z-10 transition-opacity duration-500 ${
                  isScratchedOff ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              />
            </div>

            {/* Status Bar */}
            <div className="mt-3">
              {rewardClaimed ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Reward Claimed! ({prize?.rewardText})</span>
                  </div>

                  {/* Next Card / Buy Extra Card Action */}
                  {dailyCardsBoughtCount < rankConfig.maxScratches ? (
                    <button
                      onClick={initNewCard}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-xs tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>SCRATCH AGAIN ({dailyCardsBoughtCount} / {rankConfig.maxScratches})</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleBuyOnDemand}
                      disabled={score < extraCardCost}
                      className={`w-full py-2.5 rounded-xl text-xs font-black tracking-wider flex items-center justify-center gap-2 transition-all ${
                        score >= extraCardCost
                          ? 'bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-500 text-slate-950 hover:brightness-110 active:scale-95 shadow-md cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      <span>BUY EXTRA CARD ({new Intl.NumberFormat('en-US').format(extraCardCost)} 🪙)</span>
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-xs font-semibold text-amber-400/80 animate-pulse">
                  {isScratchedOff ? 'Unlocking Prize...' : 'Scratch 50% of the surface to claim'}
                </span>
              )}
            </div>
          </>
        )}

        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="w-full mt-3 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs border border-white/10"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
