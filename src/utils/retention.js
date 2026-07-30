// Retention Systems Utilities (Offline Income, Daily Streak, Mystery Combo)

// 1. Offline Passive Income (Capped at 3 Hours)
export const MAX_OFFLINE_HOURS = 3;

export const calculateOfflineIncome = (profitPerHour, lastClaimedTimestamp) => {
  if (!profitPerHour || profitPerHour <= 0 || !lastClaimedTimestamp) {
    return { earned: 0, hoursElapsed: 0, capped: false };
  }

  const now = Date.now();
  const elapsedMs = Math.max(0, now - lastClaimedTimestamp);
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  if (elapsedHours < 0.01) {
    // Less than 36 seconds, treat as zero offline earnings
    return { earned: 0, hoursElapsed: 0, capped: false };
  }

  const effectiveHours = Math.min(MAX_OFFLINE_HOURS, elapsedHours);
  const earned = Math.floor(effectiveHours * profitPerHour);
  const capped = elapsedHours > MAX_OFFLINE_HOURS;

  return {
    earned,
    hoursElapsed: Number(elapsedHours.toFixed(1)),
    effectiveHours: Number(effectiveHours.toFixed(1)),
    capped,
  };
};

// 2. Daily Check-in Streak Rewards
export const STREAK_REWARDS = [
  { day: 1, reward: 1000, label: '1K' },
  { day: 2, reward: 5000, label: '5K' },
  { day: 3, reward: 15000, label: '15K' },
  { day: 4, reward: 50000, label: '50K' },
  { day: 5, reward: 100000, label: '100K' },
  { day: 6, reward: 250000, label: '250K' },
  { day: 7, reward: 1000000, label: '1M 👑' },
];

export const getStreakStatus = (lastCheckInTimestamp, currentStreak = 0) => {
  if (!lastCheckInTimestamp) {
    return { canCheckIn: true, streak: 1, isReset: false };
  }

  const now = new Date();
  const lastDate = new Date(lastCheckInTimestamp);

  // Strip time portion to compare calendar days
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastCheckDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

  const diffTime = today.getTime() - lastCheckDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays === 0) {
    // Already checked in today
    return { canCheckIn: false, streak: currentStreak, isReset: false };
  } else if (diffDays === 1) {
    // Consecutive day check-in
    const nextStreak = currentStreak >= 7 ? 1 : currentStreak + 1;
    return { canCheckIn: true, streak: nextStreak, isReset: false };
  } else {
    // Missed a day -> reset to Day 1
    return { canCheckIn: true, streak: 1, isReset: true };
  }
};

// 3. Daily Mystery Combo Cards
export const SECRET_COMBO_IDS = ['hire_editor', 'camera_4k', 'studio_space'];
export const COMBO_JACKPOT = 5000000;

export const UPGRADE_CARDS = [
  {
    id: 'hire_editor',
    name: 'Hire Video Editor',
    desc: 'Professional editing team',
    baseCost: 1500,
    baseProfit: 450,
    icon: '✂️',
  },
  {
    id: 'camera_4k',
    name: '4K Cinema Camera',
    desc: 'Ultra high definition production',
    baseCost: 4000,
    baseProfit: 1200,
    icon: '🎥',
  },
  {
    id: 'studio_space',
    name: 'Studio Space',
    desc: 'Dedicated filming studio',
    baseCost: 12000,
    baseProfit: 3800,
    icon: '🎙️',
  },
  {
    id: 'gpu_rig',
    name: 'AI Rendering Rig',
    desc: 'High speed rendering farm',
    baseCost: 35000,
    baseProfit: 9500,
    icon: '💻',
  },
  {
    id: 'social_manager',
    name: 'Social Media Manager',
    desc: 'Viral marketing campaign',
    baseCost: 90000,
    baseProfit: 24000,
    icon: '📱',
  },
];
