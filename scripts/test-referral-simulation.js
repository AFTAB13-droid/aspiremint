/**
 * ASPIREMINT REFERRAL & WALLET SIMULATION SCRIPT
 * 
 * Usage:
 *   node scripts/test-referral-simulation.js seed   -> Creates 1 test referral & ₹90 pending withdrawal
 *   node scripts/test-referral-simulation.js clean  -> Deletes all test data with zero trace
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  });
}

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

const command = process.argv[2] || 'seed';

async function main() {
  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB.');

  const db = mongoose.connection.db;

  if (command === 'seed') {
    console.log('\n🚀 SEEDING TEST REFERRAL & WITHDRAWAL REQUEST...');

    // 1. Create or find test referrer
    const usersCol = db.collection('users');
    let referrer = await usersCol.findOne({ email: 'rohit.test@aspiremint.local' });
    if (!referrer) {
      const res = await usersCol.insertOne({
        name: 'Rohit Sharma (Test Buyer)',
        email: 'rohit.test@aspiremint.local',
        mobile: '9876543210',
        role: 'USER',
        aspireMintId: 'TEST-AM9921',
        referralId: 'TEST-AM-SEED',
        isProfileComplete: true,
        isActive: true,
        isApproved: true,
        totalCompletedOrders: 5,
        paymentDetails: {
          upiId: 'rohit.test@okhdfcbank',
          bankName: 'HDFC Bank',
          accountHolder: 'Rohit Sharma',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      referrer = await usersCol.findOne({ _id: res.insertedId });
    }

    // 2. Create or find test referee
    let referee = await usersCol.findOne({ email: 'ananya.test@aspiremint.local' });
    if (!referee) {
      const res = await usersCol.insertOne({
        name: 'Ananya Verma (Test Referee)',
        email: 'ananya.test@aspiremint.local',
        mobile: '9876543211',
        role: 'USER',
        aspireMintId: 'TEST-AM9922',
        referralId: 'ANANYA-REF-TEST',
        isProfileComplete: true,
        isActive: true,
        isApproved: true,
        totalCompletedOrders: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      referee = await usersCol.findOne({ _id: res.insertedId });
    }

    // 3. Create or update test referral record
    const referralsCol = db.collection('referrals');
    let referral = await referralsCol.findOne({ referee: referee._id });
    if (!referral) {
      await referralsCol.insertOne({
        referrer: referrer._id,
        referee: referee._id,
        referralCode: 'TEST-AM-SEED',
        status: 'FULLY_COMPLETED',
        hasAmazonOrder: true,
        baseRewardEarned: true,
        followOnCount: 4,
        totalEarned: 90,
        orders: [
          {
            orderId: new mongoose.Types.ObjectId(),
            marketplace: 'Amazon',
            orderSequence: 1,
            rewardAmount: 50,
            status: 'AVAILABLE',
            note: 'Amazon Anchor Order (Verified)',
          },
          {
            orderId: new mongoose.Types.ObjectId(),
            marketplace: 'Flipkart',
            orderSequence: 2,
            rewardAmount: 10,
            status: 'AVAILABLE',
            note: 'Follow-on Order 1',
          },
          {
            orderId: new mongoose.Types.ObjectId(),
            marketplace: 'Amazon',
            orderSequence: 3,
            rewardAmount: 10,
            status: 'AVAILABLE',
            note: 'Follow-on Order 2',
          },
          {
            orderId: new mongoose.Types.ObjectId(),
            marketplace: 'Myntra',
            orderSequence: 4,
            rewardAmount: 10,
            status: 'AVAILABLE',
            note: 'Follow-on Order 3',
          },
          {
            orderId: new mongoose.Types.ObjectId(),
            marketplace: 'Flipkart',
            orderSequence: 5,
            rewardAmount: 10,
            status: 'AVAILABLE',
            note: 'Follow-on Order 4',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 4. Create or update test wallet
    const walletsCol = db.collection('wallets');
    let wallet = await walletsCol.findOne({ userId: referrer._id });
    if (!wallet) {
      const res = await walletsCol.insertOne({
        userId: referrer._id,
        walletId: 'WLT-TEST-AM9921',
        balance: 0,
        availableBalance: 0,
        pendingBalance: 0,
        lifetimeEarned: 90,
        lifetimeSpent: 0,
        lifetimeWithdrawn: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      wallet = await walletsCol.findOne({ _id: res.insertedId });
    }

    // 5. Create pending withdrawal transaction
    const txCol = db.collection('transactions');
    await txCol.deleteMany({ referenceId: { $regex: /TEST-WITHDRAW/ } });

    await txCol.insertOne({
      walletId: wallet._id,
      sender: referrer._id,
      type: 'DEBIT',
      category: 'WITHDRAWAL_REQUEST',
      amount: 90,
      balanceAfter: 0,
      status: 'PENDING',
      referenceId: `TEST-WITHDRAW-${Date.now()}`,
      note: '🧪 TEST Payout Request: ₹90 via UPI (rohit.test@okhdfcbank)',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ TEST DATA CREATED SUCCESSFULLY!');
    console.log('\nWhat to test now:');
    console.log('1. Open AspireMint Admin: http://localhost:3000/app/admin/referrals (or your deployed URL)');
    console.log('2. In the "Action Required: Buyer Withdrawal Requests" queue, you will see:');
    console.log('   • Buyer: Rohit Sharma (TEST-AM9921)');
    console.log('   • Amount: ₹90');
    console.log('   • Note: rohit.test@okhdfcbank');
    console.log('3. Click "Approve (UTR)", enter any sample UTR (e.g. UTR8492019482), and confirm payout.');
    console.log('4. The payout will disburse with audio chime and move to Completed!');
    console.log('5. Whenever you want to remove it, either click "Clean Test Data" in the Admin UI or run:');
    console.log('   node scripts/test-referral-simulation.js clean\n');

  } else if (command === 'clean') {
    console.log('\n🧹 CLEANING ALL SIMULATION TEST DATA...');

    const testEmails = ['rohit.test@aspiremint.local', 'ananya.test@aspiremint.local'];
    const usersCol = db.collection('users');
    const testUsers = await usersCol.find({ email: { $in: testEmails } }).toArray();
    const testUserIds = testUsers.map(u => u._id);

    // 1. Delete transactions
    const txCol = db.collection('transactions');
    const txRes = await txCol.deleteMany({
      $or: [
        { referenceId: { $regex: /TEST/i } },
        { sender: { $in: testUserIds } },
      ],
    });

    // 2. Delete referrals
    const referralsCol = db.collection('referrals');
    const refRes = await referralsCol.deleteMany({
      $or: [
        { referralCode: 'TEST-AM-SEED' },
        { referrer: { $in: testUserIds } },
        { referee: { $in: testUserIds } },
      ],
    });

    // 3. Delete wallets
    const walletsCol = db.collection('wallets');
    const wltRes = await walletsCol.deleteMany({
      $or: [
        { walletId: { $regex: /TEST/i } },
        { userId: { $in: testUserIds } },
      ],
    });

    // 4. Delete users
    const usrRes = await usersCol.deleteMany({ email: { $in: testEmails } });

    console.log(`✅ Cleaned:`);
    console.log(`   • ${txRes.deletedCount} test transactions removed`);
    console.log(`   • ${refRes.deletedCount} test referrals removed`);
    console.log(`   • ${wltRes.deletedCount} test wallets removed`);
    console.log(`   • ${usrRes.deletedCount} test users removed`);
    console.log('✅ Database is 100% clean with zero test records left!\n');
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
