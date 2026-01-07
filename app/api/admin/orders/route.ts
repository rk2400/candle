import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/lib/models/Order';
import { withAdminAuth } from '@/lib/middleware';

export const GET = withAdminAuth(async (req) => {
  try {
    await connectDB();

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone')
      .populate('products.productId', 'name images');

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Admin get orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
});

