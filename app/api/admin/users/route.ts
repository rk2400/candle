import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { withAdminAuth } from '@/lib/middleware';

export const GET = withAdminAuth(async (req) => {
  try {
    await connectDB();

    const users = await User.find()
      .select('name email phone createdAt locked')
      .sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
});



