import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin from '@/lib/models/Admin';
import { comparePassword, generateToken } from '@/lib/auth';
import { adminLoginSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, password } = adminLoginSchema.parse(body);
    console.log('[auth/admin/login] Incoming admin login', { url: req.url, method: req.method });
    console.log('[auth/admin/login] Headers:', Object.fromEntries(req.headers.entries()));
    console.log('[auth/admin/login] Body:', { email });

    // Find admin
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    console.log('[auth/admin/login] Admin lookup result for', email.toLowerCase(), !!admin);
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const isValid = await comparePassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate token
    const token = generateToken({
      adminId: admin._id.toString(),
      email: admin.email,
      type: 'admin',
    });
    console.log('[auth/admin/login] Generated admin token for', admin.email);

    // Set cookie
    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/', // Ensure cookie is available site-wide
    });
    console.log('[auth/admin/login] Set token cookie for admin', admin.email);

    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to login' },
      { status: 400 }
    );
  }
}


