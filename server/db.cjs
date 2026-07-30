const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize Tables & Schema Migrations
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id TEXT PRIMARY KEY,
      username TEXT,
      first_name TEXT,
      score INTEGER DEFAULT 0,
      lifetime_score INTEGER DEFAULT 0,
      diamonds INTEGER DEFAULT 50,
      pet_upgrade_cards INTEGER DEFAULT 5,
      unclaimed_referral_rewards INTEGER DEFAULT 0,
      referral_count INTEGER DEFAULT 0,
      referred_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration checks
  db.run(`ALTER TABLE users ADD COLUMN lifetime_score INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN diamonds INTEGER DEFAULT 50`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN pet_upgrade_cards INTEGER DEFAULT 5`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN unclaimed_referral_rewards INTEGER DEFAULT 0`, () => {});

  db.run(`
    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referrer_id TEXT NOT NULL,
      referee_id TEXT NOT NULL UNIQUE,
      bonus_awarded INTEGER DEFAULT 25000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(referrer_id) REFERENCES users(telegram_id),
      FOREIGN KEY(referee_id) REFERENCES users(telegram_id)
    )
  `);
});

const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Atomic Sync User & Referral Payout Function
const syncUser = async ({ telegramId, username = '', firstName = '', referredBy = null }) => {
  const cleanId = String(telegramId);
  const cleanReferredBy = referredBy ? String(referredBy) : null;

  const existingUser = await getAsync('SELECT * FROM users WHERE telegram_id = ?', [cleanId]);
  if (existingUser) {
    return {
      isNew: false,
      user: {
        ...existingUser,
        lifetime_score: existingUser.lifetime_score || existingUser.score,
        diamonds: existingUser.diamonds !== undefined ? existingUser.diamonds : 50,
        pet_upgrade_cards: existingUser.pet_upgrade_cards !== undefined ? existingUser.pet_upgrade_cards : 5,
        unclaimed_referral_rewards: existingUser.unclaimed_referral_rewards || 0,
      },
    };
  }

  try {
    await runAsync('BEGIN IMMEDIATE');

    let baseScore = 0;
    let baseDiamonds = 50;
    let isValidReferral = false;

    if (cleanReferredBy && cleanReferredBy !== cleanId) {
      const inviter = await getAsync('SELECT * FROM users WHERE telegram_id = ?', [cleanReferredBy]);
      if (inviter) {
        isValidReferral = true;

        // Credit inviter: +25,000 Coins & +25 Diamonds
        await runAsync(
          'UPDATE users SET score = score + 25000, lifetime_score = lifetime_score + 25000, diamonds = diamonds + 25, referral_count = referral_count + 1 WHERE telegram_id = ?',
          [cleanReferredBy]
        );

        await runAsync(
          'INSERT INTO referrals (referrer_id, referee_id, bonus_awarded) VALUES (?, ?, 25000)',
          [cleanReferredBy, cleanId]
        );

        baseScore = 25000;
        baseDiamonds = 75;
      }
    }

    await runAsync(
      'INSERT INTO users (telegram_id, username, first_name, score, lifetime_score, diamonds, pet_upgrade_cards, referred_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [cleanId, username, firstName, baseScore, baseScore, baseDiamonds, 5, isValidReferral ? cleanReferredBy : null]
    );

    await runAsync('COMMIT');

    const newUser = await getAsync('SELECT * FROM users WHERE telegram_id = ?', [cleanId]);
    return { isNew: true, user: newUser, bonusAwarded: isValidReferral };
  } catch (err) {
    await runAsync('ROLLBACK');
    throw err;
  }
};

const getReferrals = async (telegramId) => {
  return await allAsync(
    `SELECT r.referee_id, r.bonus_awarded, r.created_at, u.username, u.first_name, u.score as referee_score 
     FROM referrals r 
     LEFT JOIN users u ON r.referee_id = u.telegram_id 
     WHERE r.referrer_id = ? 
     ORDER BY r.created_at DESC`,
    [String(telegramId)]
  );
};

const updateScore = async (telegramId, score, lifetimeScore, diamonds, petUpgradeCards) => {
  const existing = await getAsync('SELECT * FROM users WHERE telegram_id = ?', [String(telegramId)]);
  if (!existing) return null;

  const prevScore = existing.score || 0;
  const delta = score - prevScore;

  if (delta > 0 && existing.referred_by) {
    const commission = Math.min(50000, Math.floor(delta * 0.05));
    if (commission > 0) {
      await runAsync(
        'UPDATE users SET unclaimed_referral_rewards = unclaimed_referral_rewards + ? WHERE telegram_id = ?',
        [commission, String(existing.referred_by)]
      );
    }
  }

  const newDiamonds = diamonds !== undefined ? diamonds : existing.diamonds;
  const newCards = petUpgradeCards !== undefined ? petUpgradeCards : existing.pet_upgrade_cards;

  await runAsync(
    'UPDATE users SET score = ?, lifetime_score = ?, diamonds = ?, pet_upgrade_cards = ? WHERE telegram_id = ?',
    [score, lifetimeScore || score, newDiamonds, newCards, String(telegramId)]
  );

  return await getAsync('SELECT * FROM users WHERE telegram_id = ?', [String(telegramId)]);
};

const claimReferralRewards = async (telegramId) => {
  const user = await getAsync('SELECT * FROM users WHERE telegram_id = ?', [String(telegramId)]);
  if (!user) throw new Error('User not found');

  const unclaimed = user.unclaimed_referral_rewards || 0;
  if (unclaimed <= 0) return { claimedAmount: 0, user };

  try {
    await runAsync('BEGIN IMMEDIATE');

    await runAsync(
      'UPDATE users SET score = score + ?, lifetime_score = lifetime_score + ?, unclaimed_referral_rewards = 0 WHERE telegram_id = ?',
      [unclaimed, unclaimed, String(telegramId)]
    );

    await runAsync('COMMIT');

    const updatedUser = await getAsync('SELECT * FROM users WHERE telegram_id = ?', [String(telegramId)]);
    return { claimedAmount: unclaimed, user: updatedUser };
  } catch (err) {
    await runAsync('ROLLBACK');
    throw err;
  }
};

// Reset Dev User State
const resetUser = async (telegramId) => {
  await runAsync(
    'UPDATE users SET score = 0, lifetime_score = 0, diamonds = 50, pet_upgrade_cards = 5, unclaimed_referral_rewards = 0 WHERE telegram_id = ?',
    [String(telegramId)]
  );
  return await getAsync('SELECT * FROM users WHERE telegram_id = ?', [String(telegramId)]);
};

module.exports = {
  db,
  syncUser,
  getReferrals,
  updateScore,
  claimReferralRewards,
  resetUser,
  getAsync,
};
