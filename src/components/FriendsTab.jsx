import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Copy, Share2, Sparkles, Check, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerHaptic, openTelegramShareDrawer, getReferralLink } from '../utils/telegram';
import { soundEngine } from '../utils/audio';

export const FriendsTab = ({ userProfile, unclaimedReferralRewards = 0, onClaimReferralRewards }) => {
  const [copied, setCopied] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const telegramId = userProfile?.telegramId || '12345678';
  const referralLink = getReferralLink(telegramId);
  const shareText = '🎮 Join me on YouTube Miner TG Mini App! Tap to earn coins, unlock custom skins, and level up our studio together!';

  // Fetch referred friends list & unclaimed passive rewards from backend
  useEffect(() => {
    fetch(`/api/referrals/${telegramId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFriendsList(data.referrals);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [telegramId]);

  const handleShareTelegram = () => {
    triggerHaptic('impact');
    openTelegramShareDrawer(referralLink, shareText);
  };

  const handleCopyLink = () => {
    triggerHaptic('selection');
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaimPassiveCommission = () => {
    if (unclaimedReferralRewards <= 0 || claiming) return;

    setClaiming(true);
    triggerHaptic('success');
    soundEngine.playBoostSound();

    fetch('/api/claim-referral-rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.claimedAmount > 0) {
          try {
            confetti({
              particleCount: 100,
              spread: 90,
              origin: { y: 0.5 },
            });
          } catch (e) {}

          const amountFormatted = new Intl.NumberFormat('en-US').format(data.claimedAmount);
          setToastMessage(`🎉 Claimed +${amountFormatted} Coins from your squad!`);
          setTimeout(() => setToastMessage(null), 3000);

          onClaimReferralRewards(data.claimedAmount);
        }
      })
      .catch(() => {})
      .finally(() => setClaiming(false));
  };

  return (
    <div className="w-full px-4 py-3 select-none space-y-4">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-14 left-4 right-4 z-50 p-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-2xl flex items-center justify-between animate-bounce">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="px-1 text-slate-950">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel-amber rounded-2xl p-5 text-center relative overflow-hidden border border-amber-500/30">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
          <Users className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-black text-amber-200 mb-1">Invite Friends & Earn 5% Passive</h3>
        <p className="text-xs text-slate-300">
          Get <span className="text-amber-300 font-bold">+25,000 Coins</span> instantly per friend + <span className="text-amber-300 font-bold">5% Passive Commission</span> from all their earnings!
        </p>
      </div>

      {/* 3. Claim Passive 5% Squad Commission Card */}
      <div className="glass-panel rounded-2xl p-4 shadow-xl border border-amber-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400 animate-bounce" />
            <h4 className="text-sm font-extrabold text-amber-200">5% Squad Passive Earnings</h4>
          </div>
          <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
            5% Commission
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-3 rounded-xl bg-black/40 border border-white/10">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Friends Invited</div>
            <div className="text-lg font-black text-amber-300">{friendsList.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-white/10">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Pending Commission</div>
            <div className="text-lg font-black text-emerald-400">
              +{new Intl.NumberFormat('en-US').format(unclaimedReferralRewards)} 🪙
            </div>
          </div>
        </div>

        <button
          onClick={handleClaimPassiveCommission}
          disabled={unclaimedReferralRewards <= 0 || claiming}
          className={`w-full py-3 rounded-xl text-xs font-black tracking-wider flex items-center justify-center gap-2 transition-all ${
            unclaimedReferralRewards > 0
              ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 active:scale-95 animate-pulse'
              : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {unclaimedReferralRewards > 0
              ? `CLAIM ALL (+${new Intl.NumberFormat('en-US').format(unclaimedReferralRewards)} COINS)`
              : 'NO PENDING REWARDS'}
          </span>
        </button>
      </div>

      {/* Share & Deep Link Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleShareTelegram}
          className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-xs tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>Invite a Friend</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
        </button>
      </div>

      {/* Friends List */}
      <div className="glass-panel rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-black text-amber-300 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-amber-400" />
            Your Invited Squad ({friendsList.length})
          </h4>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400 animate-pulse">Loading squad members...</div>
        ) : friendsList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No friends invited yet. Share your deep link to start earning +25k + 5% commission!
          </div>
        ) : (
          <div className="space-y-2">
            {friendsList.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center border border-amber-500/30">
                    {friend.firstName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-amber-100">{friend.firstName}</div>
                    <div className="text-[10px] text-slate-400">@{friend.username}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-amber-400">+25,000 🪙</div>
                  <div className="text-[9px] text-emerald-400 font-bold">+5% Passive</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
