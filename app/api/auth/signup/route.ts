import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { signupSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, email, phone } = signupSchema.parse(body);

    // Normalize email (lowercase and trim) - schema will also lowercase on save
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists (email is stored lowercase due to schema)
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      // Reuse existing user record instead of creating a duplicate
      return NextResponse.json({
        success: true,
        message: 'Account already exists. Please login instead.',
        user: {
          id: existingUser._id.toString(),
          name: existingUser.name || '',
          email: existingUser.email,
          phone: existingUser.phone || '',
        },
      });
    }

    // Create new user with normalized email
    try {
      const user = await User.create({ 
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        verified: false 
      });

      return NextResponse.json({
        success: true,
        message: 'Account created successfully. Please login to continue.',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      });
    } catch (err: any) {
      // Defensive duplicate-key handling (race conditions)
      if (err?.code === 11000) {
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
          return NextResponse.json({
            success: true,
            message: 'Account already exists. Please login instead.',
            user: {
              id: existing._id.toString(),
              name: existing.name || '',
              email: existing.email,
              phone: existing.phone || '',
            },
          });
        }
      }

      console.error('Signup DB error:', err);
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 400 }
    );
  }
}

