const express = require('express');
const cors = require('cors');
const { syncUser, getReferrals, updateScore, getAsync } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// POST /api/sync-user - Register or sync user with referral processing
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

// GET /api/user/:telegramId - Fetch user details
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

// POST /api/update-score - Sync score state
app.post('/api/update-score', async (req, res) => {
  try {
    const { telegramId, score } = req.body;
    if (!telegramId || score === undefined) {
      return res.status(400).json({ error: 'telegramId and score are required' });
    }

    const updated = await updateScore(telegramId, score);
    res.json({ success: true, score: updated.score });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update score', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
