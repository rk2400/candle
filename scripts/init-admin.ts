/**
 * Initialize Admin User
 * Run this script to create the first admin user
 * 
 * Usage: npx ts-node scripts/init-admin.ts
 */

import mongoose from 'mongoose';
import Admin from '../lib/models/Admin';
import { hashPassword } from '../lib/auth';
import { dbConfig, adminConfig } from '../lib/config';

async function initAdmin() {
  try {
    await mongoose.connect(dbConfig.uri);
    console.log('Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email: adminConfig.email });
    if (existingAdmin) {
      console.log('Admin already exists. Updating password...');
      existingAdmin.passwordHash = await hashPassword(adminConfig.password);
      await existingAdmin.save();
      console.log('Admin password updated!');
    } else {
      // Create new admin
      const passwordHash = await hashPassword(adminConfig.password);
      await Admin.create({
        email: adminConfig.email,
        passwordHash,
      });
      console.log('Admin created successfully!');
    }

    console.log(`\nAdmin Credentials:`);
    console.log(`Email: ${adminConfig.email}`);
    console.log(`Password: ${adminConfig.password}`);
    console.log(`\n⚠️  Please change the password after first login!`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error initializing admin:', error);
    process.exit(1);
  }
}

initAdmin();

