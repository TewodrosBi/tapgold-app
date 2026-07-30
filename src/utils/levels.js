// 3. High Rank Thresholds (Lifetime Score Progression Economy)

export const RANK_TIERS = [
  {
    level: 1,
    name: 'Bronze Miner',
    shortName: 'Bronze',
    minScore: 0,
    maxScore: 50000,
    basePointsPerTap: 1,
    badgeIcon: '🥉',
    color: 'text-amber-500',
    bgClass: 'bg-[#0f0c0a]',
    radialGlowClass: 'from-amber-600/20 via-orange-500/10 to-transparent',
    scoreGradient: 'from-amber-500 via-orange-400 to-amber-600',
    scoreGlow: 'drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]',
  },
  {
    level: 2,
    name: 'Silver Miner',
    shortName: 'Silver',
    minScore: 50000,
    maxScore: 500000,
    basePointsPerTap: 3,
    badgeIcon: '🥈',
    color: 'text-slate-300',
    bgClass: 'bg-[#0d0f12]',
    radialGlowClass: 'from-slate-400/20 via-slate-500/10 to-transparent',
    scoreGradient: 'from-slate-100 via-slate-300 to-slate-400',
    scoreGlow: 'drop-shadow-[0_0_25px_rgba(203,213,225,0.6)]',
  },
  {
    level: 3,
    name: 'Gold Miner',
    shortName: 'Gold',
    minScore: 500000,
    maxScore: 5000000,
    basePointsPerTap: 8,
    badgeIcon: '🥇',
    color: 'text-yellow-400',
    bgClass: 'bg-[#120e0a]',
    radialGlowClass: 'from-amber-500/25 via-yellow-500/15 to-transparent',
    scoreGradient: 'from-amber-200 via-yellow-400 to-amber-500',
    scoreGlow: 'drop-shadow-[0_0_25px_rgba(245,158,11,0.7)]',
  },
  {
    level: 4,
    name: 'Platinum Miner',
    shortName: 'Platinum',
    minScore: 5000000,
    maxScore: 50000000,
    basePointsPerTap: 20,
    badgeIcon: '💎',
    color: 'text-cyan-300',
    bgClass: 'bg-[#081214]',
    radialGlowClass: 'from-cyan-500/25 via-teal-500/15 to-transparent',
    scoreGradient: 'from-cyan-100 via-teal-300 to-emerald-400',
    scoreGlow: 'drop-shadow-[0_0_30px_rgba(6,182,212,0.8)]',
  },
  {
    level: 5,
    name: 'Diamond Master',
    shortName: 'Diamond',
    minScore: 50000000,
    maxScore: 500000000,
    basePointsPerTap: 50,
    badgeIcon: '👑',
    color: 'text-sky-300',
    bgClass: 'bg-[#080d1a]',
    radialGlowClass: 'from-sky-500/30 via-blue-600/20 to-transparent',
    scoreGradient: 'from-sky-200 via-blue-400 to-indigo-500',
    scoreGlow: 'drop-shadow-[0_0_30px_rgba(56,189,248,0.8)]',
  },
  {
    level: 6,
    name: 'Legendary Creator',
    shortName: 'Legendary',
    minScore: 1000000000,
    maxScore: Infinity,
    basePointsPerTap: 100,
    badgeIcon: '🌟',
    color: 'text-fuchsia-300',
    bgClass: 'bg-[#100a18]',
    radialGlowClass: 'from-fuchsia-500/35 via-purple-600/25 to-transparent',
    scoreGradient: 'from-fuchsia-300 via-purple-400 to-indigo-600',
    scoreGlow: 'drop-shadow-[0_0_35px_rgba(217,70,239,0.9)]',
  },
];

export const getLevelInfo = (score) => {
  const currentScore = Math.max(0, score);

  let tierIndex = RANK_TIERS.findIndex(
    (tier) => currentScore >= tier.minScore && currentScore < tier.maxScore
  );

  if (tierIndex === -1) {
    tierIndex = RANK_TIERS.length - 1;
  }

  const currentTier = RANK_TIERS[tierIndex];
  const nextTier = RANK_TIERS[tierIndex + 1] || null;

  let progress = 100;
  let remainingPoints = 0;

  if (nextTier) {
    const range = currentTier.maxScore - currentTier.minScore;
    const earned = currentScore - currentTier.minScore;
    progress = Math.min(100, Math.max(0, (earned / range) * 100));
    remainingPoints = Math.max(0, currentTier.maxScore - currentScore);
  }

  return {
    currentTier,
    currentLevel: currentTier.level,
    nextTier,
    progress,
    remainingPoints,
    basePointsPerTap: currentTier.basePointsPerTap,
    levelIndex: tierIndex,
  };
};

export const calculateRank = (coins = 0) => {
  const currentCoins = Math.max(0, Number(coins) || 0);
  if (currentCoins >= 1000000000) return { level: 6, name: 'Legendary Creator' };
  if (currentCoins >= 50000000) return { level: 5, name: 'Diamond Master' };
  if (currentCoins >= 5000000) return { level: 4, name: 'Platinum Miner' };
  if (currentCoins >= 500000) return { level: 3, name: 'Gold Miner' };
  if (currentCoins >= 50000) return { level: 2, name: 'Silver Miner' };
  return { level: 1, name: 'Bronze Miner' };
};
