import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import OTP from '@/lib/models/OTP';
import { generateToken } from '@/lib/auth';
import { verifyOTPSchema } from '@/lib/validations';
import { adminConfig } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, code } = verifyOTPSchema.parse(body);

    console.log('[auth/verify-otp] Incoming verify request', { url: req.url, method: req.method });
    console.log('[auth/verify-otp] Headers:', Object.fromEntries(req.headers.entries()));
    console.log('[auth/verify-otp] Body:', { email, code });

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Find OTP (use normalized email)
    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      code,
      used: false,
      expiresAt: { $gt: new Date() },
    });
    console.log('[auth/verify-otp] OTP lookup result for', normalizedEmail, !!otpRecord);

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();
    console.log('[auth/verify-otp] OTP marked used for', normalizedEmail);

    // Find user (use normalized email)
    let user = await User.findOne({ email: normalizedEmail });

    // If no user exists but email matches configured admin email, allow admin OTP login
    if (!user && normalizedEmail === adminConfig.email.toLowerCase()) {
      const Admin = (await import('@/lib/models/Admin')).default;
      let admin = await Admin.findOne({ email: normalizedEmail });
      if (!admin) {
        // Create admin record automatically using ADMIN_PASSWORD from config
        console.log('[auth/verify-otp] Admin record missing for', normalizedEmail, '- creating using ADMIN_PASSWORD');
        const { hashPassword } = await import('@/lib/auth');
        const { adminConfig: cfg } = await import('@/lib/config');
        const passwordHash = await hashPassword(cfg.password);
        admin = await Admin.create({ email: normalizedEmail, passwordHash });
        console.log('[auth/verify-otp] Admin created:', admin._id.toString());
      }

      // Generate admin token (use adminId)
      const token = generateToken({
        adminId: admin._id.toString(),
        email: admin.email,
        type: 'admin',
      });
      console.log('[auth/verify-otp] Generated admin token for', admin.email);

      const response = NextResponse.json({
        success: true,
        user: {
          id: admin._id.toString(),
          name: '',
          email: admin.email,
          phone: '',
          isAdmin: true,
        },
      });

      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
      console.log('[auth/verify-otp] Set token cookie for admin', admin.email);

      return response;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Account not found. Please create an account first.' },
        { status: 404 }
      );
    }

    // Block login if user account is locked
    if (user.locked) {
      return NextResponse.json(
        { error: 'Your account is locked. Please contact support to unlock.' },
        { status: 403 }
      );
    }

    // Mark user as verified
    user.verified = true;
    await user.save();

    // Check if user is admin (email matches ADMIN_EMAIL)
    const isAdmin = user.email.toLowerCase() === adminConfig.email.toLowerCase();

    // Generate token with appropriate type
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      type: isAdmin ? 'admin' : 'user',
    });

    // Set cookie
    // Return sanitized user and set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name || '',
        email: user.email,
        phone: user.phone || '',
        isAdmin,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/', // Ensure cookie is available site-wide
    });

    return response;
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify OTP' },
      { status: 400 }
    );
  }
}
