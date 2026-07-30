const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize Tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id TEXT PRIMARY KEY,
      username TEXT,
      first_name TEXT,
      score INTEGER DEFAULT 1000,
      referral_count INTEGER DEFAULT 0,
      referred_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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

// Helper wrapper for DB queries using Promises
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

  // 1. Check if user already exists
  const existingUser = await getAsync('SELECT * FROM users WHERE telegram_id = ?', [cleanId]);
  if (existingUser) {
    return { isNew: false, user: existingUser };
  }

  // 2. Perform atomic insertion & referral payout transaction
  try {
    await runAsync('BEGIN IMMEDIATE');

    let baseScore = 1000;
    let isValidReferral = false;

    // Check if inviter exists and is not self
    if (cleanReferredBy && cleanReferredBy !== cleanId) {
      const inviter = await getAsync('SELECT * FROM users WHERE telegram_id = ?', [cleanReferredBy]);
      if (inviter) {
        isValidReferral = true;
        // Credit Inviter +25,000 points & increment referral count
        await runAsync(
          'UPDATE users SET score = score + 25000, referral_count = referral_count + 1 WHERE telegram_id = ?',
          [cleanReferredBy]
        );

        // Record referral entry
        await runAsync(
          'INSERT INTO referrals (referrer_id, referee_id, bonus_awarded) VALUES (?, ?, 25000)',
          [cleanReferredBy, cleanId]
        );

        // Credit new user with +25,000 welcome bonus
        baseScore += 25000;
      }
    }

    // Insert new user
    await runAsync(
      'INSERT INTO users (telegram_id, username, first_name, score, referred_by) VALUES (?, ?, ?, ?, ?)',
      [cleanId, username, firstName, baseScore, isValidReferral ? cleanReferredBy : null]
    );

    await runAsync('COMMIT');

    const newUser = await getAsync('SELECT * FROM users WHERE telegram_id = ?', [cleanId]);
    return { isNew: true, user: newUser, bonusAwarded: isValidReferral };
  } catch (err) {
    await runAsync('ROLLBACK');
    throw err;
  }
};

// Get User Referral List
const getReferrals = async (telegramId) => {
  return await allAsync(
    `SELECT r.referee_id, r.bonus_awarded, r.created_at, u.username, u.first_name 
     FROM referrals r 
     LEFT JOIN users u ON r.referee_id = u.telegram_id 
     WHERE r.referrer_id = ? 
     ORDER BY r.created_at DESC`,
    [String(telegramId)]
  );
};

// Update User Score
const updateScore = async (telegramId, score) => {
  await runAsync('UPDATE users SET score = ? WHERE telegram_id = ?', [score, String(telegramId)]);
  return await getAsync('SELECT * FROM users WHERE telegram_id = ?', [String(telegramId)]);
};

module.exports = {
  db,
  syncUser,
  getReferrals,
  updateScore,
  getAsync,
};
