import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/lib/models/Order';
import { withAuth, AuthRequest } from '@/lib/middleware';

async function handler(req: AuthRequest) {
  try {
    await connectDB();

    if (!req.user || req.user.type !== 'user' || !req.user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await Order.find({ 
      userId: req.user.userId,
      paymentStatus: { $ne: 'PENDING' }
    })
      .sort({ createdAt: -1 })
      .populate('products.productId', 'name images');

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);


