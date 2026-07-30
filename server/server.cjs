const express = require('express');
const cors = require('cors');
const { syncUser, getReferrals, updateScore, claimReferralRewards, resetUser, getAsync } = require('./db.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// POST /api/sync-user - Register or sync user
app.post('/api/sync-user', async (req, res) => {
  try {
    const { telegramId, username, firstName, referredBy } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: 'telegramId is required' });
    }

    const result = await syncUser({
      telegramId,
      username,
      firstName,
      referredBy,
    });

    res.json({
      success: true,
      isNew: result.isNew,
      user: {
        telegramId: result.user.telegram_id,
        username: result.user.username,
        firstName: result.user.first_name,
        score: result.user.score,
        lifetimeScore: result.user.lifetime_score || result.user.score,
        diamonds: result.user.diamonds !== undefined ? result.user.diamonds : 50,
        petUpgradeCards: result.user.pet_upgrade_cards !== undefined ? result.user.pet_upgrade_cards : 5,
        unclaimedReferralRewards: result.user.unclaimed_referral_rewards || 0,
        referralCount: result.user.referral_count,
        referredBy: result.user.referred_by,
      },
      bonusAwarded: result.bonusAwarded || false,
    });
  } catch (err) {
    console.error('Error syncing user:', err);
    res.status(500).json({ error: 'Failed to sync user', details: err.message });
  }
});

// GET /api/user/:telegramId - Fetch user profile
app.get('/api/user/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const user = await getAsync('SELECT * FROM users WHERE telegram_id = ?', [String(telegramId)]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        telegramId: user.telegram_id,
        username: user.username,
        firstName: user.first_name,
        score: user.score,
        lifetimeScore: user.lifetime_score || user.score,
        diamonds: user.diamonds !== undefined ? user.diamonds : 50,
        petUpgradeCards: user.pet_upgrade_cards !== undefined ? user.pet_upgrade_cards : 5,
        unclaimedReferralRewards: user.unclaimed_referral_rewards || 0,
        referralCount: user.referral_count,
        referredBy: user.referred_by,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user', details: err.message });
  }
});

// GET /api/referrals/:telegramId - Fetch referred friends list
app.get('/api/referrals/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const list = await getReferrals(telegramId);

    const formattedList = list.map((item) => ({
      id: item.referee_id,
      username: item.username || `User_${item.referee_id.slice(-4)}`,
      firstName: item.first_name || 'Anonymous',
      bonusAwarded: item.bonus_awarded,
      createdAt: item.created_at,
    }));

    res.json({
      success: true,
      referrals: formattedList,
      totalCount: formattedList.length,
      totalEarned: formattedList.length * 25000,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch referrals', details: err.message });
  }
});

// POST /api/update-score - Sync score, diamonds & petUpgradeCards state
app.post('/api/update-score', async (req, res) => {
  try {
    const { telegramId, score, lifetimeScore, diamonds, petUpgradeCards } = req.body;
    if (!telegramId || score === undefined) {
      return res.status(400).json({ error: 'telegramId and score are required' });
    }

    const updated = await updateScore(telegramId, score, lifetimeScore, diamonds, petUpgradeCards);
    res.json({
      success: true,
      score: updated.score,
      lifetimeScore: updated.lifetime_score,
      diamonds: updated.diamonds,
      petUpgradeCards: updated.pet_upgrade_cards,
      unclaimedReferralRewards: updated.unclaimed_referral_rewards || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update score', details: err.message });
  }
});

// POST /api/claim-referral-rewards - Claim passive 5% referral commission
app.post('/api/claim-referral-rewards', async (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) {
      return res.status(400).json({ error: 'telegramId is required' });
    }

    const result = await claimReferralRewards(telegramId);
    res.json({
      success: true,
      claimedAmount: result.claimedAmount,
      score: result.user.score,
      lifetimeScore: result.user.lifetime_score,
      unclaimedReferralRewards: 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to claim referral rewards', details: err.message });
  }
});

// POST /api/reset-user - Reset dev user state to Level 1 and 0 points
app.post('/api/reset-user', async (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) {
      return res.status(400).json({ error: 'telegramId is required' });
    }

    const updated = await resetUser(telegramId);
    res.json({
      success: true,
      score: 0,
      lifetimeScore: 0,
      diamonds: 50,
      petUpgradeCards: 5,
      unclaimedReferralRewards: 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset user state', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
