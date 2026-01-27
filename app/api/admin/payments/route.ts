import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/lib/models/Order';
import { withAdminAuth, AuthRequest } from '@/lib/middleware';

async function handler(req: AuthRequest) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      // Get all PAYMENT_SUBMITTED orders for admin verification
      const orders = await Order.find({ paymentStatus: 'PAYMENT_SUBMITTED' })
        .sort({ paymentSubmittedAt: -1 })
        .lean();

      return NextResponse.json({ orders });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    console.error('Admin payments error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments' },
      { status: 400 }
    );
  }
}

export const GET = withAdminAuth(handler);
