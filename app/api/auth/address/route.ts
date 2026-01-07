import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthRequest } from '@/lib/middleware';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';

async function handler(req: AuthRequest) {
  try {
    await connectDB();

    if (!req.user || req.user.type !== 'user' || !req.user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const addr = body?.address;
    // Expect structured address: { street, city, state, pincode, full? }
    if (!addr || typeof addr !== 'object') {
      return NextResponse.json({ error: 'Invalid address payload' }, { status: 400 });
    }

    const { street = '', city = '', state = '', pincode = '', full = '' } = addr;
    const pin = String(pincode || '').trim();
    // Basic pincode validation: 6 digits
    if (!/^[0-9]{6}$/.test(pin)) {
      return NextResponse.json({ error: 'Invalid pincode. Must be 6 digits' }, { status: 400 });
    }

    const fullAddress = full && full.trim().length ? String(full).trim() : `${street}, ${city}, ${state} - ${pin}`;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $set: {
          address: {
            full: fullAddress,
            street: String(street).trim(),
            city: String(city).trim(),
            state: String(state).trim(),
            pincode: pin,
          },
        },
      },
      { new: true }
    );

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, user: { id: user._id, address: user.address } });
  } catch (error: any) {
    console.error('Save address error:', error);
    return NextResponse.json({ error: 'Failed to save address' }, { status: 500 });
  }
}

export const POST = withAuth(handler);
