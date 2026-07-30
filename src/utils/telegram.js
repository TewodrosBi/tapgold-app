// Telegram WebApp SDK Integration Utility

export const BOT_USERNAME = 'YouTubeMinerAppBot';

export const getTelegramWebApp = () => {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
};

export const initTelegramApp = () => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();
  }
};

export const getTelegramUserInfo = () => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }
  const user = tg?.initDataUnsafe?.user;

  return {
    telegramId: String(user?.id || 12345678),
    username: user?.username || user?.first_name || 'demo_user',
    firstName: user?.first_name || 'Demo',
    lastName: user?.last_name || '',
  };
};

export const getReferralCode = () => {
  const tg = getTelegramWebApp();
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) {
    const startParam = tg.initDataUnsafe.start_param;
    if (startParam.startsWith('ref_')) {
      return startParam.replace('ref_', '');
    }
  }
  return null;
};

export const getReferralLink = (userId) => {
  return `https://t.me/${BOT_USERNAME}/app?startapp=ref_${userId}`;
};

export const openTelegramShareDrawer = (url, text) => {
  const tg = getTelegramWebApp();
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  if (tg && tg.openTelegramLink) {
    tg.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, '_blank');
  }
};

export const triggerHaptic = (style = 'light') => {
  const tg = getTelegramWebApp();
  if (!tg || !tg.HapticFeedback) return;

  try {
    if (style === 'heavy' || style === 'light' || style === 'medium') {
      tg.HapticFeedback.impactOccurred(style);
    } else if (style === 'success' || style === 'error' || style === 'warning') {
      tg.HapticFeedback.notificationOccurred(style);
    } else if (style === 'selection') {
      tg.HapticFeedback.selectionChanged();
    }
  } catch (e) {}
};
