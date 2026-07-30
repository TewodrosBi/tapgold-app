// Fortune Scratch Weighted Probability Engine & Daily Purchase Limit Utilities

export const SCRATCH_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 Hours

export const getExtraScratchCost = (scratchesToday = 0) => {
  return 50000 * (Number(scratchesToday || 0) + 1);
};

export const getScratchConfig = (rankLevel = 1) => {
  const level = Math.min(6, Math.max(1, Number(rankLevel) || 1));
  switch (level) {
    case 1: // Bronze
      return { level: 1, name: 'Bronze', maxScratches: 5, coinMin: 100, coinMax: 10000, coinsMin: 100, coinsMax: 10000, diamondMin: 1, diamondMax: 5, diaMin: 1, diaMax: 5, cardChance: 0.1, cardsMin: 0, cardsMax: 1 };
    case 2: // Silver
      return { level: 2, name: 'Silver', maxScratches: 10, coinMin: 1000, coinMax: 35000, coinsMin: 1000, coinsMax: 35000, diamondMin: 3, diamondMax: 10, diaMin: 3, diaMax: 10, cardChance: 0.2, cardsMin: 1, cardsMax: 2 };
    case 3: // Gold
      return { level: 3, name: 'Gold', maxScratches: 15, coinMin: 10000, coinMax: 150000, coinsMin: 10000, coinsMax: 150000, diamondMin: 5, diamondMax: 20, diaMin: 5, diaMax: 20, cardChance: 0.35, cardsMin: 1, cardsMax: 3 };
    case 4: // Platinum
      return { level: 4, name: 'Platinum', maxScratches: 20, coinMin: 100000, coinMax: 1000000, coinsMin: 100000, coinsMax: 1000000, diamondMin: 10, diamondMax: 35, diaMin: 10, diaMax: 35, cardChance: 0.5, cardsMin: 2, cardsMax: 5 };
    case 5: // Diamond
      return { level: 5, name: 'Diamond', maxScratches: 25, coinMin: 500000, coinMax: 5000000, coinsMin: 500000, coinsMax: 5000000, diamondMin: 15, diamondMax: 50, diaMin: 15, diaMax: 50, cardChance: 0.7, cardsMin: 3, cardsMax: 8 };
    case 6: // Legendary
    default:
      return { level: 6, name: 'Legendary', maxScratches: 30, coinMin: 2000000, coinMax: 25000000, coinsMin: 2000000, coinsMax: 25000000, diamondMin: 25, diamondMax: 100, diaMin: 25, diaMax: 100, cardChance: 1.0, cardsMin: 5, cardsMax: 15 };
  }
};

export const generateScratchPrize = (rankLevel = 1) => {
  const config = getScratchConfig(rankLevel);
  const rand = Math.random() * 100;

  if (rand < 25) {
    // 25% Chance: Pet Upgrade Cards Drop
    const cardAmount = Math.floor(Math.random() * (config.cardsMax - config.cardsMin + 1)) + config.cardsMin;
    const finalCards = Math.max(1, cardAmount);
    return {
      type: 'pet_cards',
      title: '🎴 PET CARDS DROP!',
      coinAmount: 0,
      diamondAmount: 0,
      cardAmount: finalCards,
      rewardText: `+${finalCards} PET CARDS!`,
      icon: '🎴',
      badge: 'PET CARDS (25%)',
    };
  } else if (rand < 55) {
    // 30% Chance: Diamond Cache
    const diamondAmount = Math.floor(Math.random() * (config.diaMax - config.diaMin + 1)) + config.diaMin;
    return {
      type: 'diamonds',
      title: '💎 DIAMOND REWARD!',
      coinAmount: 0,
      diamondAmount: diamondAmount,
      cardAmount: 0,
      rewardText: `+${diamondAmount} DIAMONDS!`,
      icon: '💎',
      badge: 'DIAMONDS (30%)',
    };
  } else {
    // 45% Chance: Coins Cache
    const coinAmount = Math.floor(Math.random() * (config.coinsMax - config.coinsMin + 1)) + config.coinsMin;
    return {
      type: 'coins',
      title: '🪙 COIN TREASURE!',
      coinAmount: coinAmount,
      diamondAmount: 0,
      cardAmount: 0,
      rewardText: `+${coinAmount.toLocaleString()} COINS!`,
      icon: '🪙',
      badge: 'COINS (45%)',
    };
  }
};

export const getScratchCooldown = (lastScratchTimestamp) => {
  if (!lastScratchTimestamp) return { onCooldown: false, remainingMs: 0, remainingFormatted: '00:00:00' };
  const elapsed = Date.now() - Number(lastScratchTimestamp);
  const remaining = SCRATCH_COOLDOWN_MS - elapsed;

  if (remaining <= 0) {
    return { onCooldown: false, remainingMs: 0, remainingFormatted: '00:00:00' };
  }

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  const formatted = [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':');

  return {
    onCooldown: true,
    remainingMs: remaining,
    remainingFormatted: formatted,
  };
};
