// scripts/initCounters.js
// Initialize counters collection for complaints based on current max complaintNumber

import('dotenv/config');
import { MongoClient } from 'mongodb';

async function run() {
  const url = process.env.MONGO_URI || 'mongodb://localhost:27017/fyp';
  const client = new MongoClient(url);

  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME || 'fyp');

    const complaints = db.collection('complaints');
    const counters = db.collection('counters');

    const last = await complaints
      .find()
      .sort({ complaintNumber: -1 })
      .limit(1)
      .toArray();
    const currentSeq =
      last.length > 0 && last[0].complaintNumber ? last[0].complaintNumber : 0;

    await counters.updateOne(
      { _id: 'complaints' },
      { $set: { seq: currentSeq } },
      { upsert: true }
    );

    console.log('Initialized counters for complaints to', currentSeq);
    process.exit(0);
  } catch (err) {
    console.error('Failed to initialize counters:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
