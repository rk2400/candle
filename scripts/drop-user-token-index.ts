/**
 * Drop legacy index 'user_token_1' on users collection if present.
 * Usage: npx ts-node scripts/drop-user-token-index.ts
 */

import mongoose from 'mongoose';
import { dbConfig } from '../lib/config';

async function dropIndex() {
  try {
    await mongoose.connect(dbConfig.uri);
    console.log('Connected to MongoDB at', dbConfig.uri);

    const db = mongoose.connection.db;
    if (!db) {
      console.error('Connected but `mongoose.connection.db` is undefined');
      await mongoose.disconnect();
      process.exit(1);
    }
    const collection = db.collection('users');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));

    const target = indexes.find(i => i.name === 'user_token_1');
    if (!target) {
      console.log("Index 'user_token_1' not found. No action needed.");
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log("Dropping index 'user_token_1'...");
    await collection.dropIndex('user_token_1');
    console.log("Index 'user_token_1' dropped successfully.");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error dropping index:', err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

if (require.main === module) {
  dropIndex();
}
