/**
 * Fix User Emails - Normalize all user emails
 * Run this script to fix duplicate key errors by normalizing all user emails
 * 
 * Usage: npx ts-node scripts/fix-user-emails.ts
 */

import mongoose from 'mongoose';
import User from '../lib/models/User';
import OTP from '../lib/models/OTP';
import { dbConfig } from '../lib/config';

async function fixUserEmails() {
  try {
    await mongoose.connect(dbConfig.uri);
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to process`);

    let updated = 0;
    let duplicates: string[] = [];

    for (const user of users) {
      const normalizedEmail = user.email.toLowerCase().trim();
      
      // If email is already normalized, skip
      if (user.email === normalizedEmail) {
        continue;
      }

      // Check if normalized email already exists
      const existingUser = await User.findOne({ 
        email: normalizedEmail,
        _id: { $ne: user._id }
      });

      if (existingUser) {
        console.log(`⚠️  Duplicate found: ${user.email} conflicts with ${normalizedEmail}`);
        duplicates.push(user.email);
        // Optionally: merge or delete the duplicate
        // For now, we'll just log it
        continue;
      }

      // Update user email to normalized version
      user.email = normalizedEmail;
      await user.save();
      updated++;
      console.log(`✓ Normalized: ${user.email} → ${normalizedEmail}`);
    }

    // Also normalize OTP emails
    const otps = await OTP.find({});
    console.log(`\nFound ${otps.length} OTP records to process`);
    
    let otpUpdated = 0;
    for (const otp of otps) {
      const normalizedEmail = otp.email.toLowerCase().trim();
      if (otp.email !== normalizedEmail) {
        otp.email = normalizedEmail;
        await otp.save();
        otpUpdated++;
      }
    }

    console.log(`\n✅ Email normalization complete!`);
    console.log(`   Users updated: ${updated}`);
    console.log(`   OTPs updated: ${otpUpdated}`);
    
    if (duplicates.length > 0) {
      console.log(`\n⚠️  Found ${duplicates.length} duplicate emails that need manual resolution:`);
      duplicates.forEach(email => console.log(`   - ${email}`));
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error fixing user emails:', error);
    process.exit(1);
  }
}

fixUserEmails();



