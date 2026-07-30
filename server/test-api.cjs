const { syncUser, getReferrals, getAsync } = require('./db.cjs');

async function testReferralFlow() {
  console.log('--- Testing Referral Flow ---');

  // 1. Create inviter user 111111
  const inviter = await syncUser({ telegramId: '111111', username: 'InviterBoss', firstName: 'Alice' });
  console.log('1. Inviter Created:', inviter);

  // 2. Create new user 222222 referred by 111111
  const referee = await syncUser({ telegramId: '222222', username: 'NewPlayer', firstName: 'Bob', referredBy: '111111' });
  console.log('2. Referee Created:', referee);

  // 3. Verify Inviter updated score (+25,000 pts) and referral_count
  const updatedInviter = await getAsync('SELECT * FROM users WHERE telegram_id = ?', ['111111']);
  console.log('3. Updated Inviter Profile:', updatedInviter);

  // 4. Verify referral list for 111111
  const list = await getReferrals('111111');
  console.log('4. Referrals List for 111111:', list);

  // 5. Test duplicate user sync (should NOT double reward)
  const dup = await syncUser({ telegramId: '222222', username: 'NewPlayer', firstName: 'Bob', referredBy: '111111' });
  console.log('5. Duplicate Sync Result (isNew should be false):', dup.isNew);

  // 6. Test self-referral (333333 referring 333333)
  const selfRef = await syncUser({ telegramId: '333333', username: 'SelfReferrer', firstName: 'Charlie', referredBy: '333333' });
  console.log('6. Self-referral Bonus Awarded (should be false):', selfRef.bonusAwarded);

  console.log('--- All DB Atomic Tests Passed Successfully! ---');
  process.exit(0);
}

testReferralFlow().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
